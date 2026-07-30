import { Test, TestingModule } from '@nestjs/testing';
import { HIPAAService } from './hipaa.service';
import { DataEncryptionService } from './data-encryption.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('HIPAAService', () => {
  let service: HIPAAService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HIPAAService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: DataEncryptionService,
          useValue: {
            encrypt: jest.fn().mockReturnValue({ encrypted: Buffer.from('enc'), iv: Buffer.from('iv'), authTag: Buffer.from('tag'), keyVersion: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get(HIPAAService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('logAccess', () => {
    it('should log a PHI access event', async () => {
      prisma.authAuditLog.create.mockResolvedValue({ id: 'audit-1' });
      const id = await service.logAccess('user-1', 'patient', 'pat-1', 'VIEW', true, { reason: 'treatment' });
      expect(id).toBe('audit-1');
      expect(prisma.authAuditLog.create).toHaveBeenCalled();
    });

    it('should log non-PHI access', async () => {
      prisma.authAuditLog.create.mockResolvedValue({ id: 'audit-2' });
      const id = await service.logAccess('user-1', 'appointment', 'apt-1', 'VIEW', false);
      expect(id).toBe('audit-2');
    });
  });

  describe('checkAccess', () => {
    it('should grant access to authorized user', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', roleId: 'role-1' });
      prisma.authRole.findUnique.mockResolvedValue({ name: 'doctor' });
      prisma.authRolePermission.findMany.mockResolvedValue([
        { permission: { module: 'patient', resource: 'patient' } },
      ]);
      const result = await service.checkAccess('user-1', 'patient', 'pat-1');
      expect(result.authorized).toBe(true);
    });

    it('should deny access to inactive user', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', status: 'INACTIVE', roleId: 'role-1' });
      const result = await service.checkAccess('user-1', 'patient', 'pat-1');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('not active');
    });

    it('should deny access when user not found', async () => {
      prisma.authUser.findUnique.mockResolvedValue(null);
      const result = await service.checkAccess('user-1', 'patient', 'pat-1');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should deny access for insufficient permissions', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', roleId: 'role-1' });
      prisma.authRole.findUnique.mockResolvedValue({ name: 'receptionist' });
      prisma.authRolePermission.findMany.mockResolvedValue([
        { permission: { module: 'appointment', resource: 'appointment' } },
      ]);
      prisma.authAuditLog.create.mockResolvedValue({ id: 'audit-3' });
      const result = await service.checkAccess('user-1', 'patient', 'pat-1');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Insufficient permissions');
    });
  });

  describe('getAccessLogs', () => {
    it('should return paginated access logs', async () => {
      prisma.authAuditLog.findMany.mockResolvedValue([{ id: 'audit-1', userId: 'user-1', phiAccessed: true }]);
      prisma.authAuditLog.count.mockResolvedValue(1);
      const result = await service.getAccessLogs('user-1', 'patient', '2024-01-01', '2024-12-31', true, 1, 50);
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('generateBAAReport', () => {
    it('should generate BAA compliance report', async () => {
      prisma.authAuditLog.count.mockResolvedValueOnce(100).mockResolvedValueOnce(5);
      prisma.authAuditLog.groupBy.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
      const report = await service.generateBAAReport();
      expect(report.complianceStatus).toBeDefined();
      expect(report.encryptionStatus).toContain('AES-256-GCM');
      expect(report.auditLoggingEnabled).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('data classification', () => {
    it('should return correct classification for known types', () => {
      expect(service.getDataClassification('patient')).toBe('RESTRICTED');
      expect(service.getDataClassification('lab_result')).toBe('RESTRICTED');
      expect(service.getDataClassification('appointment')).toBe('INTERNAL');
      expect(service.getDataClassification('public_content')).toBe('PUBLIC');
    });

    it('should return INTERNAL for unknown types', () => {
      expect(service.getDataClassification('unknown_type')).toBe('INTERNAL');
    });
  });

  describe('PHI detection', () => {
    it('should detect PHI field names', () => {
      expect(service.isPHI(['patientName', 'dateOfBirth'])).toBe(true);
      expect(service.isPHI(['nationalId', 'ssn'])).toBe(true);
      expect(service.isPHI(['bloodType', 'labResults'])).toBe(true);
      expect(service.isPHI(['city', 'postalCode'])).toBe(false);
    });
  });

  describe('minimum necessary validation', () => {
    it('should allow access with full permissions', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', roleId: 'role-1' });
      prisma.authRolePermission.findMany.mockResolvedValue([
        { permission: { action: 'full_access', module: '*' } },
      ]);
      const result = await service.validateMinimumNecessary('user-1', ['nationalId', 'phone']);
      expect(result.allowed).toBe(true);
      expect(result.blockedFields).toEqual([]);
    });

    it('should block sensitive fields', async () => {
      prisma.authUser.findUnique.mockResolvedValue({ id: 'user-1', roleId: 'role-1' });
      prisma.authRolePermission.findMany.mockResolvedValue([]);
      const result = await service.validateMinimumNecessary('user-1', ['nationalId', 'firstNameAr', 'passwordHash', 'totpSecret']);
      expect(result.blockedFields).toContain('nationalId');
      expect(result.blockedFields).toContain('passwordHash');
      expect(result.blockedFields).toContain('totpSecret');
    });
  });

  describe('audit trail', () => {
    it('should get audit trail for a resource', async () => {
      prisma.authAuditLog.findMany.mockResolvedValue([{ id: 'audit-1', userId: 'user-1', action: 'VIEW' }]);
      const trail = await service.getAuditTrail('patient', 'pat-1');
      expect(trail).toHaveLength(1);
    });
  });

  describe('compliance report', () => {
    it('should generate compliance report with recommendations', async () => {
      prisma.authAuditLog.count.mockResolvedValueOnce(1000).mockResolvedValueOnce(200).mockResolvedValueOnce(15);
      prisma.authAuditLog.groupBy
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ resourceType: 'patient' }])
        .mockResolvedValueOnce([{ resourceType: 'patient', _count: { id: 500 } }])
        .mockResolvedValueOnce([{ userId: 'u1', _count: { id: 300 } }]);
      const report = await service.generateComplianceReport('2024-01-01', '2024-12-31');
      expect(report.period).toBeDefined();
      expect(report.violations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
});
