import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TestsService } from './tests.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('TestsService', () => {
  let service: TestsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(TestsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const mockTest = {
    id: 'test-1',
    nameAr: 'سكر صائم',
    nameEn: 'Fasting Glucose',
    code: 'GLU',
    categoryId: 'cat-1',
    sampleType: 'BLOOD',
    price: 150,
    isActive: true,
    popular: true,
    featured: false,
    deletedAt: null,
    category: { id: 'cat-1', nameAr: 'فحوصات الدم', nameEn: 'Blood Tests', slug: 'blood-tests' },
    branchPricing: [],
    _count: { orderItems: 100, packageItems: 5, branchPricing: 2 },
  };

  describe('findAll', () => {
    it('should return paginated lab tests', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      prisma.labTest.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      prisma.labTest.count.mockResolvedValue(1);
      await service.findAll({ categoryId: 'cat-1' });
      expect(prisma.labTest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ categoryId: 'cat-1' }) }),
      );
    });

    it('should filter by price range', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      prisma.labTest.count.mockResolvedValue(1);
      await service.findAll({ minPrice: 100, maxPrice: 200 });
    });
  });

  describe('findOne', () => {
    it('should find test by ID', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      const result = await service.findOne('test-1');
      expect(result.id).toBe('test-1');
    });

    it('should find test by code', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      const result = await service.findOne('GLU');
      expect(result.id).toBe('test-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.labTest.findFirst.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a lab test', async () => {
      prisma.labTest.findUnique.mockResolvedValue(null);
      prisma.testCategory.findUnique.mockResolvedValue({ id: 'cat-1', nameAr: 'فحوصات الدم' });
      prisma.labTest.create.mockResolvedValue(mockTest);
      const result = await service.create({
        nameAr: 'سكر صائم',
        nameEn: 'Fasting Glucose',
        code: 'GLU',
        categoryId: 'cat-1',
        sampleType: 'BLOOD',
        price: 150,
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for duplicate code', async () => {
      prisma.labTest.findUnique.mockResolvedValue(mockTest);
      await expect(service.create({
        nameAr: 'Test', nameEn: 'Test', code: 'GLU', categoryId: 'cat-1', sampleType: 'BLOOD', price: 100,
      })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for invalid category', async () => {
      prisma.labTest.findUnique.mockResolvedValue(null);
      prisma.testCategory.findUnique.mockResolvedValue(null);
      await expect(service.create({
        nameAr: 'Test', nameEn: 'Test', code: 'NEW', categoryId: 'invalid', sampleType: 'BLOOD', price: 100,
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a lab test', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      prisma.labTest.update.mockResolvedValue({ ...mockTest, nameAr: 'غدة درقية' });
      const result = await service.update('test-1', { nameAr: 'غدة درقية' });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete a test', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      prisma.labTest.update.mockResolvedValue({ ...mockTest, deletedAt: new Date(), isActive: false });
      const result = await service.remove('test-1');
      expect(result.message).toContain('deleted');
    });
  });

  describe('categories', () => {
    it('should get all categories', async () => {
      prisma.testCategory.findMany.mockResolvedValue([{ id: 'cat-1', nameAr: 'فحوصات', _count: { labTests: 10, children: 2 } }]);
      const categories = await service.getCategories();
      expect(categories).toHaveLength(1);
    });

    it('should create a category', async () => {
      prisma.testCategory.findUnique.mockResolvedValue(null);
      prisma.testCategory.create.mockResolvedValue({ id: 'cat-1', nameAr: 'فحوصات الدم', slug: 'blood-tests' });
      const cat = await service.createCategory({ nameAr: 'فحوصات الدم', nameEn: 'Blood Tests' });
      expect(cat).toBeDefined();
    });

    it('should throw ConflictException for duplicate slug', async () => {
      prisma.testCategory.findUnique.mockResolvedValue({ id: 'cat-1', slug: 'blood-tests' });
      await expect(service.createCategory({ nameAr: 'Test', nameEn: 'Blood Tests' })).rejects.toThrow(ConflictException);
    });

    it('should update a category', async () => {
      prisma.testCategory.findUnique.mockResolvedValue({ id: 'cat-1', nameAr: 'Old' });
      prisma.testCategory.update.mockResolvedValue({ id: 'cat-1', nameAr: 'New' });
      const result = await service.updateCategory('cat-1', { nameAr: 'New' });
      expect(result).toBeDefined();
    });
  });

  describe('popular & featured', () => {
    it('should return popular tests', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      const result = await service.getPopular();
      expect(result).toHaveLength(1);
    });

    it('should return featured tests', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      const result = await service.getFeatured();
      expect(result).toHaveLength(1);
    });
  });

  describe('branch pricing', () => {
    it('should get branch pricing', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      prisma.testBranchPricing.findMany.mockResolvedValue([{ labTestId: 'test-1', branchId: 'b-1', price: 180, branch: { id: 'b-1', nameAr: 'الرياض', nameEn: 'Riyadh', code: 'RIY' } }]);
      const pricing = await service.getBranchPricing('test-1');
      expect(pricing).toHaveLength(1);
    });

    it('should upsert branch pricing', async () => {
      prisma.labTest.findFirst.mockResolvedValue(mockTest);
      prisma.branch.findUnique.mockResolvedValue({ id: 'b-1', nameAr: 'الرياض' });
      prisma.testBranchPricing.upsert.mockResolvedValue({ labTestId: 'test-1', branchId: 'b-1', price: 180, branch: { id: 'b-1', nameAr: 'الرياض', nameEn: 'Riyadh' } });
      const result = await service.setBranchPricing('test-1', 'b-1', { branchId: 'b-1', price: 180 });
      expect(result).toBeDefined();
    });
  });

  describe('search', () => {
    it('should search tests by name or code', async () => {
      prisma.labTest.findMany.mockResolvedValue([mockTest]);
      const result = await service.searchTests('سكر');
      expect(result).toHaveLength(1);
    });

    it('should return empty for short query', async () => {
      const result = await service.searchTests('a');
      expect(result).toEqual([]);
    });
  });

  describe('stats', () => {
    it('should return test statistics', async () => {
      prisma.labTest.count
        .mockResolvedValueOnce(100).mockResolvedValueOnce(80)
        .mockResolvedValueOnce(15).mockResolvedValueOnce(10);
      prisma.testCategory.count.mockResolvedValue(8);
      prisma.labTest.aggregate.mockResolvedValue({ _avg: { price: 150 }, _min: { price: 50 }, _max: { price: 2000 } });
      prisma.labTest.groupBy.mockResolvedValue([{ sampleType: 'BLOOD', _count: 60 }]);
      const stats = await service.getStats();
      expect(stats.totalTests).toBe(100);
      expect(stats.averagePrice).toBe(150);
    });
  });
});
