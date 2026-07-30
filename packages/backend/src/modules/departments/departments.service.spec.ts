import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('DepartmentsService', () => {
  let prisma: typeof mockPrismaService;

  const mockDepartment = {
    id: 'dept-1',
    nameAr: 'المختبر',
    nameEn: 'Laboratory',
    code: 'LAB-01',
    description: 'قسم المختبرات',
    headId: null,
    branchId: 'branch-1',
    parentId: null,
    sortOrder: 0,
    isActive: true,
    budget: 500000,
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
    it('should create a department', async () => {
      prisma.department.create.mockResolvedValue(mockDepartment);

      const result = await prisma.department.create({
        data: { nameAr: 'المختبر', nameEn: 'Laboratory', code: 'LAB-01' },
      });

      expect(result.id).toBe('dept-1');
    });

    it('should find all departments', async () => {
      prisma.department.findMany.mockResolvedValue([mockDepartment]);

      const result = await prisma.department.findMany({ where: { isActive: true } });
      expect(result).toHaveLength(1);
    });

    it('should update a department', async () => {
      const updated = { ...mockDepartment, nameAr: 'مختبر更新的' };
      prisma.department.update.mockResolvedValue(updated);

      const result = await prisma.department.update({ where: { id: 'dept-1' }, data: { nameAr: 'مختبر更新的' } });

      expect(result.nameAr).toBe('مختبر更新的');
    });
  });

  describe('hierarchy', () => {
    it('should support parent-child hierarchy', async () => {
      const childDept = { ...mockDepartment, id: 'dept-2', parentId: 'dept-1' };
      prisma.department.findMany.mockResolvedValue([childDept]);

      const children = await prisma.department.findMany({ where: { parentId: 'dept-1' } });
      expect(children).toHaveLength(1);
      expect(children[0].parentId).toBe('dept-1');
    });
  });

  describe('test assignment', () => {
    it('should assign tests to department via category', async () => {
      prisma.testCategory.findMany.mockResolvedValue([{ id: 'cat-1', departmentId: 'dept-1' }]);

      const categories = await prisma.testCategory.findMany({ where: { departmentId: 'dept-1' } });
      expect(categories).toHaveLength(1);
    });
  });

  describe('doctor assignment', () => {
    it('should assign doctors to department', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([{ id: 'doc-1', departmentId: 'dept-1' }]);

      const doctors = await prisma.doctorProfile.findMany({ where: { departmentId: 'dept-1' } });
      expect(doctors).toHaveLength(1);
    });
  });
});
