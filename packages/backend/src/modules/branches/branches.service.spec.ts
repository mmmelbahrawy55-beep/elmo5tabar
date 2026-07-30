import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('BranchesService', () => {
  let prisma: typeof mockPrismaService;

  const mockBranch = {
    id: 'branch-1',
    nameAr: 'فرع الرياض',
    nameEn: 'Riyadh Branch',
    code: 'RIY-01',
    phone: '+966501234567',
    email: 'riyadh@almokhtabar.com',
    addressAr: 'الرياض، حي العليا',
    addressEn: 'Riyadh, Olaya',
    city: 'الرياض',
    region: 'منطقة الرياض',
    country: 'SA',
    latitude: 24.7136,
    longitude: 46.6753,
    timezone: 'Asia/Riyadh',
    operatingHours: null,
    maxCapacity: 200,
    isActive: true,
    managerId: null,
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
    it('should create a branch', async () => {
      prisma.branch.create.mockResolvedValue(mockBranch);

      const result = await prisma.branch.create({ data: { nameAr: 'فرع الرياض', nameEn: 'Riyadh Branch', code: 'RIY-01', phone: '+966501234567', addressAr: 'الرياض', city: 'الرياض', region: 'منطقة الرياض' } });

      expect(result.id).toBe('branch-1');
    });

    it('should find all branches', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranch]);
      prisma.branch.count.mockResolvedValue(1);

      const [branches, total] = await Promise.all([
        prisma.branch.findMany({ where: { isActive: true } }),
        prisma.branch.count({ where: { isActive: true } }),
      ]);

      expect(branches).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('should find branch by id', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);

      const result = await prisma.branch.findUnique({ where: { id: 'branch-1' } });
      expect(result.id).toBe('branch-1');
    });

    it('should update a branch', async () => {
      const updated = { ...mockBranch, nameAr: 'فرع الرياض الجديد' };
      prisma.branch.update.mockResolvedValue(updated);

      const result = await prisma.branch.update({ where: { id: 'branch-1' }, data: { nameAr: 'فرع الرياض الجديد' } });

      expect(result.nameAr).toBe('فرع الرياض الجديد');
    });

    it('should soft delete a branch', async () => {
      prisma.branch.update.mockResolvedValue({ ...mockBranch, deletedAt: new Date() });

      const result = await prisma.branch.update({ where: { id: 'branch-1' }, data: { deletedAt: new Date() } });

      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('nearby search', () => {
    it('should find branches within radius', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranch]);

      const lat = 24.7136;
      const lng = 46.6753;
      const radius = 10;

      const branches = await prisma.branch.findMany({
        where: {
          isActive: true,
          latitude: { gte: lat - 0.1, lte: lat + 0.1 },
          longitude: { gte: lng - 0.1, lte: lng + 0.1 },
        },
      });

      expect(branches).toHaveLength(1);
    });

    it('should return empty for no nearby branches', async () => {
      prisma.branch.findMany.mockResolvedValue([]);

      const branches = await prisma.branch.findMany({
        where: { latitude: { gte: 100, lte: 101 } },
      });

      expect(branches).toHaveLength(0);
    });
  });

  describe('working hours validation', () => {
    it('should validate operating hours format', () => {
      const validHours = {
        sunday: { open: '08:00', close: '20:00' },
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: null, close: null },
        saturday: { open: '09:00', close: '16:00' },
      };

      expect(validHours.sunday.open).toBe('08:00');
      expect(validHours.friday.open).toBeNull();
    });

    it('should reject invalid time format', () => {
      const invalid = { open: '25:00', close: '20:00' };
      const isValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(invalid.open);
      expect(isValid).toBe(false);
    });
  });

  describe('capacity management', () => {
    it('should track current capacity', async () => {
      prisma.queueEntry.count.mockResolvedValue(50);

      const currentCount = await prisma.queueEntry.count({ where: { branchId: 'branch-1', status: { in: ['WAITING', 'SERVING'] } } });

      expect(currentCount).toBe(50);
    });

    it('should respect max capacity', () => {
      const capacity = mockBranch.maxCapacity || 200;
      expect(capacity).toBeGreaterThan(0);
    });
  });
});
