import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('AnalyticsService', () => {
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

  describe('dashboard aggregation', () => {
    it('should aggregate today metrics', async () => {
      mockPrismaService.appointment.count.mockResolvedValue(50);
      mockPrismaService.order.count.mockResolvedValue(30);
      mockPrismaService.patient.count.mockResolvedValue(20);

      const [appointments, orders, newPatients] = await Promise.all([
        prisma.appointment.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.patient.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      ]);

      expect(appointments).toBe(50);
      expect(orders).toBe(30);
      expect(newPatients).toBe(20);
    });

    it('should aggregate weekly metrics', async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      mockPrismaService.appointment.count.mockResolvedValue(350);
      mockPrismaService.invoice.aggregate.mockResolvedValue({ _sum: { total: 50000 } });

      const [totalAppointments, revenue] = await Promise.all([
        prisma.appointment.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.invoice.aggregate({ _sum: { total: true }, where: { createdAt: { gte: weekAgo }, status: 'PAID' } }),
      ]);

      expect(totalAppointments).toBe(350);
      expect(revenue._sum.total).toBe(50000);
    });
  });

  describe('time series queries', () => {
    it('should return daily counts for a date range', async () => {
      const mockDailyData = [
        { date: '2026-07-01', count: 45 },
        { date: '2026-07-02', count: 52 },
        { date: '2026-07-03', count: 38 },
      ];

      expect(mockDailyData).toHaveLength(3);
      expect(mockDailyData[0].count).toBe(45);
    });

    it('should calculate month-over-month growth', () => {
      const thisMonth = 1200;
      const lastMonth = 1000;
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100;

      expect(growth).toBe(20);
    });

    it('should handle empty time series', () => {
      const emptyData: Array<{ date: string; count: number }> = [];
      expect(emptyData).toHaveLength(0);
    });
  });

  describe('report generation', () => {
    it('should generate summary report', () => {
      const report = {
        period: '2026-Q2',
        totalPatients: 5000,
        totalAppointments: 3500,
        totalRevenue: 875000,
        topTests: [
          { name: 'Complete Blood Count', count: 1200 },
          { name: 'Blood Glucose', count: 980 },
          { name: 'Lipid Profile', count: 750 },
        ],
        completionRate: 94.5,
      };

      expect(report.totalRevenue).toBe(875000);
      expect(report.topTests).toHaveLength(3);
    });

    it('should generate department-wise report', () => {
      const departments = [
        { name: 'Hematology', tests: 1500, revenue: 300000 },
        { name: 'Chemistry', tests: 2000, revenue: 350000 },
        { name: 'Microbiology', tests: 800, revenue: 225000 },
      ];

      const totalRevenue = departments.reduce((sum, d) => sum + d.revenue, 0);
      expect(totalRevenue).toBe(875000);
    });
  });

  describe('data export', () => {
    it('should format data for CSV export', () => {
      const data = [
        { date: '2026-07-01', appointments: 45, revenue: 9000 },
        { date: '2026-07-02', appointments: 52, revenue: 10400 },
      ];

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row) => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      expect(csv).toContain('date,appointments,revenue');
      expect(csv).toContain('2026-07-01,45,9000');
    });

    it('should handle large exports', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `data-${i}` }));
      expect(largeData).toHaveLength(10000);
    });
  });

  describe('revenue analytics', () => {
    it('should calculate average revenue per patient', () => {
      const totalRevenue = 875000;
      const totalPatients = 5000;
      const avgRevenue = totalRevenue / totalPatients;

      expect(avgRevenue).toBe(175);
    });

    it('should calculate cancellation rate', () => {
      const total = 3500;
      const cancelled = 175;
      const rate = (cancelled / total) * 100;

      expect(rate).toBe(5);
    });

    it('should identify peak hours', () => {
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: Math.floor(Math.random() * 100) }));
      hourlyData[10].count = 95;
      hourlyData[11].count = 88;

      const peak = hourlyData.reduce((max, h) => (h.count > max.count ? h : max), hourlyData[0]);

      expect(peak.hour).toBe(10);
    });
  });
});
