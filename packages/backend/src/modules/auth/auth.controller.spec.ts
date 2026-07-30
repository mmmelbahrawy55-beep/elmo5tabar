import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    enable2FA: jest.fn(),
    confirm2FA: jest.fn(),
    disable2FA: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecureP@ss1',
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      role: UserRole.PATIENT,
    };

    it('should register user and return 201', async () => {
      const expected = { user: { id: '1', email: dto.email }, accessToken: 'jwt', refreshToken: 'jwt' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

      await expect(controller.register(dto)).rejects.toThrow('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'Test@1234' };
    const req = { ip: '127.0.0.1', headers: { 'user-agent': 'test' }, socket: { remoteAddress: '127.0.0.1' } } as any;

    it('should login and return 200', async () => {
      const expected = { user: { id: '1' }, accessToken: 'jwt', refreshToken: 'jwt' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(req, dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, '127.0.0.1', 'test');
    });

    it('should handle missing IP gracefully', async () => {
      const reqNoIp = { headers: {}, socket: {} } as any;
      mockAuthService.login.mockResolvedValue({ user: { id: '1' } });

      await controller.login(reqNoIp, dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, undefined, '');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and return 200', async () => {
      const req = { user: { userId: 'user-1' } };
      mockAuthService.logout.mockResolvedValue({ message: 'Logged out' });

      const result = await controller.logout(req, 'refresh-token');

      expect(result).toEqual({ message: 'Logged out' });
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1', 'refresh-token');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token and return 200', async () => {
      const expected = { accessToken: 'new-jwt', refreshToken: 'new-refresh' };
      mockAuthService.refreshToken.mockResolvedValue(expected);

      const result = await controller.refresh('valid-refresh-token');

      expect(result).toEqual(expected);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send reset link', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'If the email exists, a reset link has been sent' });

      const result = await controller.forgotPassword('test@example.com');

      expect(result.message).toContain('reset link');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      const result = await controller.resetPassword('token', 'NewPass@123');

      expect(result.message).toContain('reset');
    });
  });

  describe('POST /auth/2fa/enable', () => {
    it('should return 2FA setup data', async () => {
      const req = { user: { userId: 'user-1' } };
      mockAuthService.enable2FA.mockResolvedValue({ secret: 'base32', otpauthUrl: 'otpauth://...' });

      const result = await controller.enable2FA(req);

      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
    });
  });

  describe('POST /auth/2fa/confirm', () => {
    it('should confirm 2FA', async () => {
      const req = { user: { userId: 'user-1' } };
      mockAuthService.confirm2FA.mockResolvedValue({ message: 'Two-factor authentication enabled' });

      const result = await controller.confirm2FA(req, '123456');

      expect(result.message).toContain('enabled');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile', async () => {
      const req = { user: { userId: 'user-1' } };
      mockAuthService.getProfile.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      const result = await controller.getProfile(req);

      expect(result.id).toBe('user-1');
    });
  });
});
