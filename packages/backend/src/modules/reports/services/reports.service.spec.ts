import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';
import { ReportType } from '../dto/generate-report.dto';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(ReportsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate daily revenue report', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { createdAt: new Date('2025-01-15'), _sum: { total: 5000 }, _count: 10, _avg: { total: 500 } },
      ]);
      const report = await service.generateReport({
        type: ReportType.DAILY_REVENUE,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.DAILY_REVENUE);
      expect(report.titleAr).toBe('تقرير الإيرادات اليومية');
      expect(report.summary.totalRevenue).toBe(5000);
    });

    it('should generate monthly revenue report with YoY comparison', async () => {
      prisma.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000 }, _count: 200 })
        .mockResolvedValueOnce({ _sum: { total: 80000 }, _count: 150 });
      prisma.$queryRaw.mockResolvedValue([
        { month: 1, revenue: 50000, orderCount: 100 },
        { month: 2, revenue: 50000, orderCount: 100 },
      ]);
      const report = await service.generateReport({
        type: ReportType.MONTHLY_REVENUE,
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
      });
      expect(report.type).toBe(ReportType.MONTHLY_REVENUE);
      expect(report.summary.yoyGrowth).toBeGreaterThan(0);
    });

    it('should generate patient summary report', async () => {
      prisma.patient.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(1000);
      prisma.order.groupBy.mockResolvedValue([{ referralSource: 'facebook', _count: 20 }]);
      prisma.patient.groupBy.mockResolvedValue([{ gender: 'MALE', _count: 600 }]);
      const report = await service.generateReport({
        type: ReportType.PATIENT_SUMMARY,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.PATIENT_SUMMARY);
    });

    it('should generate order summary report', async () => {
      prisma.order.groupBy
        .mockResolvedValueOnce([{ status: 'COMPLETED', _count: 100, _sum: { total: 50000 } }])
        .mockResolvedValueOnce([{ collectionType: 'HOME', _count: 30 }])
        .mockResolvedValueOnce([{ branchId: 'b-1', _count: 100, _sum: { total: 50000 } }]);
      const report = await service.generateReport({
        type: ReportType.ORDER_SUMMARY,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        departmentId: 'dept-1',
      });
      expect(report.type).toBe(ReportType.ORDER_SUMMARY);
    });

    it('should generate doctor performance report', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          issuedOrders: [{ id: 'ord-1', total: 5000, createdAt: new Date('2025-01-15'), completedAt: new Date('2025-01-15T02:00:00Z') }],
          user: { profile: { firstNameAr: 'د. أحمد', lastNameAr: 'علي' } },
        },
      ]);
      const report = await service.generateReport({
        type: ReportType.DOCTOR_PERFORMANCE,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.DOCTOR_PERFORMANCE);
      expect(report.summary.topPerformer).toBeDefined();
    });

    it('should generate branch performance report', async () => {
      prisma.branch.findMany.mockResolvedValue([
        { id: 'b-1', nameAr: 'الرياض', orders: [{ total: 50000 }] },
        { id: 'b-2', nameAr: 'جدة', orders: [{ total: 30000 }] },
      ]);
      const report = await service.generateReport({
        type: ReportType.BRANCH_PERFORMANCE,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.BRANCH_PERFORMANCE);
    });

    it('should generate inventory report', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([
        { id: 'inv-1', nameAr: 'قفازات', quantity: 50, reorderPoint: 100, expiryDate: new Date('2024-01-01'), nameEn: 'Gloves', sku: 'GLV-001', category: 'supplies', minQuantity: 20, unit: 'box', location: 'A1', batchNumber: 'B1' },
        { id: 'inv-2', nameAr: 'إبر', quantity: 500, reorderPoint: 200, expiryDate: null, nameEn: 'Needles', sku: 'NDL-001', category: 'supplies', minQuantity: 100, unit: 'box', location: 'A2', batchNumber: 'B2' },
      ]);
      const report = await service.generateReport({
        type: ReportType.INVENTORY_REPORT,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.INVENTORY_REPORT);
    });

    it('should generate insurance report', async () => {
      prisma.insuranceClaim.groupBy.mockResolvedValue([
        { insuranceCompanyId: 'ins-1', _count: 50, _sum: { submittedAmount: 100000 } },
      ]);
      const report = await service.generateReport({
        type: ReportType.INSURANCE_REPORT,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.INSURANCE_REPORT);
    });

    it('should generate tax report', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { total: 1150, tax: 150, createdAt: new Date('2025-01-15') },
      ]);
      const report = await service.generateReport({
        type: ReportType.TAX_REPORT,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      });
      expect(report.type).toBe(ReportType.TAX_REPORT);
      expect(report.summary.zatcaCompliant).toBe(true);
    });

    it('should return cached result on subsequent call', async () => {
      prisma.order.groupBy.mockResolvedValue([
        { createdAt: new Date('2025-01-15'), _sum: { total: 5000 }, _count: 10, _avg: { total: 500 } },
      ]);
      const dto = { type: ReportType.DAILY_REVENUE, dateFrom: '2025-01-01', dateTo: '2025-01-31' };
      const first = await service.generateReport(dto);
      const second = await service.generateReport(dto);
      expect(second).toEqual(first);
    });
  });

  describe('export functions', () => {
    it('should generate PDF HTML', async () => {
      const reportData = {
        titleAr: 'تقرير',
        title: 'Report',
        data: [{ col1: 'val1', col2: 'val2' }],
        summary: { total: 100 },
        generatedAt: new Date(),
      };
      const html = await service.exportToPdf(reportData);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('تقرير');
    });

    it('should generate CSV for Excel export', async () => {
      const reportData = {
        data: [{ name: 'Test', value: 100 }],
        summary: {},
        generatedAt: new Date(),
      };
      const csv = await service.exportToExcel(reportData);
      expect(csv).toContain('name,value');
      expect(csv).toContain('Test,100');
    });
  });

  describe('saved reports', () => {
    it('should get saved reports for user', async () => {
      prisma.report.findMany.mockResolvedValue([{ id: 'rpt-1', reportNumber: 'RPT-001' }]);
      const reports = await service.getSavedReports('user-1');
      expect(reports).toHaveLength(1);
    });

    it('should save a report', async () => {
      prisma.report.create.mockResolvedValue({ id: 'rpt-2' });
      const saved = await service.saveReport('user-1', { type: 'CUSTOM', title: 'My Report', description: 'Test', params: '{}' });
      expect(saved).toBeDefined();
    });
  });
});
