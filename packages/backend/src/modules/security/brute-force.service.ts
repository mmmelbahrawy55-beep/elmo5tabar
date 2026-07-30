import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma/prisma.service';

interface BlockedEntry {
  attempts: number;
  windowStart: Date;
  blockedUntil?: Date;
}

interface BruteForceThreshold {
  maxAttempts: number;
  windowMinutes: number;
  blockMinutes: number;
}

const THRESHOLDS: Record<string, BruteForceThreshold> = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 15 },
  otp: { maxAttempts: 5, windowMinutes: 5, blockMinutes: 10 },
  password_reset: { maxAttempts: 3, windowMinutes: 30, blockMinutes: 30 },
};

const DEFAULT_THRESHOLD: BruteForceThreshold = { maxAttempts: 5, windowMinutes: 15, blockMinutes: 15 };

@Injectable()
export class BruteForceService implements OnModuleInit {
  private readonly logger = new Logger(BruteForceService.name);
  private readonly blocks = new Map<string, BlockedEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.recoverFromDatabase();
  }

  private getKey(identifier: string, type: string): string {
    return `${type}:${identifier}`;
  }

  private getThreshold(type: string): BruteForceThreshold {
    return THRESHOLDS[type] || DEFAULT_THRESHOLD;
  }

  private async recoverFromDatabase(): Promise<void> {
    try {
      const now = new Date();
      const records = await (this.prisma as any).authRateLimit.findMany({
        where: {
          OR: [
            { blockedUntil: { gt: now } },
            { blockedUntil: null },
          ],
        },
      });

      for (const record of records) {
        const key = this.getKey(record.identifier, record.action);
        const windowStart = new Date(record.windowStart);
        const threshold = this.getThreshold(record.action);
        const windowEnd = new Date(windowStart.getTime() + threshold.windowMinutes * 60 * 1000);

        if (now > windowEnd && !record.blockedUntil) {
          continue;
        }

        this.blocks.set(key, {
          attempts: record.attempts,
          windowStart,
          blockedUntil: record.blockedUntil ? new Date(record.blockedUntil) : undefined,
        });
      }

      this.logger.log(`Recovered ${this.blocks.size} brute-force entries from database`);
    } catch (error) {
      this.logger.error('Failed to recover brute-force data from database', error);
    }
  }

  async check(identifier: string, type: string): Promise<{ blocked: boolean; remainingTime?: number; attemptsLeft?: number }> {
    const key = this.getKey(identifier, type);
    const entry = this.blocks.get(key);
    const threshold = this.getThreshold(type);
    const now = new Date();

    if (!entry) {
      return { blocked: false, attemptsLeft: threshold.maxAttempts };
    }

    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil.getTime() - now.getTime()) / 1000);
      return { blocked: true, remainingTime };
    }

    const windowEnd = new Date(entry.windowStart.getTime() + threshold.windowMinutes * 60 * 1000);
    if (now > windowEnd) {
      this.blocks.delete(key);
      return { blocked: false, attemptsLeft: threshold.maxAttempts };
    }

    const attemptsLeft = Math.max(0, threshold.maxAttempts - entry.attempts);
    return { blocked: false, attemptsLeft };
  }

  async recordFailedAttempt(
    identifier: string,
    type: string,
    ip?: string,
  ): Promise<{ blocked: boolean; attemptsLeft: number; blockedUntil?: Date }> {
    const key = this.getKey(identifier, type);
    const threshold = this.getThreshold(type);
    const now = new Date();
    let entry = this.blocks.get(key);

    if (!entry) {
      entry = { attempts: 0, windowStart: now };
      this.blocks.set(key, entry);
    }

    const windowEnd = new Date(entry.windowStart.getTime() + threshold.windowMinutes * 60 * 1000);
    if (now > windowEnd) {
      entry.attempts = 0;
      entry.windowStart = now;
      entry.blockedUntil = undefined;
    }

    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil.getTime() - now.getTime()) / 1000);
      return { blocked: true, attemptsLeft: 0, blockedUntil: entry.blockedUntil };
    }

    entry.attempts++;

    if (entry.attempts >= threshold.maxAttempts) {
      entry.blockedUntil = new Date(now.getTime() + threshold.blockMinutes * 60 * 1000);
      await this.persistToDatabase(identifier, type, entry, ip);
      this.logger.warn(
        `Brute force block applied: ${identifier} (${type}) blocked until ${entry.blockedUntil.toISOString()}`,
      );
      return { blocked: true, attemptsLeft: 0, blockedUntil: entry.blockedUntil };
    }

    await this.persistToDatabase(identifier, type, entry, ip);

    return {
      blocked: false,
      attemptsLeft: Math.max(0, threshold.maxAttempts - entry.attempts),
    };
  }

  async recordSuccess(identifier: string, type: string): Promise<void> {
    const key = this.getKey(identifier, type);
    this.blocks.delete(key);

    try {
      await (this.prisma as any).authRateLimit.deleteMany({
        where: { identifier, action: type },
      });
    } catch (error) {
      this.logger.error('Failed to clear brute-force record from database', error);
    }
  }

  async block(identifier: string, type: string, durationMinutes: number): Promise<void> {
    const key = this.getKey(identifier, type);
    const now = new Date();
    const blockedUntil = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const entry: BlockedEntry = {
      attempts: THRESHOLDS[type]?.maxAttempts || 5,
      windowStart: now,
      blockedUntil,
    };

    this.blocks.set(key, entry);
    await this.persistToDatabase(identifier, type, entry);

    this.logger.warn(
      `Manual block applied: ${identifier} (${type}) blocked for ${durationMinutes} minutes`,
    );
  }

  async unblock(identifier: string, type: string): Promise<void> {
    const key = this.getKey(identifier, type);
    this.blocks.delete(key);

    try {
      await (this.prisma as any).authRateLimit.deleteMany({
        where: { identifier, action: type },
      });
    } catch (error) {
      this.logger.error('Failed to remove block from database', error);
    }

    this.logger.log(`Block removed: ${identifier} (${type})`);
  }

  getBlockedIdentifiers(): Array<{ identifier: string; type: string; blockedUntil: Date; attempts: number }> {
    const now = new Date();
    const blocked: Array<{ identifier: string; type: string; blockedUntil: Date; attempts: number }> = [];

    for (const [key, entry] of this.blocks.entries()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        const [type, ...identifierParts] = key.split(':');
        blocked.push({
          identifier: identifierParts.join(':'),
          type,
          blockedUntil: entry.blockedUntil,
          attempts: entry.attempts,
        });
      }
    }

    return blocked;
  }

  @Cron('*/5 * * * *')
  async cleanup(): Promise<void> {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.blocks.entries()) {
      if (entry.blockedUntil && now >= entry.blockedUntil) {
        this.blocks.delete(key);
        cleaned++;
      } else if (!entry.blockedUntil) {
        const [type] = key.split(':');
        const threshold = this.getThreshold(type);
        const windowEnd = new Date(entry.windowStart.getTime() + threshold.windowMinutes * 60 * 1000);
        if (now > windowEnd) {
          this.blocks.delete(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired brute-force entries`);
    }

    try {
      await (this.prisma as any).authRateLimit.deleteMany({
        where: {
          blockedUntil: { lt: now },
        },
      });
    } catch (error) {
      this.logger.error('Failed to cleanup expired entries from database', error);
    }
  }

  async getStats(): Promise<{
    totalBlocked: number;
    activeBlocks: number;
    topBlockedIPs: Array<{ identifier: string; count: number }>;
  }> {
    const now = new Date();
    let activeBlocks = 0;
    const ipCounts = new Map<string, number>();

    for (const [key, entry] of this.blocks.entries()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        activeBlocks++;
        const [type, identifier] = key.split(':');
        ipCounts.set(identifier, (ipCounts.get(identifier) || 0) + 1);
      }
    }

    const topBlockedIPs = Array.from(ipCounts.entries())
      .map(([identifier, count]) => ({ identifier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalBlocked = this.blocks.size;

    return { totalBlocked, activeBlocks, topBlockedIPs };
  }

  private async persistToDatabase(
    identifier: string,
    action: string,
    entry: BlockedEntry,
    ip?: string,
  ): Promise<void> {
    try {
      await (this.prisma as any).authRateLimit.upsert({
        where: { identifier_action: { identifier, action } },
        create: {
          identifier,
          identifierType: ip ? 'ip' : 'user',
          action,
          attempts: entry.attempts,
          windowStart: entry.windowStart,
          blockedUntil: entry.blockedUntil,
        },
        update: {
          attempts: entry.attempts,
          windowStart: entry.windowStart,
          blockedUntil: entry.blockedUntil,
        },
      });
    } catch (error) {
      this.logger.error('Failed to persist brute-force entry to database', error);
    }
  }
}
