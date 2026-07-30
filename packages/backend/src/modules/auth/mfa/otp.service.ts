import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SMSProvider } from './sms.provider';
import { EmailProvider } from './email.provider';

interface OTPRecord {
  id: string;
  userId: string;
  code: string;
  type: string;
  channel: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class OTPService {
  private readonly logger = new Logger(OTPService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;
  private readonly SALT_ROUNDS = 10;

  private readonly otpStore = new Map<string, OTPRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsProvider: SMSProvider,
    private readonly emailProvider: EmailProvider,
  ) {}

  async generateOTP(
    userId: string,
    type: string,
    channel: string,
  ): Promise<string> {
    const code = this.generateNumericCode(this.OTP_LENGTH);
    const hashedCode = await bcrypt.hash(code, this.SALT_ROUNDS);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const id = this.generateId();

    const record: OTPRecord = {
      id,
      userId,
      code: hashedCode,
      type,
      channel,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };

    this.otpStore.set(id, record);

    return code;
  }

  async verifyOTP(
    identifier: string,
    code: string,
    type: string,
    channel?: string,
  ): Promise<boolean> {
    const now = new Date();

    const matchingRecords = Array.from(this.otpStore.values())
      .filter((record) => {
        if (record.usedAt) return false;
        if (record.expiresAt <= now) return false;
        if (record.type !== type) return false;
        if (channel && record.channel !== channel) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let otpRecord: OTPRecord | undefined;

    for (const record of matchingRecords) {
      const user = await this.prisma.user.findUnique({
        where: { id: record.userId },
        select: { email: true, phone: true },
      });

      if (user && (user.email === identifier || user.phone === identifier)) {
        otpRecord = record;
        break;
      }
    }

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new BadRequestException('OTP max attempts exceeded');
    }

    const isValid = await bcrypt.compare(code, otpRecord.code);

    if (!isValid) {
      otpRecord.attempts += 1;
      return false;
    }

    otpRecord.usedAt = new Date();
    otpRecord.attempts = 0;

    return true;
  }

  async sendOTP(
    userId: string,
    code: string,
    channel: string,
    lang: string = 'ar',
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, preferredLanguage: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userLang = lang || user.preferredLanguage || 'ar';

    if (channel === 'sms' && user.phone) {
      return this.smsProvider.sendOTP(user.phone, code, userLang);
    }

    if (channel === 'email' && user.email) {
      return this.emailProvider.sendOTPEmail(user.email, code, userLang);
    }

    throw new BadRequestException(`Invalid OTP channel: ${channel}`);
  }

  async cleanupExpired(): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    let cleaned = 0;

    for (const [id, record] of this.otpStore.entries()) {
      if (record.createdAt < twentyFourHoursAgo) {
        this.otpStore.delete(id);
        cleaned++;
      }
    }

    this.logger.log(`Cleaned up ${cleaned} expired OTPs`);
    return cleaned;
  }

  async getAttemptCount(
    identifier: string,
    type: string,
    windowMinutes: number = 5,
  ): Promise<number> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    let count = 0;

    for (const record of this.otpStore.values()) {
      if (record.type !== type) continue;
      if (record.createdAt < windowStart) continue;
      if (record.usedAt) continue;

      const user = await this.prisma.user.findUnique({
        where: { id: record.userId },
        select: { email: true, phone: true },
      });

      if (user && (user.email === identifier || user.phone === identifier)) {
        count++;
      }
    }

    return count;
  }

  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  private generateId(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
