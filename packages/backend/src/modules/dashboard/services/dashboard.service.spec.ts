import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(DashboardService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('getExecutiveSummary', () => {
    it('should return executive summary with today, monthly, pending, and trend data', async () => {
      prisma.order.count
        .mockResolvedValueOnce(25).mockResolvedValueOnce(500).mockResolvedValueOnce(30).mockResolvedValueOnce(20);
      prisma.patient.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      prisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 25000 } })
        .mockResolvedValueOnce({ _sum: { total: 500000 } })
        .mockResolvedValueOnce({ _sum: { total: 20000 } });
      prisma.appointment.count.mockResolvedValueOnce(40).mockResolvedValueOnce(60);
      prisma.report.count.mockResolvedValue(15);
      const result = await service.getExecutiveSummary();
      expect(result.today.orders).toBe(25);
      expect(result.monthly.revenue).toBe(500000);
      expect(result.pending.reports).toBe(15);
      expect(result.trends).toBeDefined();
    });

    it('should accept branchId filter', async () => {
      prisma.order.count
        .mockResolvedValueOnce(5).mockResolvedValueOnce(100).mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      prisma.patient.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
      prisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 5000 } })
        .mockResolvedValueOnce({ _sum: { total: 100000 } })
        .mockResolvedValueOnce({ _sum: { total: 4000 } });
      prisma.appointment.count.mockResolvedValueOnce(10).mockResolvedValueOnce(15);
      prisma.report.count.mockResolvedValue(3);
      const result = await service.getExecutiveSummary('branch-1');
      expect(result.today.orders).toBe(5);
    });
  });

  describe('getRevenueChart', () => {
    it('should return daily revenue chart data', async () => {
      prisma.order.findMany.mockResolvedValue([
        { total: 5000, createdAt: new Date('2025-01-15') },
        { total: 3000, createdAt: new Date('2025-01-15') },
        { total: 7000, createdAt: new Date('2025-01-16') },
      ]);
      const result = await service.getRevenueChart('2025-01-01', '2025-01-31', 'day');
      expect(result.labels).toHaveLength(2);
      expect(result.revenue).toHaveLength(2);
      expect(result.revenue[0]).toBe(8000);
    });

    it('should return weekly aggregation', async () => {
      prisma.order.findMany.mockResolvedValue([
        { total: 10000, createdAt: new Date('2025-01-06') },
        { total: 15000, createdAt: new Date('2025-01-13') },
      ]);
      const result = await service.getRevenueChart('2025-01-01', '2025-01-31', 'week');
      expect(result.labels).toBeDefined();
    });
  });

  describe('getOrderStats', () => {
    it('should return order status distribution', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { id: 200 } },
        { status: 'PENDING', _count: { id: 50 } },
      ]);
      const result = await service.getOrderStats('2025-01-01', '2025-01-31');
      expect(result.total).toBeGreaterThan(0);
      expect(result.statuses.COMPLETED).toBe(200);
    });
  });

  describe('getTopTests', () => {
    it('should return top tests by order count', async () => {
      prisma.orderItem.groupBy.mockResolvedValue([
        { labTestId: 'test-1', _count: { id: 100 }, _sum: { total: 15000 } },
        { labTestId: 'test-2', _count: { id: 80 }, _sum: { total: 12000 } },
      ]);
      prisma.labTest.findMany.mockResolvedValue([
        { id: 'test-1', nameAr: 'سكر', nameEn: 'Glucose', code: 'GLU', price: 150 },
        { id: 'test-2', nameAr: 'ضغط', nameEn: 'Pressure', code: 'BLOOD', price: 100 },
      ]);
      const result = await service.getTopTests(5);
      expect(result).toHaveLength(2);
      expect(result[0].test).toBeDefined();
    });
  });

  describe('getTopDoctors', () => {
    it('should return top doctors by orders', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { doctorId: 'user-1', _count: { id: 50 }, _sum: { total: 50000 } },
      ]);
      prisma.doctorProfile.findMany.mockResolvedValue([
        { userId: 'user-1', licenseNumber: 'LIC-001', specialtyAr: 'طب عام', specialtyEn: 'General', rating: 4.5, totalRatings: 100, user: { id: 'user-1', email: 'dr@test.com', profile: { firstNameAr: 'د. أحمد', lastNameAr: 'علي', firstNameEn: 'Dr. Ahmed', lastNameEn: 'Ali' } } },
      ]);
      const result = await service.getTopDoctors(10);
      expect(result).toHaveLength(1);
    });
  });

  describe('getBranchPerformance', () => {
    it('should return branch performance rankings', async () => {
      prisma.branch.findMany.mockResolvedValue([
        { id: 'b-1', nameAr: 'الرياض', nameEn: 'Riyadh', code: 'RIY', city: 'الرياض' },
      ]);
      prisma.order.count.mockResolvedValue(100);
      prisma.order.aggregate.mockResolvedValue({ _sum: { total: 100000 } });
      prisma.patient.count.mockResolvedValue(80);
      prisma.queueEntry.aggregate.mockResolvedValue({ _avg: { actualWaitMinutes: 15 } });
      const result = await service.getBranchPerformance('2025-01-01', '2025-01-31');
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(100000);
    });
  });

  describe('getDepartmentPerformance', () => {
    it('should return department performance', async () => {
      prisma.department.findMany.mockResolvedValue([
        { id: 'dept-1', nameAr: 'مختبر', nameEn: 'Lab', code: 'LAB' },
      ]);
      prisma.orderItem.count.mockResolvedValue(200);
      prisma.orderItem.aggregate.mockResolvedValue({ _sum: { total: 50000 }, _count: { id: 200 } });
      prisma.report.aggregate.mockResolvedValue({ _count: { id: 50 } });
      const result = await service.getDepartmentPerformance('2025-01-01', '2025-01-31');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAppointmentStats', () => {
    it('should return appointment statistics with hourly distribution', async () => {
      prisma.appointment.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: { id: 150 } },
        { status: 'CANCELLED', _count: { id: 20 } },
        { status: 'NO_SHOW', _count: { id: 10 } },
      ]);
      prisma.appointment.count.mockResolvedValue(180);
      prisma.appointment.findMany.mockResolvedValue([
        { scheduledAt: new Date('2025-01-15T10:00:00Z'), status: 'COMPLETED' },
        { scheduledAt: new Date('2025-01-15T10:30:00Z'), status: 'COMPLETED' },
      ]);
      const result = await service.getAppointmentStats('2025-01-01', '2025-01-31');
      expect(result.total).toBe(180);
      expect(result.byHour).toHaveLength(24);
    });
  });

  describe('getPatientStats', () => {
    it('should return patient demographics and trends', async () => {
      prisma.patient.count
        .mockResolvedValueOnce(5000)
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(150);
      prisma.patient.groupBy
        .mockResolvedValueOnce([{ gender: 'MALE', _count: { id: 2500 } }, { gender: 'FEMALE', _count: { id: 2500 } }])
        .mockResolvedValueOnce([{ nationality: 'سعودي', _count: { id: 4000 } }]);
      prisma.$queryRaw.mockResolvedValue([
        { age_group: '18-30', count: 1000n },
        { age_group: '31-45', count: 2000n },
      ]);
      const result = await service.getPatientStats('2025-01-01', '2025-01-31');
      expect(result.total).toBe(5000);
      expect(result.byGender).toHaveLength(2);
      expect(result.byAgeGroup).toHaveLength(2);
    });
  });

  describe('getInventoryAlerts', () => {
    it('should return inventory alerts for low stock, expired, and below reorder', async () => {
      prisma.inventoryItem.findMany
        .mockResolvedValueOnce([{ id: 'inv-1', nameAr: 'قفازات', quantity: 10, minQuantity: 50, reorderPoint: 30, sku: 'GLV', category: 'supplies', unit: 'box', location: 'A1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.inventoryItem.fields = { minQuantity: 'minQuantity', reorderPoint: 'reorderPoint' } as any;
      const result = await service.getInventoryAlerts();
      expect(result.lowStock).toHaveLength(1);
      expect(result.totalAlerts).toBe(1);
    });
  });

  describe('getRecentActivity', () => {
    it('should return merged recent activity from orders, reports, payments, appointments', async () => {
      prisma.order.findMany.mockResolvedValue([{ id: 'ord-1', orderNumber: 'ORD-001', status: 'COMPLETED', total: 100, createdAt: new Date(), patient: { firstNameAr: 'محمد' }, branch: {} }]);
      prisma.report.findMany.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.appointment.findMany.mockResolvedValue([]);
      const result = await service.getRecentActivity(20);
      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].type).toBe('order');
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      prisma.user.count.mockResolvedValue(50);
      prisma.systemLog.count.mockResolvedValue(3);
      prisma.order.count.mockResolvedValueOnce(10000).mockResolvedValueOnce(100);
      prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);
      const result = await service.getSystemHealth();
      expect(result.status).toBe('healthy');
      expect(result.database).toBe('connected');
      expect(result.activeUsers).toBe(50);
    });

    it('should show degraded status when DB fails', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.systemLog.count.mockResolvedValue(0);
      prisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      prisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));
      const result = await service.getSystemHealth();
      expect(result.status).toBe('degraded');
    });
  });
});
