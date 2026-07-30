import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('PackagesService', () => {
  let service: PackagesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(PackagesService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const mockPackage = {
    id: 'pkg-1',
    nameAr: 'باقة الصحة الشاملة',
    nameEn: 'Comprehensive Health Package',
    originalPrice: 1000,
    packagePrice: 750,
    discount: 25,
    discountType: 'percentage',
    isActive: true,
    isPopular: true,
    usageCount: 50,
    deletedAt: null,
    category: { id: 'cat-1', nameAr: 'فحوصات', nameEn: 'Tests' },
    items: [
      { id: 'item-1', labTestId: 'test-1', quantity: 1, labTest: { id: 'test-1', nameAr: 'سكر', nameEn: 'Glucose', price: 200 } },
    ],
  };

  describe('findAll', () => {
    it('should return paginated packages', async () => {
      prisma.testPackage.findMany.mockResolvedValue([mockPackage]);
      prisma.testPackage.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search term', async () => {
      prisma.testPackage.findMany.mockResolvedValue([mockPackage]);
      prisma.testPackage.count.mockResolvedValue(1);
      await service.findAll({ search: 'صحة' });
      expect(prisma.testPackage.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return package with items', async () => {
      prisma.testPackage.findUnique.mockResolvedValue(mockPackage);
      const result = await service.findOne('pkg-1');
      expect(result.id).toBe('pkg-1');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException for deleted package', async () => {
      prisma.testPackage.findUnique.mockResolvedValue({ ...mockPackage, deletedAt: new Date() });
      await expect(service.findOne('pkg-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.testPackage.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a package with items', async () => {
      prisma.labTest.findMany.mockResolvedValue([{ id: 'test-1', price: 200 }]);
      prisma.testPackage.create.mockResolvedValue(mockPackage);
      const result = await service.create({
        nameAr: 'باقة الصحة',
        nameEn: 'Health Package',
        items: [{ labTestId: 'test-1', quantity: 1 }],
        discount: 25,
        discountType: 'percentage',
        categoryId: 'cat-1',
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for invalid lab tests', async () => {
      prisma.labTest.findMany.mockResolvedValue([]);
      await expect(service.create({
        nameAr: 'Test', nameEn: 'Test',
        items: [{ labTestId: 'invalid', quantity: 1 }],
        categoryId: 'cat-1',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update package details', async () => {
      prisma.testPackage.findUnique.mockResolvedValue(mockPackage);
      prisma.testPackage.update.mockResolvedValue(mockPackage);
      const result = await service.update('pkg-1', { nameAr: 'باقة محدثة' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for deleted package', async () => {
      prisma.testPackage.findUnique.mockResolvedValue({ ...mockPackage, deletedAt: new Date() });
      await expect(service.update('pkg-1', { nameAr: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete package', async () => {
      prisma.testPackage.findUnique.mockResolvedValue(mockPackage);
      prisma.testPackage.update.mockResolvedValue({ ...mockPackage, deletedAt: new Date(), isActive: false });
      const result = await service.remove('pkg-1');
      expect(result.message).toContain('deleted');
    });
  });

  describe('getPopular', () => {
    it('should return popular packages from cache or DB', async () => {
      prisma.testPackage.findMany.mockResolvedValue([mockPackage]);
      const result = await service.getPopular(5);
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return package stats', async () => {
      prisma.testPackage.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
      prisma.testPackage.aggregate.mockResolvedValue({ _sum: { usageCount: 200 }, _avg: { discount: 20 } });
      const stats = await service.getStats();
      expect(stats.totalPackages).toBe(10);
      expect(stats.activePackages).toBe(8);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price with best matching package', async () => {
      prisma.labTest.findMany.mockResolvedValue([{ id: 'test-1', nameAr: 'سكر', nameEn: 'Glucose', price: 200 }]);
      prisma.testPackage.findMany.mockResolvedValue([mockPackage]);
      const result = await service.calculatePrice(['test-1']);
      expect(result.originalPrice).toBe(200);
      expect(result.bestPackage).toBeDefined();
    });

    it('should return empty result for empty test IDs', async () => {
      const result = await service.calculatePrice([]);
      expect(result.originalPrice).toBe(0);
      expect(result.bestPackage).toBeNull();
    });
  });
});
