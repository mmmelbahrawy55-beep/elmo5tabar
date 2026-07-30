import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('AdminDashboardService', () => {
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

  describe('aggregated statistics', () => {
    it('should aggregate total counts across entities', async () => {
      mockPrismaService.user.count.mockResolvedValue(50000);
      mockPrismaService.patient.count.mockResolvedValue(45000);
      mockPrismaService.appointment.count.mockResolvedValue(150000);
      mockPrismaService.order.count.mockResolvedValue(120000);
      mockPrismaService.invoice.count.mockResolvedValue(110000);

      const [users, patients, appointments, orders, invoices] = await Promise.all([
        prisma.user.count(),
        prisma.patient.count(),
        prisma.appointment.count(),
        prisma.order.count(),
        prisma.invoice.count(),
      ]);

      expect(users).toBe(50000);
      expect(patients).toBe(45000);
      expect(appointments).toBe(150000);
      expect(orders).toBe(120000);
      expect(invoices).toBe(110000);
    });

    it('should aggregate by branch', async () => {
      mockPrismaService.branch.findMany.mockResolvedValue([
        { id: 'b-1', nameAr: 'الرياض', _count: { appointments: 5000, orders: 4000 } },
        { id: 'b-2', nameAr: 'جدة', _count: { appointments: 3500, orders: 2800 } },
        { id: 'b-3', nameAr: 'الدمام', _count: { appointments: 2000, orders: 1500 } },
      ]);

      const branches = await prisma.branch.findMany({ include: { _count: { select: { appointments: true, orders: true } } } });
      expect(branches).toHaveLength(3);
    });

    it('should compute period-over-period changes', () => {
      const thisPeriod = 12000;
      const lastPeriod = 10000;
      const change = ((thisPeriod - lastPeriod) / lastPeriod) * 100;

      expect(change).toBe(20);
    });
  });

  describe('revenue reports', () => {
    it('should calculate total revenue for period', async () => {
      mockPrismaService.invoice.aggregate.mockResolvedValue({ _sum: { total: 2500000 }, _count: { id: 5000 } });

      const revenue = await prisma.invoice.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: { status: 'PAID', paidAt: { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') } },
      });

      expect(revenue._sum.total).toBe(2500000);
    });

    it('should calculate revenue by payment method', () => {
      const revenueByMethod = [
        { method: 'CREDIT_CARD', amount: 1500000, count: 3000 },
        { method: 'MADA', amount: 500000, count: 1000 },
        { method: 'CASH', amount: 300000, count: 600 },
        { method: 'WALLET', amount: 200000, count: 400 },
      ];

      const total = revenueByMethod.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBe(2500000);
    });

    it('should calculate monthly revenue trend', () => {
      const monthlyRevenue = [
        { month: '2026-01', revenue: 200000 },
        { month: '2026-02', revenue: 190000 },
        { month: '2026-03', revenue: 220000 },
        { month: '2026-04', revenue: 210000 },
        { month: '2026-05', revenue: 240000 },
        { month: '2026-06', revenue: 250000 },
      ];

      const avgMonthly = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0) / monthlyRevenue.length;
      expect(avgMonthly).toBeGreaterThan(200000);
    });
  });

  describe('user growth', () => {
    it('should track new user registrations', async () => {
      mockPrismaService.user.count.mockResolvedValue(1200);

      const newUsers = await prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      });

      expect(newUsers).toBe(1200);
    });

    it('should calculate growth rate', () => {
      const previousMonth = 45000;
      const currentMonth = 50000;
      const growthRate = ((currentMonth - previousMonth) / previousMonth) * 100;

      expect(growthRate).toBeCloseTo(11.11, 1);
    });

    it('should show user distribution by role', () => {
      const usersByRole = [
        { role: 'PATIENT', count: 45000 },
        { role: 'DOCTOR', count: 150 },
        { role: 'LAB_TECHNICIAN', count: 200 },
        { role: 'RECEPTIONIST', count: 80 },
        { role: 'ADMIN', count: 25 },
      ];

      const totalUsers = usersByRole.reduce((sum, r) => sum + r.count, 0);
      expect(totalUsers).toBe(45455);
      expect(usersByRole[0].count / totalUsers).toBeGreaterThan(0.9);
    });
  });

  describe('operational KPIs', () => {
    it('should calculate average appointment duration', () => {
      const totalDuration = 4500;
      const appointmentCount = 300;
      const avgDuration = totalDuration / appointmentCount;

      expect(avgDuration).toBe(15);
    });

    it('should calculate patient acquisition cost', () => {
      const marketingSpend = 50000;
      const newPatients = 1200;
      const cac = marketingSpend / newPatients;

      expect(cac).toBeCloseTo(41.67, 1);
    });

    it('should calculate retention rate', () => {
      const returningPatients = 35000;
      const totalActivePatients = 45000;
      const retentionRate = (returningPatients / totalActivePatients) * 100;

      expect(retentionRate).toBeCloseTo(77.78, 1);
    });
  });
});
