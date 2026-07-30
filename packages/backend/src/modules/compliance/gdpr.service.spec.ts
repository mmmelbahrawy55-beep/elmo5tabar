import { Test, TestingModule } from '@nestjs/testing';
import { GDPRService } from './gdpr.service';
import { DataEncryptionService } from './data-encryption.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('GDPRService', () => {
  let service: GDPRService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GDPRService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DataEncryptionService, useValue: { hashToken: jest.fn().mockReturnValue('hashed-token') } },
      ],
    }).compile();

    service = module.get(GDPRService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export user data with sessions, devices, login history, consents, audit logs', async () => {
      prisma.authUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'secret',
        totpSecret: 'secret',
        backupCodes: [],
        sessions: [{ id: 'sess-1', ipAddress: '::1' }],
        devices: [{ id: 'dev-1', deviceName: 'Chrome' }],
        loginHistory: [{ id: 'log-1', status: 'SUCCESS' }],
        consents: [{ id: 'cons-1', consentType: 'marketing', granted: true }],
        auditLogs: [{ id: 'aud-1', action: 'LOGIN' }],
      });
      const result = await service.exportUserData('user-1');
      expect(result.userId).toBe('user-1');
      expect(result.sessions).toHaveLength(1);
      expect(result.consents).toHaveLength(1);
      expect(result.profile).toBeDefined();
      expect(result.profile.passwordHash).toBeUndefined();
    });

    it('should throw when user not found', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);
      await expect(service.exportUserData('unknown')).rejects.toThrow();
    });
  });

  describe('deleteUserData', () => {
    it('should anonymize user data with correct confirmation', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
      prisma.authUser.update.mockResolvedValue({});
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      prisma.device.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.deleteUserData('user-1', 'DELETE MY DATA');
      expect(result.anonymized).toBe(true);
    });

    it('should throw with incorrect confirmation phrase', async () => {
      await expect(service.deleteUserData('user-1', 'wrong')).rejects.toThrow('Invalid confirmation');
    });

    it('should throw when user not found', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);
      await expect(service.deleteUserData('user-1', 'DELETE MY DATA')).rejects.toThrow();
    });
  });

  describe('consent management', () => {
    it('should record granted consent', async () => {
      prisma.authConsent.findFirst.mockResolvedValue(null);
      prisma.authConsent.create.mockResolvedValue({ id: 'cons-1' });
      const id = await service.recordConsent({
        userId: 'user-1',
        consentType: 'marketing',
        version: '1.0',
        granted: true,
      });
      expect(id).toBe('cons-1');
    });

    it('should record withdrawn consent', async () => {
      prisma.authConsent.create.mockResolvedValue({ id: 'cons-2' });
      const id = await service.recordConsent({
        userId: 'user-1',
        consentType: 'marketing',
        version: '1.0',
        granted: false,
      });
      expect(id).toBeDefined();
    });

    it('should revoke previous consent when re-granting same type', async () => {
      prisma.authConsent.findFirst.mockResolvedValue({ id: 'cons-old', userId: 'user-1', consentType: 'marketing', granted: true, withdrawnAt: null });
      prisma.authConsent.update.mockResolvedValue({});
      prisma.authConsent.create.mockResolvedValue({ id: 'cons-new' });
      const id = await service.recordConsent({
        userId: 'user-1',
        consentType: 'marketing',
        version: '2.0',
        granted: true,
      });
      expect(prisma.authConsent.update).toHaveBeenCalled();
      expect(id).toBe('cons-new');
    });

    it('should get consent history', async () => {
      prisma.authConsent.findMany.mockResolvedValue([{ id: 'cons-1', consentType: 'marketing', granted: true }]);
      const history = await service.getConsentHistory('user-1');
      expect(history).toHaveLength(1);
      expect(prisma.authConsent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
    });
  });

  describe('data retention', () => {
    it('should check data retention and return recommendations', async () => {
      prisma.authUser.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      prisma.authUser.findFirst.mockResolvedValue({ createdAt: new Date('2015-01-01') });
      const result = await service.checkDataRetention();
      expect(result.usersPastRetention).toBe(10);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('anonymization', () => {
    it('should anonymize user', async () => {
      prisma.authUser.update.mockResolvedValue({});
      const result = await service.anonymizeUser('user-1');
      expect(result.anonymized).toBe(true);
    });
  });

  describe('breach notification', () => {
    it('should require notification for health data breach', async () => {
      const result = await service.checkBreachNotification({
        affectedUserIds: ['u1'],
        dataTypes: ['medical', 'phi'],
        breachDate: new Date().toISOString(),
        discoveryDate: new Date().toISOString(),
        description: 'PHI breach',
      });
      expect(result.requiresNotification).toBe(true);
      expect(result.severity).toBe('critical');
    });

    it('should flag high severity for financial data breach', async () => {
      const result = await service.checkBreachNotification({
        affectedUserIds: ['u1', 'u2'],
        dataTypes: ['payment', 'credit_card'],
        breachDate: new Date().toISOString(),
        discoveryDate: new Date().toISOString(),
        description: 'Payment data breach',
      });
      expect(result.severity).toBe('high');
      expect(result.requiresNotification).toBe(true);
    });

    it('should not require notification for low severity with few users', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 1);
      const result = await service.checkBreachNotification({
        affectedUserIds: ['u1'],
        dataTypes: ['username'],
        breachDate: oldDate.toISOString(),
        discoveryDate: new Date().toISOString(),
        description: 'Minor breach',
      });
      expect(result.requiresNotification).toBe(false);
      expect(result.severity).toBe('low');
    });
  });

  describe('data processing log', () => {
    it('should return processing activities', async () => {
      const log = await service.getDataProcessingLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toHaveProperty('activity');
      expect(log[0]).toHaveProperty('purpose');
      expect(log[0]).toHaveProperty('legalBasis');
    });
  });
});
