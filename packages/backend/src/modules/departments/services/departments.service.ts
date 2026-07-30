import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { doctors: true, employees: true, children: true } },
        branch: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    return departments;
  }

  async getTree() {
    const departments = await this.prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { doctors: true, employees: true, children: true } },
        children: {
          where: { deletedAt: null },
          include: {
            _count: { select: { doctors: true, employees: true, children: true } },
            children: {
              where: { deletedAt: null },
              include: {
                _count: { select: { doctors: true, employees: true, children: true } },
              },
              orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });

    const tree = departments.filter((d) => !d.parentId);
    return tree;
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        children: {
          where: { deletedAt: null },
          select: { id: true, nameAr: true, nameEn: true, code: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        branch: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        doctors: {
          select: {
            id: true,
            specialtyAr: true,
            user: { select: { profile: { select: { firstNameAr: true, lastNameAr: true } } } },
          },
          take: 20,
        },
        _count: { select: { doctors: true, employees: true, children: true, testCategories: true } },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async create(dto: CreateDepartmentDto, userId?: string) {
    const existingCode = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException(`A department with code '${dto.code}' already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.department.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent department not found');
      }
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!branch) {
        throw new NotFoundException('Branch not found');
      }
    }

    const department = await this.prisma.department.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId,
        branchId: dto.branchId,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        parent: { select: { id: true, nameAr: true, nameEn: true } },
        branch: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('departments:*');

    this.logger.log(`Department created: ${department.id} (${dto.code})`);
    return department;
  }

  async update(id: string, dto: Partial<CreateDepartmentDto>, userId?: string) {
    const existing = await this.findOne(id);

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.department.findUnique({
        where: { code: dto.code },
      });
      if (dup) {
        throw new ConflictException(`A department with code '${dto.code}' already exists`);
      }
    }

    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A department cannot be its own parent');
    }

    if (dto.parentId) {
      const parent = await this.prisma.department.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent department not found');
      }
    }

    const updateData: Prisma.DepartmentUpdateInput = {};
    if (dto.nameAr) updateData.nameAr = dto.nameAr;
    if (dto.nameEn) updateData.nameEn = dto.nameEn;
    if (dto.code) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.parentId !== undefined) {
      updateData.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }
    if (dto.branchId !== undefined) {
      updateData.branch = dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true };
    }
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    updateData.updatedBy = userId;

    const updated = await this.prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, nameAr: true, nameEn: true } },
        branch: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('departments:*');

    return updated;
  }

  async remove(id: string) {
    const department = await this.findOne(id);

    const hasChildren = await this.prisma.department.count({
      where: { parentId: id, deletedAt: null },
    });
    if (hasChildren > 0) {
      throw new BadRequestException('Cannot delete department with child departments');
    }

    const hasDoctors = await this.prisma.doctorProfile.count({
      where: { departmentId: id },
    });
    if (hasDoctors > 0) {
      throw new BadRequestException('Cannot delete department with assigned doctors');
    }

    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.cache.invalidatePattern('departments:*');

    this.logger.log(`Department soft-deleted: ${id}`);
    return { message: 'Department deleted successfully' };
  }

  async getStats() {
    const [totalDepartments, activeDepartments, totalDoctors, totalEmployees] = await Promise.all([
      this.prisma.department.count({ where: { deletedAt: null } }),
      this.prisma.department.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.doctorProfile.count(),
      this.prisma.employeeProfile.count({ where: { isActive: true } }),
    ]);

    const departmentStats = await this.prisma.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        code: true,
        _count: { select: { doctors: true, employees: true } },
      },
      orderBy: { nameAr: 'asc' },
    });

    return {
      totalDepartments,
      activeDepartments,
      totalDoctors,
      totalEmployees,
      departmentStats,
    };
  }
}
