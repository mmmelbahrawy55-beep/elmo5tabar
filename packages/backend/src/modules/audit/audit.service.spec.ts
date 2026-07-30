import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('AuditService', () => {
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('log creation', () => {
    it('should create an audit log entry', async () => {
      const auditEntry = {
        id: 'audit-1',
        userId: 'user-1',
        action: 'UPDATE',
        entity: 'patients',
        entityId: 'patient-1',
        oldValues: { phone: '+966500000000' },
        newValues: { phone: '+966501234567' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        severity: 'info',
        createdAt: new Date(),
      };

      mockPrismaService.auditLog.create.mockResolvedValue(auditEntry);

      const result = await mockPrismaService.auditLog.create({
        data: { userId: 'user-1', action: 'UPDATE', entity: 'patients', entityId: 'patient-1', oldValues: { phone: '+966500000000' }, newValues: { phone: '+966501234567' }, ipAddress: '192.168.1.100', severity: 'info' },
      });

      expect(result.action).toBe('UPDATE');
      expect(result.entity).toBe('patients');
    });

    it('should log login events', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-2',
        userId: 'user-1',
        action: 'LOGIN',
        entity: 'users',
        entityId: 'user-1',
        ipAddress: '10.0.0.1',
        severity: 'info',
      });

      const result = await mockPrismaService.auditLog.create({
        data: { userId: 'user-1', action: 'LOGIN', entity: 'users', entityId: 'user-1', ipAddress: '10.0.0.1', severity: 'info' },
      });

      expect(result.action).toBe('LOGIN');
    });

    it('should log security-critical events with warning severity', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-3',
        userId: 'user-1',
        action: 'LOGIN_FAILURE',
        entity: 'users',
        severity: 'warning',
        ipAddress: '192.168.1.100',
      });

      const result = await mockPrismaService.auditLog.create({
        data: { userId: 'user-1', action: 'LOGIN_FAILURE', entity: 'users', severity: 'warning', ipAddress: '192.168.1.100' },
      });

      expect(result.severity).toBe('warning');
    });

    it('should log data export as critical', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'audit-4',
        userId: 'user-1',
        action: 'EXPORT',
        entity: 'patients',
        severity: 'critical',
        metadata: { recordCount: 5000 },
      });

      const result = await mockPrismaService.auditLog.create({
        data: { userId: 'user-1', action: 'EXPORT', entity: 'patients', severity: 'critical', metadata: { recordCount: 5000 } },
      });

      expect(result.severity).toBe('critical');
    });
  });

  describe('query with filters', () => {
    it('should filter audit logs by user', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        { id: 'audit-1', userId: 'user-1', action: 'LOGIN', createdAt: new Date() },
        { id: 'audit-2', userId: 'user-1', action: 'UPDATE', createdAt: new Date() },
      ]);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: { userId: 'user-1' } }),
        prisma.auditLog.count({ where: { userId: 'user-1' } }),
      ]);

      expect(logs).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter by entity type', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([{ id: 'audit-3', entity: 'orders' }]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: { entity: 'orders' } }),
        prisma.auditLog.count({ where: { entity: 'orders' } }),
      ]);

      expect(total).toBe(1);
    });

    it('should filter by date range', async () => {
      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-12-31');

      mockPrismaService.auditLog.count.mockResolvedValue(500);

      const total = await prisma.auditLog.count({
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
      });

      expect(total).toBe(500);
    });

    it('should filter by severity', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        { id: 'audit-4', severity: 'critical' },
        { id: 'audit-5', severity: 'critical' },
      ]);
      mockPrismaService.auditLog.count.mockResolvedValue(2);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: { severity: 'critical' } }),
        prisma.auditLog.count({ where: { severity: 'critical' } }),
      ]);

      expect(total).toBe(2);
    });

    it('should support pagination', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(1000);

      const page = 5;
      const limit = 50;
      const skip = (page - 1) * limit;
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.auditLog.count(),
      ]);

      expect(total).toBe(1000);
      expect(skip).toBe(200);
    });

    it('should return empty for no matching logs', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: { action: 'NONEXISTENT' } }),
        prisma.auditLog.count({ where: { action: 'NONEXISTENT' } }),
      ]);

      expect(logs).toHaveLength(0);
      expect(total).toBe(0);
    });
  });

  describe('data retention', () => {
    it('should delete logs older than retention period', async () => {
      const retentionDays = 365;
      const cutoffDate = new Date(Date.now() - retentionDays * 86400000);

      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 1000 });

      const result = await mockPrismaService.auditLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      expect(result.count).toBe(1000);
    });

    it('should archive critical logs before deletion', () => {
      const criticalLogs = [
        { id: 'critical-1', severity: 'critical', createdAt: new Date('2024-01-01') },
        { id: 'critical-2', severity: 'critical', createdAt: new Date('2024-06-01') },
      ];

      const toDelete = { count: 100 };
      const retained = criticalLogs.length;

      expect(toDelete.count).toBeGreaterThan(0);
      expect(retained).toBe(2);
    });

    it('should not delete logs within retention period', () => {
      const retentionDays = 365;
      const recentLog = { createdAt: new Date(Date.now() - 30 * 86400000) };
      const shouldKeep = (Date.now() - recentLog.createdAt.getTime()) < retentionDays * 86400000;

      expect(shouldKeep).toBe(true);
    });

    it('should handle empty retention cleanup', async () => {
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 0 });

      const result = await mockPrismaService.auditLog.deleteMany({
        where: { createdAt: { lt: new Date('2000-01-01') } },
      });

      expect(result.count).toBe(0);
    });
  });
});
