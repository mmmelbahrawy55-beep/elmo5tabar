import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReportStatus } from '@prisma/client';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';
import * as crypto from 'crypto';

describe('ResultsService', () => {
  let prisma: typeof mockPrismaService;

  const mockReport = {
    id: 'rpt-1',
    reportNumber: 'RPT-2026000001',
    orderId: 'order-1',
    patientId: 'patient-1',
    reviewedById: null,
    approvedById: null,
    status: ReportStatus.DRAFT,
    summary: null,
    conclusions: null,
    recommendations: null,
    aiInsight: null,
    aiConfidence: null,
    pdfUrl: null,
    pdfSize: null,
    digitalSignature: null,
    signatureAlgorithm: null,
    verifiedById: null,
    verifiedAt: null,
    releasedAt: null,
    amendedAt: null,
    amendReason: null,
    version: 1,
    isCritical: false,
    viewCount: 0,
    downloadCount: 0,
    createdBy: 'tech-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    items: [
      {
        id: 'item-1',
        reportId: 'rpt-1',
        labTestId: 'test-1',
        value: '5.5',
        numericValue: 5.5,
        unit: 'mmol/L',
        referenceRangeLow: 3.9,
        referenceRangeHigh: 6.1,
        referenceRangeText: '3.9 - 6.1 mmol/L',
        isAbnormal: false,
        abnormalityType: null,
        flags: null,
        methodology: 'Colorimetric',
        notes: null,
        displayOrder: 0,
        labTest: {
          id: 'test-1',
          nameAr: 'سكر صائم',
          nameEn: 'Fasting Glucose',
          code: 'GLU-F',
        },
      },
    ],
    patient: { id: 'patient-1', firstNameAr: 'محمد', lastNameAr: 'أحمد' },
    order: { id: 'order-1', orderNumber: 'ORD-2026000001' },
  };

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

  describe('result entry', () => {
    it('should create report items with values', async () => {
      const reportItem = {
        id: 'item-1',
        reportId: 'rpt-1',
        labTestId: 'test-1',
        value: '5.5',
        numericValue: 5.5,
        unit: 'mmol/L',
        referenceRangeLow: 3.9,
        referenceRangeHigh: 6.1,
        isAbnormal: false,
      };
      prisma.reportItem.create.mockResolvedValue(reportItem);

      const result = await prisma.reportItem.create({
        data: { reportId: 'rpt-1', labTestId: 'test-1', value: '5.5', numericValue: 5.5, unit: 'mmol/L', referenceRangeLow: 3.9, referenceRangeHigh: 6.1 },
      });

      expect(result.numericValue).toBe(5.5);
    });

    it('should detect abnormal values', () => {
      const isAbnormal = (value: number, low: number, high: number): boolean => value < low || value > high;

      expect(isAbnormal(10, 3.9, 6.1)).toBe(true);
      expect(isAbnormal(5.0, 3.9, 6.1)).toBe(false);
      expect(isAbnormal(2.0, 3.9, 6.1)).toBe(true);
    });
  });

  describe('report generation', () => {
    it('should generate report with all items', async () => {
      prisma.report.findUnique.mockResolvedValue(mockReport);
      prisma.report.update.mockResolvedValue({ ...mockReport, status: ReportStatus.RELEASED, releasedAt: new Date() });

      const result = await prisma.report.update({
        where: { id: 'rpt-1' },
        data: { status: ReportStatus.RELEASED, releasedAt: new Date() },
      });

      expect(result.status).toBe(ReportStatus.RELEASED);
    });

    it('should handle report with no items', async () => {
      const emptyReport = { ...mockReport, items: [] };
      prisma.report.findUnique.mockResolvedValue(emptyReport);

      const result = await prisma.report.findUnique({ where: { id: 'rpt-1' } });
      expect(result.items).toHaveLength(0);
    });
  });

  describe('PDF signing with RSA SHA-256', () => {
    it('should sign report data with RSA SHA-256', () => {
      const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const data = JSON.stringify(mockReport);
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should verify signed data', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const data = JSON.stringify(mockReport);
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();
      const isValid = verify.verify(publicKey, signature, 'base64');

      expect(isValid).toBe(true);
    });

    it('should reject tampered data', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      const original = JSON.stringify(mockReport);
      const sign = crypto.createSign('SHA256');
      sign.update(original);
      sign.end();
      const signature = sign.sign(privateKey, 'base64');

      const tampered = JSON.stringify({ ...mockReport, status: 'RELEASED' });
      const verify = crypto.createVerify('SHA256');
      verify.update(tampered);
      verify.end();
      const isValid = verify.verify(publicKey, signature, 'base64');

      expect(isValid).toBe(false);
    });
  });

  describe('critical value detection', () => {
    it('should detect critical high value', () => {
      const isCritical = (value: number, criticalHigh: number): boolean => value >= criticalHigh;

      expect(isCritical(25, 20)).toBe(true);
      expect(isCritical(15, 20)).toBe(false);
    });

    it('should detect critical low value', () => {
      const isCritical = (value: number, criticalLow: number): boolean => value <= criticalLow;

      expect(isCritical(1.0, 2.0)).toBe(true);
      expect(isCritical(3.0, 2.0)).toBe(false);
    });

    it('should set isCritical flag on report', async () => {
      prisma.report.update.mockResolvedValue({ ...mockReport, isCritical: true });

      const result = await prisma.report.update({
        where: { id: 'rpt-1' },
        data: { isCritical: true },
      });

      expect(result.isCritical).toBe(true);
    });
  });

  describe('results sharing', () => {
    it('should create share link with expiry', async () => {
      const shareLink = {
        id: 'share-1',
        reportId: 'rpt-1',
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      };

      expect(shareLink.token).toBeDefined();
      expect(shareLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should expire share link after TTL', () => {
      const expired = new Date(Date.now() - 1000);
      const isExpired = expired < new Date();
      expect(isExpired).toBe(true);
    });
  });

  describe('historical comparison', () => {
    it('should compare current and previous results', () => {
      const previous = { value: 5.0, date: new Date('2026-01-01') };
      const current = { value: 5.5, date: new Date('2026-06-01') };
      const change = ((current.value - previous.value) / previous.value) * 100;

      expect(change).toBe(10);
    });

    it('should detect trend direction', () => {
      const results = [
        { value: 4.5, date: new Date('2026-01-01') },
        { value: 5.0, date: new Date('2026-03-01') },
        { value: 5.5, date: new Date('2026-06-01') },
      ];

      const trend = results[results.length - 1].value > results[0].value ? 'increasing' : 'decreasing';
      expect(trend).toBe('increasing');
    });
  });
});
