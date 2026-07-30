import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import { mockPrismaService, mockConfigService } from '../../../../test/mocks';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should validate and return user payload for active user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      isActive: true,
      deletedAt: null,
    });

    const payload = { userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };
    const result = await strategy.validate(payload);

    expect(result).toEqual({ userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT });
  });

  it('should throw UnauthorizedException for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const payload = { userId: 'unknown', email: 'unknown@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      isActive: true,
      deletedAt: new Date(),
    });

    const payload = { userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for inactive user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      isActive: false,
      deletedAt: null,
    });

    const payload = { userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for locked user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.LOCKED,
      isActive: true,
      deletedAt: null,
    });

    const payload = { userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for suspended user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.PATIENT,
      status: UserStatus.SUSPENDED,
      isActive: true,
      deletedAt: null,
    });

    const payload = { userId: 'user-1', email: 'test@example.com', role: UserRole.PATIENT, iat: 123, exp: 456 };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
