import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateLabTestDto, CreateCategoryDto, CreateTestBranchPricingDto } from '../dto/create-test.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(dto: PaginationDto & { categoryId?: string; sampleType?: string; minPrice?: number; maxPrice?: number }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', categoryId, sampleType, minPrice, maxPrice } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.LabTestWhereInput = { deletedAt: null };

    if (categoryId) where.categoryId = categoryId;
    if (sampleType) where.sampleType = { contains: sampleType, mode: 'insensitive' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tests, total] = await Promise.all([
      this.prisma.labTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          _count: { select: { orderItems: true, branchPricing: true, packageItems: true } },
        },
      }),
      this.prisma.labTest.count({ where }),
    ]);

    return {
      data: tests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const test = await this.prisma.labTest.findFirst({
      where: { OR: [{ id }, { code: id }], deletedAt: null },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        branchPricing: {
          include: { branch: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { orderItems: true, packageItems: true } },
      },
    });

    if (!test) {
      throw new NotFoundException(`Lab test with ID or code '${id}' not found`);
    }

    return test;
  }

  async create(dto: CreateLabTestDto, userId?: string) {
    const existingCode = await this.prisma.labTest.findUnique({ where: { code: dto.code } });
    if (existingCode) {
      throw new ConflictException(`A test with code '${dto.code}' already exists`);
    }

    const category = await this.prisma.testCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Test category not found');
    }

    const test = await this.prisma.labTest.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        code: dto.code,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        sampleType: dto.sampleType,
        tubeType: dto.tubeType,
        tubeColor: dto.tubeColor,
        fastingRequired: dto.fastingRequired ?? false,
        fastingHours: dto.fastingHours,
        turnaroundTimeHours: dto.turnaroundTimeHours ?? 24,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
        popular: dto.popular ?? false,
        featured: dto.featured ?? false,
        units: dto.units,
        methodology: dto.methodology,
        homeCollection: dto.homeCollection ?? true,
        preparationNotesAr: dto.preparationNotesAr,
        preparationNotesEn: dto.preparationNotesEn,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('tests:*');

    this.logger.log(`Lab test created: ${test.id} (${dto.code})`);
    return test;
  }

  async update(id: string, dto: Partial<CreateLabTestDto>, userId?: string) {
    const existing = await this.findOne(id);

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.labTest.findUnique({ where: { code: dto.code } });
      if (dup) {
        throw new ConflictException(`A test with code '${dto.code}' already exists`);
      }
    }

    const updateData: Prisma.LabTestUpdateInput = {};
    if (dto.nameAr) updateData.nameAr = dto.nameAr;
    if (dto.nameEn) updateData.nameEn = dto.nameEn;
    if (dto.code) updateData.code = dto.code;
    if (dto.categoryId) updateData.category = { connect: { id: dto.categoryId } };
    if (dto.subcategoryId !== undefined) {
      updateData.subcategory = dto.subcategoryId ? { connect: { id: dto.subcategoryId } } : { disconnect: true };
    }
    if (dto.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptionAr;
    if (dto.descriptionEn !== undefined) updateData.descriptionEn = dto.descriptionEn;
    if (dto.sampleType) updateData.sampleType = dto.sampleType;
    if (dto.tubeType !== undefined) updateData.tubeType = dto.tubeType;
    if (dto.tubeColor !== undefined) updateData.tubeColor = dto.tubeColor;
    if (dto.fastingRequired !== undefined) updateData.fastingRequired = dto.fastingRequired;
    if (dto.fastingHours !== undefined) updateData.fastingHours = dto.fastingHours;
    if (dto.turnaroundTimeHours !== undefined) updateData.turnaroundTimeHours = dto.turnaroundTimeHours;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.discountedPrice !== undefined) updateData.discountedPrice = dto.discountedPrice;
    if (dto.popular !== undefined) updateData.popular = dto.popular;
    if (dto.featured !== undefined) updateData.featured = dto.featured;
    if (dto.units !== undefined) updateData.units = dto.units;
    if (dto.methodology !== undefined) updateData.methodology = dto.methodology;
    if (dto.homeCollection !== undefined) updateData.homeCollection = dto.homeCollection;
    if (dto.preparationNotesAr !== undefined) updateData.preparationNotesAr = dto.preparationNotesAr;
    if (dto.preparationNotesEn !== undefined) updateData.preparationNotesEn = dto.preparationNotesEn;
    updateData.updatedBy = userId;

    const updated = await this.prisma.labTest.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('tests:*');

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.labTest.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.cache.invalidatePattern('tests:*');

    this.logger.log(`Lab test soft-deleted: ${id}`);
    return { message: 'Lab test deleted successfully' };
  }

  async getCategories() {
    return this.prisma.testCategory.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        _count: { select: { labTests: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }],
    });
  }

  async createCategory(dto: CreateCategoryDto, userId?: string) {
    const slug = dto.slug || dto.nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existingSlug = await this.prisma.testCategory.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(`A category with slug '${slug}' already exists`);
    }

    const category = await this.prisma.testCategory.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug,
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        icon: dto.icon,
        color: dto.color,
        departmentId: dto.departmentId,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.cache.invalidatePattern('tests:categories*');

    this.logger.log(`Test category created: ${category.id} (${slug})`);
    return category;
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>, userId?: string) {
    const existing = await this.prisma.testCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const updateData: Prisma.TestCategoryUpdateInput = {};
    if (dto.nameAr) updateData.nameAr = dto.nameAr;
    if (dto.nameEn) updateData.nameEn = dto.nameEn;
    if (dto.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptionAr;
    if (dto.descriptionEn !== undefined) updateData.descriptionEn = dto.descriptionEn;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    updateData.updatedBy = userId;

    return this.prisma.testCategory.update({ where: { id }, data: updateData });
  }

  async getPopular() {
    return this.prisma.labTest.findMany({
      where: { popular: true, isActive: true, deletedAt: null },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { sortOrder: 'asc' },
      take: 20,
    });
  }

  async getFeatured() {
    return this.prisma.labTest.findMany({
      where: { featured: true, isActive: true, deletedAt: null },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { sortOrder: 'asc' },
      take: 20,
    });
  }

  async getBranchPricing(testId: string) {
    await this.findOne(testId);

    return this.prisma.testBranchPricing.findMany({
      where: { labTestId: testId },
      include: { branch: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setBranchPricing(testId: string, branchId: string, dto: CreateTestBranchPricingDto) {
    await this.findOne(testId);

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const pricing = await this.prisma.testBranchPricing.upsert({
      where: { labTestId_branchId: { labTestId: testId, branchId: dto.branchId } },
      create: {
        labTestId: testId,
        branchId: dto.branchId,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
      },
      update: {
        price: dto.price,
        discountedPrice: dto.discountedPrice,
      },
      include: { branch: { select: { id: true, nameAr: true, nameEn: true } } },
    });

    await this.cache.invalidatePattern(`tests:${testId}:pricing`);

    return pricing;
  }

  async searchTests(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    return this.prisma.labTest.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
      },
      take: 20,
      orderBy: { popular: 'desc' },
    });
  }

  async getStats() {
    const [totalTests, activeTests, popularTests, featuredTests, totalCategories] = await Promise.all([
      this.prisma.labTest.count({ where: { deletedAt: null } }),
      this.prisma.labTest.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.labTest.count({ where: { popular: true, deletedAt: null } }),
      this.prisma.labTest.count({ where: { featured: true, deletedAt: null } }),
      this.prisma.testCategory.count({ where: { deletedAt: null } }),
    ]);

    const priceStats = await this.prisma.labTest.aggregate({
      where: { deletedAt: null },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    });

    const sampleTypeStats = await this.prisma.labTest.groupBy({
      by: ['sampleType'],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { sampleType: 'desc' } },
    });

    return {
      totalTests,
      activeTests,
      popularTests,
      featuredTests,
      totalCategories,
      averagePrice: Math.round((priceStats._avg.price ?? 0) * 100) / 100,
      minPrice: priceStats._min.price ?? 0,
      maxPrice: priceStats._max.price ?? 0,
      sampleTypeStats,
    };
  }
}
