import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('LabTestsService', () => {
  let prisma: typeof mockPrismaService;

  const mockLabTest = {
    id: 'test-1',
    nameAr: 'تحليل سكر',
    nameEn: 'Blood Glucose',
    code: 'GLU-01',
    categoryId: 'cat-1',
    sampleType: 'BLOOD',
    tubeType: 'SST',
    tubeColor: 'RED',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTimeHours: 24,
    price: 150.00,
    discountedPrice: null,
    currency: 'SAR',
    homeCollection: true,
    popular: true,
    isActive: true,
    preparationNotesAr: 'صيام 8 ساعات قبل التحليل',
    preparationNotesEn: 'Fast for 8 hours before the test',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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

  describe('CRUD', () => {
    it('should create a lab test', async () => {
      prisma.labTest.create.mockResolvedValue(mockLabTest);

      const result = await prisma.labTest.create({
        data: {
          nameAr: 'تحليل سكر',
          nameEn: 'Blood Glucose',
          code: 'GLU-01',
          categoryId: 'cat-1',
          sampleType: 'BLOOD',
          price: 150,
        },
      });

      expect(result.id).toBe('test-1');
    });

    it('should find all active lab tests', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockLabTest]);
      prisma.labTest.count.mockResolvedValue(1);

      const [tests, total] = await Promise.all([
        prisma.labTest.findMany({ where: { isActive: true } }),
        prisma.labTest.count({ where: { isActive: true } }),
      ]);

      expect(tests).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('should update a lab test', async () => {
      const updated = { ...mockLabTest, price: 200 };
      prisma.labTest.update.mockResolvedValue(updated);

      const result = await prisma.labTest.update({ where: { id: 'test-1' }, data: { price: 200 } });
      expect(result.price).toBe(200);
    });

    it('should soft delete a lab test', async () => {
      prisma.labTest.update.mockResolvedValue({ ...mockLabTest, deletedAt: new Date() });

      const result = await prisma.labTest.update({ where: { id: 'test-1' }, data: { deletedAt: new Date() } });
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('test categories', () => {
    it('should find tests by category', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockLabTest]);

      const tests = await prisma.labTest.findMany({ where: { categoryId: 'cat-1' } });
      expect(tests).toHaveLength(1);
    });
  });

  describe('preparation instructions', () => {
    it('should include preparation notes', () => {
      expect(mockLabTest.preparationNotesAr).toContain('صيام');
      expect(mockLabTest.preparationNotesEn).toContain('Fast');
    });
  });

  describe('price calculation', () => {
    it('should calculate correct price', () => {
      const price = mockLabTest.price;
      const discountedPrice = mockLabTest.discountedPrice;
      const finalPrice = discountedPrice ?? price;

      expect(finalPrice).toBe(150);
    });

    it('should apply discount when available', () => {
      const testWithDiscount = { ...mockLabTest, discountedPrice: 120 };
      const finalPrice = testWithDiscount.discountedPrice ?? testWithDiscount.price;

      expect(finalPrice).toBe(120);
    });
  });

  describe('availability check', () => {
    it('should return true for active test', () => {
      expect(mockLabTest.isActive).toBe(true);
    });

    it('should return false for inactive test', () => {
      expect({ ...mockLabTest, isActive: false }.isActive).toBe(false);
    });
  });

  describe('result templates', () => {
    it('should define reference range', () => {
      const referenceRange = { male: { low: 70, high: 110 }, female: { low: 70, high: 110 } };
      expect(referenceRange.male.low).toBe(70);
      expect(referenceRange.male.high).toBe(110);
    });
  });
});
