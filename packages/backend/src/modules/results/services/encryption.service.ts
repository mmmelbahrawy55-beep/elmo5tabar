import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  keyId: string;
}

interface EncryptionKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  active: boolean;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly keyLength = 32;
  private readonly encoding: BufferEncoding = 'hex';

  private activeKeyId: string;
  private keys: Map<string, EncryptionKey> = new Map();
  private archivedKeys: Map<string, EncryptionKey> = new Map();

  constructor(private readonly config: ConfigService) {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    const envKey = this.config.get<string>('ENCRYPTION_KEY');
    if (envKey) {
      const keyBuffer = Buffer.from(envKey, this.encoding);
      if (keyBuffer.length !== this.keyLength) {
        this.logger.warn(`ENCRYPTION_KEY length is ${keyBuffer.length}, expected ${this.keyLength}. Generating new key.`);
      } else {
        const keyId = crypto.createHash('sha256').update(envKey).digest('hex').substring(0, 16);
        this.keys.set(keyId, {
          id: keyId,
          key: keyBuffer,
          createdAt: new Date(),
          active: true,
        });
        this.activeKeyId = keyId;
        this.logger.log('Encryption key loaded from environment');
        return;
      }
    }

    const newKey = crypto.randomBytes(this.keyLength);
    const keyId = crypto.randomBytes(8).toString('hex');
    this.keys.set(keyId, {
      id: keyId,
      key: newKey,
      createdAt: new Date(),
      active: true,
    });
    this.activeKeyId = keyId;
    this.logger.warn('No ENCRYPTION_KEY in env. Generated ephemeral key. Data will be undecryptable after restart.');
  }

  async encrypt(text: string, keyId?: string): Promise<EncryptedData> {
    const targetKeyId = keyId || this.activeKeyId;
    const keyEntry = this.keys.get(targetKeyId);

    if (!keyEntry) {
      throw new BadRequestException(`Encryption key '${targetKeyId}' not found`);
    }

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, keyEntry.key, iv, {
      authTagLength: this.tagLength,
    });

    let encrypted = cipher.update(text, 'utf8', this.encoding);
    encrypted += cipher.final(this.encoding);
    const tag = cipher.getAuthTag().toString(this.encoding);

    return {
      encrypted,
      iv: iv.toString(this.encoding),
      tag,
      keyId: targetKeyId,
    };
  }

  async decrypt(encrypted: string, iv: string, tag: string, keyId?: string): Promise<string> {
    const targetKeyId = keyId || this.activeKeyId;
    const keyEntry = this.keys.get(targetKeyId) || this.archivedKeys.get(targetKeyId);

    if (!keyEntry) {
      throw new BadRequestException(`Decryption key '${targetKeyId}' not found. Key may have been rotated.`);
    }

    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        keyEntry.key,
        Buffer.from(iv, this.encoding),
        { authTagLength: this.tagLength },
      );

      decipher.setAuthTag(Buffer.from(tag, this.encoding));

      let decrypted = decipher.update(encrypted, this.encoding, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new BadRequestException('Decryption failed. Data may be corrupted or key mismatch.');
    }
  }

  async rotateKeys(): Promise<{ newKeyId: string; archivedKeyId: string }> {
    if (this.activeKeyId) {
      const currentKey = this.keys.get(this.activeKeyId);
      if (currentKey) {
        currentKey.active = false;
        this.archivedKeys.set(this.activeKeyId, currentKey);
      }
    }

    const newKey = crypto.randomBytes(this.keyLength);
    const newKeyId = crypto.randomBytes(8).toString('hex');

    this.keys.set(newKeyId, {
      id: newKeyId,
      key: newKey,
      createdAt: new Date(),
      active: true,
    });

    const archivedKeyId = this.activeKeyId;
    this.activeKeyId = newKeyId;

    this.logger.log(`Encryption keys rotated: ${archivedKeyId} -> ${newKeyId}`);

    return { newKeyId, archivedKeyId };
  }

  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  anonymizePatientData(patient: {
    firstNameAr?: string | null;
    lastNameAr?: string | null;
    firstNameEn?: string | null;
    lastNameEn?: string | null;
    phone?: string | null;
    email?: string | null;
    nationalId?: string | null;
    dateOfBirth?: Date | string | null;
  }): Record<string, unknown> {
    const yearOfBirth = patient.dateOfBirth
      ? new Date(patient.dateOfBirth).getFullYear()
      : null;

    return {
      ageGroup: yearOfBirth ? this.getAgeGroup(yearOfBirth) : 'unknown',
      gender: (patient as any).gender || 'unknown',
      phonePrefix: patient.phone
        ? patient.phone.substring(0, 4) + '****'
        : null,
      cityCode: null,
      hasEmail: !!patient.email,
      age: yearOfBirth ? new Date().getFullYear() - yearOfBirth : null,
    };
  }

  private getAgeGroup(birthYear: number): string {
    const age = new Date().getFullYear() - birthYear;
    if (age < 18) return '0-17';
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    return '60+';
  }

  maskSensitiveData(text: string, pattern?: RegExp): string {
    if (pattern) {
      return text.replace(pattern, (match) => {
        if (match.length <= 4) return '*'.repeat(match.length);
        return match.substring(0, 2) + '*'.repeat(match.length - 4) + match.substring(match.length - 2);
      });
    }

    if (/^\d{10,}$/.test(text)) {
      return text.substring(0, 4) + '*'.repeat(text.length - 8) + text.substring(text.length - 4);
    }

    if (/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(text)) {
      const [local, domain] = text.split('@');
      return local.substring(0, 2) + '*'.repeat(Math.max(3, local.length - 2)) + '@' + domain;
    }

    if (text.length > 6) {
      return text.substring(0, 3) + '*'.repeat(Math.min(text.length - 6, 10)) + text.substring(text.length - 3);
    }

    return '*'.repeat(text.length);
  }

  getActiveKeyId(): string {
    return this.activeKeyId;
  }

  getKeyIds(): { active: string; archived: string[] } {
    return {
      active: this.activeKeyId,
      archived: Array.from(this.archivedKeys.keys()),
    };
  }
}
