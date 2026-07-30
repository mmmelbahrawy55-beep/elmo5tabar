import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OTPService } from './otp.service';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly SALT_ROUNDS = 10;
  private readonly TOTP_PERIOD = 30;
  private readonly TOTP_DIGITS = 6;
  private readonly TOTP_WINDOW = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OTPService,
  ) {}

  async generateTOTPSecret(userId: string): Promise<{
    secret: string;
    otpauthUri: string;
    qrCodeUrl: string;
  }> {
    const secret = this.generateBase32Secret(32);

    const encryptedSecret = this.encryptSecret(secret);

    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { totpSecret: encryptedSecret },
    });

    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const issuer = 'AlMokhtabar';
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${this.TOTP_DIGITS}&period=${this.TOTP_PERIOD}`;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;

    return { secret, otpauthUri, qrCodeUrl };
  }

  verifyTOTP(secret: string, token: string): boolean {
    const decryptedSecret = this.decryptSecret(secret);
    const currentTime = Math.floor(Date.now() / 1000);

    for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
      const timeSlice = Math.floor(currentTime / this.TOTP_PERIOD) + i;
      const expectedToken = this.generateTOTPCode(decryptedSecret, timeSlice);
      if (this.constantTimeCompare(token, expectedToken)) {
        return true;
      }
    }

    return false;
  }

  async generateQRCode(otpauthUri: string): Promise<string> {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;
    return qrCodeUrl;
  }

  async enable2FA(
    userId: string,
    method: string,
  ): Promise<Record<string, unknown>> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const result: Record<string, unknown> = { method };

    switch (method) {
      case 'totp': {
        const totpData = await this.generateTOTPSecret(userId);
        result.secret = totpData.secret;
        result.otpauthUri = totpData.otpauthUri;
        result.qrCodeUrl = totpData.qrCodeUrl;
        break;
      }
      case 'sms': {
        if (!user.phone) {
          throw new BadRequestException('Phone number is required for SMS 2FA');
        }
        break;
      }
      case 'email': {
        if (!user.email) {
          throw new BadRequestException('Email is required for email 2FA');
        }
        break;
      }
      default:
        throw new BadRequestException(`Unsupported 2FA method: ${method}`);
    }

    const backupCodes = await this.generateBackupCodes(userId);

    await (this.prisma as any).user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: method,
        backupCodes: backupCodes.hashedCodes,
      },
    });

    result.backupCodes = backupCodes.plainCodes;

    return result;
  }

  async disable2FA(userId: string, password: string): Promise<boolean> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await (this.prisma as any).user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    return true;
  }

  async verify2FACode(userId: string, code: string): Promise<boolean> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        twoFactorMethod: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorMethod) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isBackupCode = await this.verifyBackupCode(userId, code);
    if (isBackupCode) {
      return true;
    }

    switch (user.twoFactorMethod) {
      case 'totp': {
        if (!user.twoFactorSecret) {
          throw new BadRequestException('TOTP secret not found');
        }
        return this.verifyTOTP(user.twoFactorSecret, code);
      }
      case 'sms': {
        if (!user.phone) {
          throw new BadRequestException('Phone number not found');
        }
        return this.otpService.verifyOTP(user.phone, code, '2fa_sms', 'sms');
      }
      case 'email': {
        if (!user.email) {
          throw new BadRequestException('Email not found');
        }
        return this.otpService.verifyOTP(
          user.email,
          code,
          '2fa_email',
          'email',
        );
      }
      default:
        throw new BadRequestException(
          `Unsupported 2FA method: ${user.twoFactorMethod}`,
        );
    }
  }

  async generateBackupCodes(
    userId: string,
  ): Promise<{ plainCodes: string[]; hashedCodes: string[] }> {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const plainCode = this.generateAlphanumericCode(
        this.BACKUP_CODE_LENGTH,
      );
      const hashedCode = await bcrypt.hash(plainCode, this.SALT_ROUNDS);
      plainCodes.push(plainCode);
      hashedCodes.push(hashedCode);
    }

    return { plainCodes, hashedCodes };
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user || !user.backupCodes || user.backupCodes.length === 0) {
      return false;
    }

    for (let i = 0; i < user.backupCodes.length; i++) {
      const hashedCode = user.backupCodes[i];
      const isMatch = await bcrypt.compare(code, hashedCode);
      if (isMatch) {
        const updatedCodes = [...user.backupCodes];
        updatedCodes.splice(i, 1);
        await (this.prisma as any).user.update({
          where: { id: userId },
          data: { backupCodes: updatedCodes },
        });
        return true;
      }
    }

    return false;
  }

  async is2FARequired(userId: string): Promise<boolean> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user.twoFactorEnabled;
  }

  async get2FAStatus(userId: string): Promise<{
    enabled: boolean;
    method: string | null;
    backupCodesRemaining: number;
  }> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        backupCodes: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod,
      backupCodesRemaining: user.backupCodes?.length || 0,
    };
  }

  private generateBase32Secret(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      secret += chars[randomBytes[i] % chars.length];
    }
    return secret;
  }

  private generateTOTPCode(secret: string, timeSlice: number): string {
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(0, 0);
    timeBuffer.writeUInt32BE(timeSlice, 4);

    const hmac = crypto.createHmac('sha1', this.base32ToBuffer(secret));
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.TOTP_DIGITS);
    return otp.toString().padStart(this.TOTP_DIGITS, '0');
  }

  private base32ToBuffer(base32: string): Buffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of base32.toUpperCase()) {
      const val = chars.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const buffer = Buffer.alloc(Math.floor(bits.length / 8));
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    return buffer;
  }

  private encryptSecret(secret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.MFA_ENCRYPTION_KEY || 'default-encryption-key',
      'salt',
      32,
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decryptSecret(encryptedSecret: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      process.env.MFA_ENCRYPTION_KEY || 'default-encryption-key',
      'salt',
      32,
    );
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private generateAlphanumericCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    return code;
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
