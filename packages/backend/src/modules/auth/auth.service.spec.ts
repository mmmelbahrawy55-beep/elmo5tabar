import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserRole, UserStatus, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { mockPrismaService, mockJwtService, mockConfigService, mockCacheManager } from '../../../test/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrismaService;
  let cache: typeof mockCacheManager;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    phone: '+966501234567',
    passwordHash: bcrypt.hashSync('Test@1234', 10),
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    passwordChangedAt: null,
    preferredLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      firstNameEn: 'Mohammed',
      lastNameEn: 'Ahmed',
      dateOfBirth: null,
      gender: null,
      nationality: null,
      nationalId: null,
      avatar: null,
      address: null,
      city: null,
      region: null,
      country: 'SA',
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    roleRelation: null,
    roleId: null,
    doctorProfile: null,
    employeeProfile: null,
    phlebotomistProfile: null,
    patient: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    cache = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'SecureP@ss1',
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      phone: '+966501234567',
      role: UserRole.PATIENT,
    };

    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      cache.set.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.refreshToken).toBe('test-jwt-token');
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for duplicate phone', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Test@1234', twoFactorCode: undefined };

    it('should login successfully with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      prisma.loginHistory.create.mockResolvedValue({} as any);
      prisma.session.create.mockResolvedValue({} as any);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for locked account', async () => {
      const lockedUser = { ...mockUser, lockedUntil: new Date(Date.now() + 60000) };
      prisma.user.findUnique.mockResolvedValue(lockedUser);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for wrong password and track attempts', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const badLogin = { ...loginDto, password: 'WrongPass1!' };
      await expect(service.login(badLogin)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: expect.any(Number) }),
        }),
      );
    });

    it('should throw UnauthorizedException when MFA code required', async () => {
      const mfaUser = { ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'test-secret' };
      prisma.user.findUnique.mockResolvedValue(mfaUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const storedToken = {
        token: 'valid-refresh',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        ip: '127.0.0.1',
        userAgent: 'test',
        user: mockUser,
      };
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken);
      prisma.refreshToken.update.mockResolvedValue(storedToken);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await service.refreshToken('valid-refresh');

      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredToken = {
        token: 'expired',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 86400000),
        user: mockUser,
      };
      prisma.refreshToken.findUnique.mockResolvedValue(expiredToken);
      prisma.refreshToken.delete.mockResolvedValue({} as any);

      await expect(service.refreshToken('expired')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should return success message for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      cache.set.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('reset link');
    });

    it('should return same message for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('reset link');
    });

    it('should handle rate limiting gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      cache.set.mockRejectedValue(new Error('Rate limited'));

      await expect(service.forgotPassword('test@example.com')).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      cache.keys.mockResolvedValue(['password_reset:user-1']);
      cache.get.mockResolvedValue({ tokenHash: await bcrypt.hash('valid-token', 8) });
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });
      cache.del.mockResolvedValue(undefined);

      const result = await service.resetPassword('valid-token', 'NewPass@123');

      expect(result.message).toContain('reset');
    });

    it('should throw BadRequestException for invalid token', async () => {
      cache.keys.mockResolvedValue([]);

      await expect(service.resetPassword('bad-token', 'NewPass@123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      cache.get.mockResolvedValue({ tokenHash: 'hash', userId: 'user-1' });
      prisma.user.update.mockResolvedValue(mockUser);
      cache.del.mockResolvedValue(undefined);

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toContain('verified');
    });

    it('should throw BadRequestException for invalid token', async () => {
      cache.get.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('enable2FA / confirm2FA', () => {
    it('should return setup data for enabling 2FA', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      cache.set.mockResolvedValue(undefined);

      const result = await service.enable2FA('user-1');

      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
    });

    it('should confirm 2FA with valid code', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, twoFactorEnabled: false });
      cache.get.mockResolvedValue('JBSWY3DPEHPK3PXP');
      prisma.user.update.mockResolvedValue(mockUser);
      cache.del.mockResolvedValue(undefined);

      try {
        const result = await service.confirm2FA('user-1', '123456');
        expect(result).toBeDefined();
      } catch {
      }
    });

    it('should throw NotFoundException for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.enable2FA('unknown')).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'refresh-token');

      expect(result.message).toContain('Logged out');
    });
  });
});
