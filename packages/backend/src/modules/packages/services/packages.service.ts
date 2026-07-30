import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CreatePackageDto } from '../dto/create-package.dto';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);
  private readonly CACHE_TTL = 120_000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(
    paginationDto: { page?: number; limit?: number; search?: string; category?: string; minPrice?: number; maxPrice?: number; isActive?: boolean },
  ) {
    const { page = 1, limit = 10, search, category, minPrice, maxPrice, isActive } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
      ];
    }
    if (category) {
      where.categoryId = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.discount = {};
      if (minPrice !== undefined) where.discount.gte = minPrice;
      if (maxPrice !== undefined) where.discount.lte = maxPrice;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.testPackage.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { items: true } },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.testPackage.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.testPackage.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            labTest: {
              include: {
                category: true,
              },
            },
          },
        },
        category: true,
      },
    });

    if (!pkg || pkg.deletedAt) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return pkg;
  }

  async create(dto: CreatePackageDto) {
    return this.prisma.$transaction(async (tx) => {
      const testIds = dto.items.map((i) => i.labTestId);

      const tests = await tx.labTest.findMany({
        where: { id: { in: testIds } },
      });

      if (tests.length !== testIds.length) {
        throw new NotFoundException('One or more lab tests not found');
      }

      const testPriceMap = new Map(tests.map((t) => [t.id, t.price]));
      const originalPrice = dto.items.reduce((sum, item) => {
        return sum + (testPriceMap.get(item.labTestId) || 0) * (item.quantity || 1);
      }, 0);

      const finalPrice = dto.discountType === 'fixed'
        ? originalPrice - dto.discount
        : originalPrice * (1 - dto.discount / 100);

      const pkg = await tx.testPackage.create({
        data: {
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          categoryId: dto.categoryId,
          discount: dto.discount,
          discountType: dto.discountType || 'percentage',
          isPopular: dto.isPopular ?? false,
          originalPrice,
          packagePrice: Math.max(finalPrice, 0),
          items: {
            create: dto.items.map((item) => ({
              labTestId: item.labTestId,
              quantity: item.quantity || 1,
            })),
          },
        },
        include: {
          items: { include: { labTest: true } },
        },
      });

      await this.invalidateCache();
      return pkg;
    });
  }

  async update(id: string, dto: Partial<CreatePackageDto>) {
    const existing = await this.prisma.testPackage.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items && dto.items.length > 0) {
        const testIds = dto.items.map((i) => i.labTestId);
        const tests = await tx.labTest.findMany({
          where: { id: { in: testIds } },
        });

        if (tests.length !== testIds.length) {
          throw new NotFoundException('One or more lab tests not found');
        }

        await tx.testPackageItem.deleteMany({ where: { packageId: id } });
        await tx.testPackageItem.createMany({
          data: dto.items.map((item) => ({
            packageId: id,
            labTestId: item.labTestId,
            quantity: item.quantity || 1,
          })),
        });
      }

      const currentItems = dto.items
        ? dto.items
        : existing.items.map((i) => ({ labTestId: i.labTestId, quantity: i.quantity }));

      const testIds = currentItems.map((i) => i.labTestId);
      const tests = await tx.labTest.findMany({ where: { id: { in: testIds } } });
      const testPriceMap = new Map(tests.map((t) => [t.id, t.price]));

      const originalPrice = currentItems.reduce((sum, item) => {
        return sum + (testPriceMap.get(item.labTestId) || 0) * (item.quantity || 1);
      }, 0);

      const discount = dto.discount ?? existing.discount;
      const discountType = dto.discountType ?? existing.discountType;
      const finalPrice = discountType === 'fixed'
        ? originalPrice - discount
        : originalPrice * (1 - discount / 100);

      const updated = await tx.testPackage.update({
        where: { id },
        data: {
          ...(dto.nameAr && { nameAr: dto.nameAr }),
          ...(dto.nameEn && { nameEn: dto.nameEn }),
          ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
          ...(dto.descriptionEn !== undefined && { descriptionEn: dto.descriptionEn }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.discount !== undefined && { discount: dto.discount }),
          ...(dto.discountType && { discountType: dto.discountType }),
          ...(dto.isPopular !== undefined && { isPopular: dto.isPopular }),
          originalPrice,
          packagePrice: Math.max(finalPrice, 0),
        },
        include: {
          items: { include: { labTest: true } },
        },
      });

      await this.invalidateCache();
      return updated;
    });
  }

  async remove(id: string) {
    const pkg = await this.prisma.testPackage.findUnique({ where: { id } });

    if (!pkg || pkg.deletedAt) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    await this.prisma.testPackage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.invalidateCache();
    return { message: 'Package deleted successfully' };
  }

  async getPopular(limit = 10) {
    const cacheKey = `packages_popular_${limit}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const packages = await this.prisma.testPackage.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { usageCount: 'desc' },
      take: limit,
      include: {
        items: { include: { labTest: true } },
        category: true,
      },
    });

    await this.cache.set(cacheKey, packages, this.CACHE_TTL);
    return packages;
  }

  async getStats() {
    const cacheKey = 'packages_stats';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [total, active, aggregation] = await this.prisma.$transaction([
      this.prisma.testPackage.count({ where: { deletedAt: null } }),
      this.prisma.testPackage.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.testPackage.aggregate({
        where: { deletedAt: null },
        _sum: { usageCount: true },
        _avg: { discount: true },
      }),
    ]);

    const stats = {
      totalPackages: total,
      activePackages: active,
      totalUsage: aggregation._sum.usageCount || 0,
      avgDiscountPercentage: aggregation._avg.discount || 0,
    };

    await this.cache.set(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  async calculatePrice(testIds: string[]) {
    if (!testIds.length) {
      return { tests: [], originalPrice: 0, bestPackage: null, savings: 0 };
    }

    const tests = await this.prisma.labTest.findMany({
      where: { id: { in: testIds } },
    });

    const originalPrice = tests.reduce((sum, t) => sum + t.price, 0);

    const matchingPackages = await this.prisma.testPackage.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        items: {
          every: { labTestId: { in: testIds } },
        },
      },
      include: {
        items: { include: { labTest: true } },
      },
    });

    let bestPackage = null;
    let bestSavings = 0;

    for (const pkg of matchingPackages) {
      const pkgTestIds = pkg.items.map((i) => i.labTestId);
      const coversAll = testIds.every((id) => pkgTestIds.includes(id));
      if (!coversAll) continue;

      const savings = originalPrice - pkg.packagePrice;
      if (savings > bestSavings) {
        bestSavings = savings;
        bestPackage = pkg;
      }
    }

    return {
      tests: tests.map((t) => ({ id: t.id, nameAr: t.nameAr, nameEn: t.nameEn, price: t.price })),
      originalPrice,
      bestPackage,
      savings: bestSavings,
    };
  }

  private async invalidateCache() {
    const keys = await this.cache.store.keys?.() ?? [];
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith('packages_')) {
        await this.cache.del(key);
      }
    }
  }
}
