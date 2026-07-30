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
import { CreateBranchDto } from '../dto/create-branch.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(dto: PaginationDto & { city?: string; region?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'nameAr', sortOrder = 'asc', city, region } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.BranchWhereInput = { deletedAt: null };

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (region) where.region = { contains: region, mode: 'insensitive' };

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { orders: true, appointments: true, labTests: true, doctorSchedules: true } },
          manager: {
            select: { id: true, profile: { select: { firstNameAr: true, lastNameAr: true } } },
          },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { OR: [{ id }, { code: id }], deletedAt: null },
      include: {
        manager: {
          select: { id: true, email: true, profile: { select: { firstNameAr: true, lastNameAr: true } } },
        },
        _count: {
          select: {
            orders: true,
            appointments: true,
            labTests: true,
            doctorSchedules: true,
            employeeProfiles: true,
            queueEntries: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID or code '${id}' not found`);
    }

    return branch;
  }

  async create(dto: CreateBranchDto, userId?: string) {
    const existingCode = await this.prisma.branch.findUnique({ where: { code: dto.code } });
    if (existingCode) {
      throw new ConflictException(`A branch with code '${dto.code}' already exists`);
    }

    const branch = await this.prisma.branch.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        code: dto.code,
        phone: dto.phone,
        email: dto.email,
        addressAr: dto.addressAr,
        city: dto.city,
        region: dto.region,
        latitude: dto.latitude,
        longitude: dto.longitude,
        operatingHours: dto.operatingHours as any,
        maxCapacity: dto.maxCapacity,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.cache.invalidatePattern('branches:*');

    this.logger.log(`Branch created: ${branch.id} (${dto.code})`);
    return branch;
  }

  async update(id: string, dto: Partial<CreateBranchDto>, userId?: string) {
    const existing = await this.findOne(id);

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.branch.findUnique({ where: { code: dto.code } });
      if (dup) {
        throw new ConflictException(`A branch with code '${dto.code}' already exists`);
      }
    }

    const updateData: Prisma.BranchUpdateInput = {};
    if (dto.nameAr) updateData.nameAr = dto.nameAr;
    if (dto.nameEn) updateData.nameEn = dto.nameEn;
    if (dto.code) updateData.code = dto.code;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.addressAr) updateData.addressAr = dto.addressAr;
    if (dto.city) updateData.city = dto.city;
    if (dto.region) updateData.region = dto.region;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.operatingHours) updateData.operatingHours = dto.operatingHours as any;
    if (dto.maxCapacity !== undefined) updateData.maxCapacity = dto.maxCapacity;
    updateData.updatedBy = userId;

    const updated = await this.prisma.branch.update({
      where: { id },
      data: updateData,
    });

    await this.cache.invalidatePattern('branches:*');

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    const hasActiveOrders = await this.prisma.order.count({
      where: { branchId: id, status: { in: ['PENDING', 'CONFIRMED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] } },
    });
    if (hasActiveOrders > 0) {
      throw new BadRequestException('Cannot delete branch with active orders');
    }

    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.cache.invalidatePattern('branches:*');

    this.logger.log(`Branch soft-deleted: ${id}`);
    return { message: 'Branch deleted successfully' };
  }

  async getBranchStats(id: string) {
    await this.findOne(id);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      monthlyOrders,
      todayAppointments,
      totalDoctors,
      activeTests,
      monthlyRevenue,
      todayPatients,
    ] = await Promise.all([
      this.prisma.order.count({ where: { branchId: id, createdAt: { gte: startOfDay } } }),
      this.prisma.order.count({ where: { branchId: id, createdAt: { gte: startOfMonth } } }),
      this.prisma.appointment.count({ where: { branchId: id, scheduledAt: { gte: startOfDay } } }),
      this.prisma.doctorSchedule.findMany({
        where: { branchId: id, isAvailable: true },
        distinct: ['doctorId'],
        select: { doctorId: true },
      }),
      this.prisma.labTest.count({ where: { branchId: id, isActive: true } }),
      this.prisma.order.aggregate({
        where: { branchId: id, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { branchId: id, createdAt: { gte: startOfDay } },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    return {
      todayOrders,
      monthlyOrders,
      todayAppointments,
      totalDoctors: totalDoctors.length,
      activeTests,
      monthlyRevenue: monthlyRevenue._sum.total ?? 0,
      todayPatients: todayPatients.length,
    };
  }

  async getNearbyBranches(latitude: number, longitude: number, radiusKm: number = 50) {
    const branches = await this.prisma.branch.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        code: true,
        phone: true,
        addressAr: true,
        city: true,
        region: true,
        latitude: true,
        longitude: true,
      },
    });

    const branchesWithDistance = branches
      .map((branch) => {
        const distance = this.haversineDistance(
          latitude,
          longitude,
          branch.latitude!,
          branch.longitude!,
        );
        return { ...branch, distanceKm: Math.round(distance * 100) / 100 };
      })
      .filter((branch) => branch.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return branchesWithDistance;
  }

  async getBranchPerformance(id: string, dateFrom?: string, dateTo?: string) {
    await this.findOne(id);

    const where: Prisma.OrderWhereInput = { branchId: id };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [totalOrders, completedOrders, revenueResult] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.order.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _avg: { total: true },
      }),
    ]);

    const totalRevenue = revenueResult._sum.total || 0;
    const avgOrderValue = revenueResult._avg.total || 0;

    const monthlyOrders = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const topTests = await this.prisma.orderItem.groupBy({
      by: ['labTestId'],
      where: {
        order: { branchId: id },
        labTestId: { not: null },
      },
      _count: true,
      _sum: { total: true },
      orderBy: { _count: { labTestId: 'desc' } },
      take: 10,
    });

    return {
      totalOrders,
      completedOrders,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
      totalRevenue: totalRevenue,
      avgOrderValue: Math.round((avgOrderValue ?? 0) * 100) / 100,
      statusDistribution: monthlyOrders,
      topTests,
    };
  }

  async toggleActive(id: string) {
    const branch = await this.findOne(id);

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { isActive: !branch.isActive },
    });

    await this.cache.invalidatePattern('branches:*');

    return {
      branchId: updated.id,
      isActive: updated.isActive,
      message: `Branch is now ${updated.isActive ? 'active' : 'inactive'}`,
    };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
