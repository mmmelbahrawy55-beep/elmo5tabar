import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface EncryptionKey {
  id: string;
  version: number;
  algorithm: string;
  status: 'active' | 'retired' | 'compromised' | 'rotating';
  createdAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  service: string;
  metadata?: Record<string, any>;
}

export interface RotationPolicy {
  keyId: string;
  service: string;
  rotationIntervalDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
  lastRotation: string | null;
  nextRotation: string | null;
}

export interface KeyHealth {
  totalKeys: number;
  activeKeys: number;
  retiredKeys: number;
  compromisedKeys: number;
  keysExpiringSoon: number;
  expiredKeys: number;
  lastRotation: string | null;
  averageKeyAge: number;
  services: Array<{ name: string; activeKeys: number; lastRotation: string | null }>;
}

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);
  private readonly rotationPolicies: RotationPolicy[];
  private readonly keyStore: Map<string, EncryptionKey> = new Map();
  private readonly MASTER_KEY_ID = 'master-encryption-key';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.rotationPolicies = this.loadPolicies();
    this.initializeKeyStore();
  }

  private loadPolicies(): RotationPolicy[] {
    const now = new Date();
    return [
      { keyId: 'master-aes', service: 'data-encryption', rotationIntervalDays: 90, autoRotate: true, notifyBeforeDays: 14, lastRotation: null, nextRotation: null },
      { keyId: 'jwt-signing', service: 'authentication', rotationIntervalDays: 30, autoRotate: true, notifyBeforeDays: 7, lastRotation: null, nextRotation: null },
      { keyId: 'jwt-refresh', service: 'authentication', rotationIntervalDays: 60, autoRotate: true, notifyBeforeDays: 7, lastRotation: null, nextRotation: null },
      { keyId: 'api-encryption', service: 'api-gateway', rotationIntervalDays: 90, autoRotate: true, notifyBeforeDays: 14, lastRotation: null, nextRotation: null },
      { keyId: 'payment-encryption', service: 'payments', rotationIntervalDays: 30, autoRotate: true, notifyBeforeDays: 7, lastRotation: null, nextRotation: null },
      { keyId: 'phi-encryption', service: 'hipaa', rotationIntervalDays: 60, autoRotate: true, notifyBeforeDays: 14, lastRotation: null, nextRotation: null },
      { keyId: 'session-encryption', service: 'sessions', rotationIntervalDays: 90, autoRotate: true, notifyBeforeDays: 14, lastRotation: null, nextRotation: null },
      { keyId: 'backup-encryption', service: 'backup', rotationIntervalDays: 180, autoRotate: true, notifyBeforeDays: 30, lastRotation: null, nextRotation: null },
    ];
  }

  private initializeKeyStore(): void {
    for (const policy of this.rotationPolicies) {
      const key: EncryptionKey = {
        id: policy.keyId,
        version: 1,
        algorithm: 'AES-256-GCM',
        status: 'active',
        createdAt: new Date(Date.now() - policy.rotationIntervalDays * 86400000 * 2).toISOString(),
        service: policy.service,
        metadata: { inUse: true, algorithm: 'AES-256-GCM', keyLength: 256, mode: 'GCM' },
      };
      this.keyStore.set(policy.keyId, key);
    }
    this.updateRotationSchedule();
  }

  private updateRotationSchedule(): void {
    const now = new Date();
    for (const policy of this.rotationPolicies) {
      policy.lastRotation = this.keyStore.get(policy.keyId)?.createdAt || null;
      if (policy.lastRotation) {
        policy.nextRotation = new Date(
          new Date(policy.lastRotation).getTime() + policy.rotationIntervalDays * 86400000,
        ).toISOString();
      } else {
        policy.nextRotation = now.toISOString();
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledRotationCheck(): Promise<void> {
    this.logger.log('Running scheduled key rotation check');
    const now = new Date();

    for (const policy of this.rotationPolicies) {
      if (!policy.nextRotation) continue;

      const nextRotation = new Date(policy.nextRotation);
      const daysUntilRotation = Math.round((nextRotation.getTime() - now.getTime()) / 86400000);

      if (daysUntilRotation <= 0 && policy.autoRotate) {
        try {
          await this.rotateKey(policy.keyId);
          this.logger.log(`Auto-rotated key: ${policy.keyId} (${policy.service})`);
        } catch (error) {
          this.logger.error(`Auto-rotation failed for ${policy.keyId}: ${error.message}`);
          await this.createAlert(
            `Key rotation failed: ${policy.keyId}`,
            `Auto-rotation of key ${policy.keyId} (${policy.service}) failed: ${error.message}`,
            'critical',
          );
        }
      } else if (daysUntilRotation > 0 && daysUntilRotation <= policy.notifyBeforeDays) {
        this.logger.warn(
          `Key ${policy.keyId} (${policy.service}) expires in ${daysUntilRotation} days`,
        );
        if (daysUntilRotation <= 3) {
          await this.createAlert(
            `Key expiration imminent: ${policy.keyId}`,
            `Key ${policy.keyId} (${policy.service}) will expire in ${daysUntilRotation} days. Immediate rotation required.`,
            daysUntilRotation <= 1 ? 'critical' : 'warning',
          );
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyKeyHealthReport(): Promise<void> {
    const health = await this.getKeyHealth();
    this.logger.log(
      `Weekly key health: ${health.activeKeys} active, ${health.keysExpiringSoon} expiring soon, ` +
        `${health.expiredKeys} expired, avg age ${health.averageKeyAge}d`,
    );

    if (health.keysExpiringSoon > 0) {
      await this.createAlert(
        `${health.keysExpiringSoon} keys expiring soon`,
        `Weekly key health report: ${health.keysExpiringSoon} encryption keys require rotation within 7 days`,
        'warning',
      );
    }

    if (health.expiredKeys > 0) {
      await this.createAlert(
        `${health.expiredKeys} expired keys detected`,
        `Weekly audit found ${health.expiredKeys} expired encryption keys that should be retired`,
        'warning',
      );
    }
  }

  async rotateKey(keyId: string): Promise<EncryptionKey> {
    const existingKey = this.keyStore.get(keyId);
    if (!existingKey) throw new Error(`Key ${keyId} not found`);

    const policy = this.rotationPolicies.find((p) => p.keyId === keyId);
    if (!policy) throw new Error(`Policy for key ${keyId} not found`);

    existingKey.status = 'retired';
    existingKey.rotatedAt = new Date().toISOString();

    const newKey: EncryptionKey = {
      id: keyId,
      version: existingKey.version + 1,
      algorithm: existingKey.algorithm,
      status: 'active',
      createdAt: new Date().toISOString(),
      service: existingKey.service,
      expiresAt: new Date(Date.now() + policy.rotationIntervalDays * 86400000 * 2).toISOString(),
      metadata: { inUse: true, previousVersion: existingKey.version, rotatedFrom: existingKey.createdAt },
    };

    this.keyStore.set(keyId, newKey);
    policy.lastRotation = newKey.createdAt;
    policy.nextRotation = new Date(
      new Date(policy.lastRotation).getTime() + policy.rotationIntervalDays * 86400000,
    ).toISOString();

    try {
      await (this.prisma as any).authDataVault.create({
        data: {
          userId: 'system',
          key: `key_rotation_${keyId}_v${newKey.version}`,
          value: JSON.stringify({ keyId, version: newKey.version, rotatedAt: newKey.createdAt, previousVersion: existingKey.version }),
          encrypted: true,
          metadata: { type: 'key_rotation', service: newKey.service },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist key rotation record: ${error.message}`);
    }

    this.logger.warn(`Key rotated: ${keyId} v${existingKey.version} -> v${newKey.version}`);
    return newKey;
  }

  async rotateKeysForService(service: string): Promise<EncryptionKey[]> {
    const policies = this.rotationPolicies.filter((p) => p.service === service);
    if (policies.length === 0) throw new Error(`No keys found for service: ${service}`);

    const results: EncryptionKey[] = [];
    for (const policy of policies) {
      const newKey = await this.rotateKey(policy.keyId);
      results.push(newKey);
    }
    return results;
  }

  async rotateAllKeys(): Promise<{ rotated: number; failed: number; keys: EncryptionKey[] }> {
    let rotated = 0;
    let failed = 0;
    const keys: EncryptionKey[] = [];

    for (const policy of this.rotationPolicies) {
      try {
        const newKey = await this.rotateKey(policy.keyId);
        keys.push(newKey);
        rotated++;
      } catch (error) {
        this.logger.error(`Failed to rotate ${policy.keyId}: ${error.message}`);
        failed++;
      }
    }

    this.logger.warn(`Bulk key rotation: ${rotated} rotated, ${failed} failed`);
    return { rotated, failed, keys };
  }

  async markKeyCompromised(keyId: string): Promise<EncryptionKey> {
    const key = this.keyStore.get(keyId);
    if (!key) throw new Error(`Key ${keyId} not found`);

    key.status = 'compromised';

    await this.createAlert(
      `Key marked as compromised: ${keyId}`,
      `Encryption key ${keyId} (${key.service}) has been marked as compromised. Immediate rotation required.`,
      'critical',
    );

    const newKey = await this.rotateKey(keyId);
    this.logger.warn(`Compromised key rotated: ${keyId} v${key.version} -> v${newKey.version}`);

    return newKey;
  }

  async getKey(keyId: string): Promise<EncryptionKey | null> {
    return this.keyStore.get(keyId) || null;
  }

  async getPolicies(): Promise<RotationPolicy[]> {
    return this.rotationPolicies;
  }

  async getKeyHealth(): Promise<KeyHealth> {
    const keys = Array.from(this.keyStore.values());
    const now = new Date();
    const expiringSoon: EncryptionKey[] = [];
    const expired: EncryptionKey[] = [];
    let totalAgeDays = 0;

    for (const key of keys) {
      const created = new Date(key.createdAt);
      const ageDays = Math.round((now.getTime() - created.getTime()) / 86400000);
      totalAgeDays += ageDays;

      if (key.expiresAt) {
        const expires = new Date(key.expiresAt);
        const daysUntilExpiry = Math.round((expires.getTime() - now.getTime()) / 86400000);
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) expiringSoon.push(key);
        if (daysUntilExpiry <= 0) expired.push(key);
      }
    }

    const servicesMap = new Map<string, { active: number; lastRotation: string | null }>();
    for (const key of keys) {
      const entry = servicesMap.get(key.service) || { active: 0, lastRotation: null };
      if (key.status === 'active') entry.active++;
      const keyCreated = key.createdAt;
      if (!entry.lastRotation || keyCreated > entry.lastRotation) entry.lastRotation = keyCreated;
      servicesMap.set(key.service, entry);
    }

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter((k) => k.status === 'active').length,
      retiredKeys: keys.filter((k) => k.status === 'retired').length,
      compromisedKeys: keys.filter((k) => k.status === 'compromised').length,
      keysExpiringSoon: expiringSoon.length,
      expiredKeys: expired.length,
      lastRotation: keys.filter((k) => k.rotatedAt).sort((a, b) => new Date(b.rotatedAt!).getTime() - new Date(a.rotatedAt!).getTime())[0]?.rotatedAt || null,
      averageKeyAge: keys.length > 0 ? Math.round(totalAgeDays / keys.length) : 0,
      services: Array.from(servicesMap.entries()).map(([name, data]) => ({
        name,
        activeKeys: data.active,
        lastRotation: data.lastRotation,
      })),
    };
  }

  async getRotationHistory(limit = 50): Promise<any[]> {
    const records = await (this.prisma as any).authDataVault.findMany({
      where: { key: { startsWith: 'key_rotation_' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((r: any) => {
      try {
        return { ...JSON.parse(r.value), recordedAt: r.createdAt };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  private async createAlert(title: string, description: string, severity: 'warning' | 'critical'): Promise<void> {
    try {
      const adminUsers = await (this.prisma as any).authUser.findMany({
        where: { role: { name: { in: ['SUPER_ADMIN', 'SECURITY_ADMIN'] } } },
        select: { id: true },
        take: 5,
      });

      for (const admin of adminUsers) {
        await (this.prisma as any).authSecurityAlert.create({
          data: {
            userId: admin.id,
            type: 'key_rotation',
            severity: severity.toUpperCase(),
            titleEn: title,
            titleAr: title,
            descriptionEn: description,
            descriptionAr: '',
            actionRequired: severity === 'critical',
            metadata: { service: 'key-rotation' },
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to create key rotation alert: ${error.message}`);
    }
  }
}
