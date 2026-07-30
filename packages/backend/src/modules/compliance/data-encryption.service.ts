import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../../lib/prisma/prisma.service';

const bcryptCompare = promisify(require('bcrypt').compare) as (data: string, hash: string) => Promise<boolean>;

interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
  keyVersion: number;
}

@Injectable()
export class DataEncryptionService implements OnModuleInit {
  private readonly logger = new Logger(DataEncryptionService.name);
  private masterKey: Buffer | null = null;
  private currentKeyVersion = 1;

  private readonly BCRYPT_ROUNDS = 12;
  private readonly AES_KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const keyHex = process.env.DATA_ENCRYPTION_KEY;
    if (!keyHex) {
      this.logger.warn(
        'DATA_ENCRYPTION_KEY not set. Using generated key. Data will NOT survive restarts!',
      );
      this.masterKey = randomBytes(this.AES_KEY_LENGTH);
    } else {
      const keyBuffer = Buffer.from(keyHex, 'hex');
      if (keyBuffer.length !== this.AES_KEY_LENGTH) {
        this.logger.warn(
          `DATA_ENCRYPTION_KEY must be ${this.AES_KEY_LENGTH * 2} hex characters (${this.AES_KEY_LENGTH} bytes). Using derived key.`,
        );
        this.masterKey = createHash('sha256').update(keyHex).digest();
      } else {
        this.masterKey = keyBuffer;
      }
    }

    try {
      const latestVersion = await (this.prisma as any).authDataVault.findFirst({
        orderBy: { keyVersion: 'desc' },
        select: { keyVersion: true },
      });
      if (latestVersion) {
        this.currentKeyVersion = latestVersion.keyVersion;
      }
    } catch (error) {
      this.logger.error('Failed to load key version from database', error);
    }

    this.logger.log(`DataEncryptionService initialized with key version ${this.currentKeyVersion}`);
  }

  private deriveKey(version: number): Buffer {
    if (!this.masterKey) throw new Error('Master key not initialized');
    return createHash('sha256')
      .update(Buffer.concat([this.masterKey, Buffer.from(version.toString())]))
      .digest();
  }

  encrypt(plainText: string, classification: string): EncryptedData {
    const key = this.deriveKey(this.currentKeyVersion);
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      authTag,
      keyVersion: this.currentKeyVersion,
    };
  }

  decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer, keyVersion: number): string {
    const key = this.deriveKey(keyVersion);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  async encryptField(
    userId: string,
    fieldName: string,
    value: string,
    classification: string,
  ): Promise<void> {
    const { encrypted, iv, authTag, keyVersion } = this.encrypt(value, classification);

    try {
      await (this.prisma as any).authDataVault.upsert({
        where: { userId_fieldName: { userId, fieldName } },
        create: {
          userId,
          fieldName,
          encryptedValue: encrypted,
          iv,
          authTag,
          keyVersion,
          classification: classification.toUpperCase(),
          accessCount: 0,
        },
        update: {
          encryptedValue: encrypted,
          iv,
          authTag,
          keyVersion,
          classification: classification.toUpperCase(),
        },
      });

      this.logger.debug(`Field ${fieldName} encrypted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to encrypt field ${fieldName} for user ${userId}`, error);
      throw error;
    }
  }

  async decryptField(userId: string, fieldName: string): Promise<string | null> {
    try {
      const record = await (this.prisma as any).authDataVault.findUnique({
        where: { userId_fieldName: { userId, fieldName } },
      });

      if (!record) return null;

      const decrypted = this.decrypt(
        record.encryptedValue,
        record.iv,
        record.authTag,
        record.keyVersion,
      );

      await (this.prisma as any).authDataVault.update({
        where: { id: record.id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt field ${fieldName} for user ${userId}`, error);
      throw error;
    }
  }

  async rotateKeys(): Promise<{ recordsUpdated: number; newKeyVersion: number }> {
    this.currentKeyVersion++;
    let recordsUpdated = 0;

    try {
      const allRecords = await (this.prisma as any).authDataVault.findMany({
        where: { keyVersion: { lt: this.currentKeyVersion } },
      });

      for (const record of allRecords) {
        try {
          const decrypted = this.decrypt(
            record.encryptedValue,
            record.iv,
            record.authTag,
            record.keyVersion,
          );

          const { encrypted, iv, authTag, keyVersion } = this.encrypt(decrypted, record.classification);

          await (this.prisma as any).authDataVault.update({
            where: { id: record.id },
            data: {
              encryptedValue: encrypted,
              iv,
              authTag,
              keyVersion,
            },
          });

          recordsUpdated++;
        } catch (error) {
          this.logger.error(
            `Failed to rotate key for record ${record.id} (field: ${record.fieldName})`,
            error,
          );
        }
      }

      this.logger.log(
        `Key rotation complete: version ${this.currentKeyVersion}, ${recordsUpdated} records updated`,
      );

      return { recordsUpdated, newKeyVersion: this.currentKeyVersion };
    } catch (error) {
      this.logger.error('Key rotation failed', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, this.BCRYPT_ROUNDS) as Promise<string>;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptCompare(password, hash);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateSecureRandom(bytes: number): Buffer {
    return randomBytes(bytes);
  }

  generateOTP(): string {
    const buffer = randomBytes(3);
    const otp = parseInt(buffer.toString('hex'), 16) % 1000000;
    return otp.toString().padStart(6, '0');
  }

  generateToken(length = 32): string {
    return randomBytes(length).toString('base64url');
  }

  constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return timingSafeEqual(bufA, bufB);
  }

  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }
}
