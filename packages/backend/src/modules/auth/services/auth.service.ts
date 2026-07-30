import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import * as OTPAuth from 'otpauth';
import { UserRole, UserStatus } from '@prisma/client';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000;
const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_HOURS = 1;
const VERIFICATION_TOKEN_HOURS = 24;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: dto.role || UserRole.PATIENT,
        status: UserStatus.PENDING_VERIFICATION,
        profile: {
          create: {
            firstNameAr: dto.firstNameAr,
            lastNameAr: dto.lastNameAr,
          },
        },
      },
      include: { profile: true },
    });

    await this.sendVerificationEmail(user.id, user.email);

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ForbiddenException(
        `Account is locked. Try again in ${remainingMin} minute(s).`,
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account has been suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const lockUntil =
        failedAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_TIME_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockUntil,
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new UnauthorizedException(
          'Two-factor authentication code required',
        );
      }
      this.verifyTotpCode(user.twoFactorSecret!, dto.twoFactorCode);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const tokens = await this.generateTokens(user);

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    await this.logLoginHistory(user.id, ip, userAgent, true);
    await this.createSession(user.id, tokens.accessToken, ip, userAgent);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId },
    });

    await this.prisma.session.deleteMany({
      where: { userId, isActive: true },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive || stored.user.deletedAt) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('User account is no longer active');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isActive: false },
    });

    const tokens = await this.generateTokens(stored.user);

    await this.prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: stored.user.id,
        ip: stored.ip,
        userAgent: stored.userAgent,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(48).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 8);

    await this.cache.set(
      `password_reset:${user.id}`,
      { tokenHash, createdAt: Date.now() },
      RESET_TOKEN_HOURS * 3600,
    );

    // TODO: Send password reset email via NotificationService
    this.logger.log(`Password reset requested for user ${user.id}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetData = await this.cache.get<{ tokenHash: string; userId: string }>(
      'password_reset_tokens',
    );

    const keys = await this.cache.keys('password_reset:*');
    let userId: string | null = null;

    for (const key of keys) {
      const data = await this.cache.get<{ tokenHash: string }>(key.replace(/^almokhtabar:/, ''));
      if (data) {
        const isValid = await bcrypt.compare(token, data.tokenHash);
        if (isValid) {
          userId = key.replace(/^almokhtabar:password_reset:/, '');
          break;
        }
      }
    }

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });
    await this.cache.del(`password_reset:${userId}`);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const verificationData = await this.cache.get<{ tokenHash: string; userId: string }>(
      `email_verify:${token}`,
    );

    if (!verificationData) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: verificationData.userId },
      data: {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });

    await this.cache.del(`email_verify:${token}`);

    return { message: 'Email verified successfully' };
  }

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Al Mokhtabar Lab',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();

    await this.cache.set(`2fa_setup:${userId}`, secret, 600);

    return {
      secret,
      otpauthUrl,
    };
  }

  async confirm2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = await this.cache.get<string>(`2fa_setup:${userId}`);
    if (!secret) {
      throw new BadRequestException('2FA setup session expired. Please enable again.');
    }

    this.verifyTotpCodeWithSecret(secret, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });

    await this.cache.del(`2fa_setup:${userId}`);

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    this.verifyTotpCodeWithSecret(user.twoFactorSecret, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async generateTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    profile?: { firstNameAr: string | null; lastNameAr: string | null } | null;
  }) {
    const payload = { userId: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        doctorProfile: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async sendVerificationEmail(userId: string, email: string) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 8);

    await this.cache.set(
      `email_verify:${token}`,
      { tokenHash, userId },
      VERIFICATION_TOKEN_HOURS * 3600,
    );

    // TODO: Send verification email via NotificationService
    this.logger.log(`Verification email queued for ${email}`);
  }

  private verifyTotpCode(secret: string, code: string): void {
    this.verifyTotpCodeWithSecret(secret, code);
  }

  private verifyTotpCodeWithSecret(secret: string, code: string): void {
    const totp = new OTPAuth.TOTP({
      issuer: 'Al Mokhtabar Lab',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new UnauthorizedException('Invalid two-factor authentication code');
    }
  }

  private async logLoginHistory(
    userId: string,
    ip?: string,
    userAgent?: string,
    success = true,
  ) {
    await this.prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: ip,
        userAgent,
        success,
        failureReason: success ? null : 'Invalid credentials',
      },
    });
  }

  private async createSession(
    userId: string,
    token: string,
    ip?: string,
    userAgent?: string,
  ) {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        token,
        ipAddress: ip,
        userAgent,
        lastActivityAt: new Date(),
        expiresAt,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }
}
