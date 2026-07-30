import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';

const CACHE_TTL = 60;

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getExecutiveSummary(branchId?: string) {
    const cacheKey = `dashboard:executive:${branchId ?? 'all'}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const orderWhere: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    };

    const patientWhere: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(branchId
        ? { orders: { some: { branchId, deletedAt: null } } }
        : {}),
    };

    const appointmentWhere: Prisma.AppointmentWhereInput = {
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
    };

    const [
      todayOrders,
      todayPatients,
      todayRevenue,
      todayAppointments,
      monthOrders,
      monthRevenue,
      pendingOrders,
      pendingReports,
      pendingAppointments,
      yesterdayOrders,
      yesterdayPatients,
      yesterdayRevenue,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { ...orderWhere, createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.patient.count({
        where: {
          ...patientWhere,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhere,
          paymentStatus: 'PAID',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { total: true },
      }),
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.order.count({
        where: { ...orderWhere, createdAt: { gte: monthStart, lte: todayEnd } },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhere,
          paymentStatus: 'PAID',
          createdAt: { gte: monthStart, lte: todayEnd },
        },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { ...orderWhere, status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      this.prisma.report.count({
        where: {
          deletedAt: null,
          status: { in: ['DRAFT', 'UNDER_REVIEW'] },
          ...(branchId
            ? { order: { branchId, deletedAt: null } }
            : {}),
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledAt: { gte: todayStart },
        },
      }),
      this.prisma.order.count({
        where: {
          ...orderWhere,
          createdAt: { gte: yesterdayStart, lte: todayStart },
        },
      }),
      this.prisma.patient.count({
        where: {
          ...patientWhere,
          createdAt: { gte: yesterdayStart, lte: todayStart },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhere,
          paymentStatus: 'PAID',
          createdAt: { gte: yesterdayStart, lte: todayStart },
        },
        _sum: { total: true },
      }),
    ]);

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100;
    };

    const result = {
      today: {
        orders: todayOrders,
        patients: todayPatients,
        revenue: todayRevenue._sum.total ?? 0,
        appointments: todayAppointments,
      },
      monthly: {
        orders: monthOrders,
        revenue: monthRevenue._sum.total ?? 0,
      },
      pending: {
        orders: pendingOrders,
        reports: pendingReports,
        appointments: pendingAppointments,
      },
      trends: {
        ordersChange: calcChange(todayOrders, yesterdayOrders),
        patientsChange: calcChange(todayPatients, yesterdayPatients),
        revenueChange: calcChange(
          todayRevenue._sum.total ?? 0,
          yesterdayRevenue._sum.total ?? 0,
        ),
      },
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getRevenueChart(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month' = 'day',
  ) {
    const cacheKey = `dashboard:revenue:${dateFrom}:${dateTo}:${granularity}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const orders = await this.prisma.order.findMany({
      where: {
        deletedAt: null,
        paymentStatus: 'PAID',
        createdAt: { gte: from, lte: to },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { revenue: number; count: number }> = {};

    for (const order of orders) {
      let key: string;
      const date = new Date(order.createdAt);

      if (granularity === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0 };
      }
      grouped[key].revenue += order.total;
      grouped[key].count += 1;
    }

    const labels = Object.keys(grouped).sort();
    const result = {
      labels,
      revenue: labels.map((l) => Math.round(grouped[l].revenue * 100) / 100),
      orders: labels.map((l) => grouped[l].count),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getOrderStats(dateFrom: string, dateTo: string, branchId?: string) {
    const cacheKey = `dashboard:order-stats:${dateFrom}:${dateTo}:${branchId ?? 'all'}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      ...(branchId ? { branchId } : {}),
    };

    const statusGroups = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const allStatuses = [
      'PENDING',
      'CONFIRMED',
      'SAMPLE_COLLECTED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ] as const;

    const counts: Record<string, number> = {};
    for (const s of allStatuses) {
      counts[s] = 0;
    }
    for (const group of statusGroups) {
      counts[group.status] = group._count.id;
    }

    const result = {
      statuses: counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getTopTests(limit = 10, dateFrom?: string, dateTo?: string) {
    const cacheKey = `dashboard:top-tests:${limit}:${dateFrom ?? ''}:${dateTo ?? ''}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const topTests = await this.prisma.orderItem.groupBy({
      by: ['labTestId'],
      where: {
        labTestId: { not: null },
        order: {
          deletedAt: null,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        },
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const testIds = topTests.map((t) => t.labTestId!).filter(Boolean);
    const tests = await this.prisma.labTest.findMany({
      where: { id: { in: testIds } },
      select: { id: true, nameAr: true, nameEn: true, code: true, price: true },
    });

    const testMap = new Map(tests.map((t) => [t.id, t]));

    const result = topTests.map((t) => ({
      test: testMap.get(t.labTestId!) ?? null,
      orderCount: t._count.id,
      totalRevenue: Math.round((t._sum.total ?? 0) * 100) / 100,
    }));

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getTopDoctors(limit = 10, dateFrom?: string, dateTo?: string) {
    const cacheKey = `dashboard:top-doctors:${limit}:${dateFrom ?? ''}:${dateTo ?? ''}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const topDoctors = await this.prisma.order.groupBy({
      by: ['doctorId'],
      where: {
        doctorId: { not: null },
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const doctorIds = topDoctors.map((d) => d.doctorId!).filter(Boolean);
    const doctors = await this.prisma.doctorProfile.findMany({
      where: { userId: { in: doctorIds } },
      select: {
        userId: true,
        licenseNumber: true,
        specialtyAr: true,
        specialtyEn: true,
        rating: true,
        totalRatings: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true } },
          },
        },
      },
    });

    const doctorMap = new Map(doctors.map((d) => [d.userId, d]));

    const result = topDoctors.map((d) => ({
      doctor: doctorMap.get(d.doctorId!) ?? null,
      orderCount: d._count.id,
      totalRevenue: Math.round((d._sum.total ?? 0) * 100) / 100,
    }));

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getBranchPerformance(dateFrom: string, dateTo: string) {
    const cacheKey = `dashboard:branch-perf:${dateFrom}:${dateTo}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const branches = await this.prisma.branch.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        code: true,
        city: true,
      },
    });

    const branchPerf = await Promise.all(
      branches.map(async (branch) => {
        const [orderCount, revenue, patientCount, queueStats] = await Promise.all([
          this.prisma.order.count({
            where: { branchId: branch.id, deletedAt: null, createdAt: { gte: from, lte: to } },
          }),
          this.prisma.order.aggregate({
            where: {
              branchId: branch.id,
              deletedAt: null,
              paymentStatus: 'PAID',
              createdAt: { gte: from, lte: to },
            },
            _sum: { total: true },
          }),
          this.prisma.patient.count({
            where: {
              deletedAt: null,
              orders: { some: { branchId: branch.id, deletedAt: null, createdAt: { gte: from, lte: to } } },
            },
          }),
          this.prisma.queueEntry.aggregate({
            where: {
              branchId: branch.id,
              createdAt: { gte: from, lte: to },
              actualWaitMinutes: { not: null },
            },
            _avg: { actualWaitMinutes: true },
          }),
        ]);

        return {
          branch,
          orders: orderCount,
          revenue: Math.round((revenue._sum.total ?? 0) * 100) / 100,
          patients: patientCount,
          avgWaitTime: Math.round(queueStats._avg.actualWaitMinutes ?? 0),
        };
      }),
    );

    const result = branchPerf.sort((a, b) => b.revenue - a.revenue);

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getDepartmentPerformance(dateFrom: string, dateTo: string) {
    const cacheKey = `dashboard:dept-perf:${dateFrom}:${dateTo}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const departments = await this.prisma.department.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, nameAr: true, nameEn: true, code: true },
    });

    const deptPerf = await Promise.all(
      departments.map(async (dept) => {
        const [testCount, revenue, reportStats] = await Promise.all([
          this.prisma.orderItem.count({
            where: {
              labTest: { categoryId: { in: [] } },
              order: {
                deletedAt: null,
                createdAt: { gte: from, lte: to },
              },
            },
          }),
          this.prisma.orderItem.aggregate({
            where: {
              labTest: { category: { departmentId: dept.id } },
              order: {
                deletedAt: null,
                createdAt: { gte: from, lte: to },
              },
            },
            _sum: { total: true },
            _count: { id: true },
          }),
          this.prisma.report.aggregate({
            where: {
              deletedAt: null,
              status: 'RELEASED',
              createdAt: { gte: from, lte: to },
              items: {
                some: {
                  labTest: { category: { departmentId: dept.id } },
                },
              },
            },
            _count: { id: true },
          }),
        ]);

        return {
          department: dept,
          testsRun: revenue._count.id,
          revenue: Math.round((revenue._sum.total ?? 0) * 100) / 100,
          reportsReleased: reportStats._count.id,
        };
      }),
    );

    const result = deptPerf.sort((a, b) => b.revenue - a.revenue);

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getAppointmentStats(dateFrom: string, dateTo: string, branchId?: string) {
    const cacheKey = `dashboard:appt-stats:${dateFrom}:${dateTo}:${branchId ?? 'all'}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const where: Prisma.AppointmentWhereInput = {
      deletedAt: null,
      scheduledAt: { gte: from, lte: to },
      ...(branchId ? { branchId } : {}),
    };

    const [statusGroups, totalCount, hourlyDistribution] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        select: { scheduledAt: true, status: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const group of statusGroups) {
      statusCounts[group.status] = group._count.id;
    }

    const hourMap: Record<number, { total: number; completed: number; cancelled: number; noShow: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    }

    for (const appt of hourlyDistribution) {
      const hour = new Date(appt.scheduledAt).getHours();
      hourMap[hour].total += 1;
      if (appt.status === 'COMPLETED') hourMap[hour].completed += 1;
      if (appt.status === 'CANCELLED') hourMap[hour].cancelled += 1;
      if (appt.status === 'NO_SHOW') hourMap[hour].noShow += 1;
    }

    const result = {
      total: totalCount,
      completed: statusCounts['COMPLETED'] ?? 0,
      cancelled: statusCounts['CANCELLED'] ?? 0,
      noShow: statusCounts['NO_SHOW'] ?? 0,
      scheduled: statusCounts['SCHEDULED'] ?? 0,
      confirmed: statusCounts['CONFIRMED'] ?? 0,
      checkedIn: statusCounts['CHECKED_IN'] ?? 0,
      inProgress: statusCounts['IN_PROGRESS'] ?? 0,
      byHour: Object.entries(hourMap).map(([hour, data]) => ({
        hour: Number(hour),
        ...data,
      })),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getPatientStats(dateFrom: string, dateTo: string) {
    const cacheKey = `dashboard:patient-stats:${dateFrom}:${dateTo}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const [
      totalPatients,
      newPatients,
      returningPatients,
      genderGroups,
      nationalityGroups,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.patient.count({
        where: { deletedAt: null, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.patient.count({
        where: {
          deletedAt: null,
          createdAt: { lt: from },
          orders: { some: { createdAt: { gte: from, lte: to }, deletedAt: null } },
        },
      }),
      this.prisma.patient.groupBy({
        by: ['gender'],
        where: { deletedAt: null, createdAt: { gte: from, lte: to } },
        _count: { id: true },
      }),
      this.prisma.patient.groupBy({
        by: ['nationality'],
        where: {
          deletedAt: null,
          createdAt: { gte: from, lte: to },
          nationality: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const ageGroups = await this.prisma.$queryRaw<{ age_group: string; count: bigint }[]>`
      SELECT
        CASE
          WHEN date_part('year', age(date_of_birth)) < 18 THEN 'Under 18'
          WHEN date_part('year', age(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN date_part('year', age(date_of_birth)) BETWEEN 31 AND 45 THEN '31-45'
          WHEN date_part('year', age(date_of_birth)) BETWEEN 46 AND 60 THEN '46-60'
          ELSE '60+'
        END AS age_group,
        COUNT(*) AS count
      FROM patients
      WHERE deleted_at IS NULL
        AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY age_group
      ORDER BY
        CASE age_group
          WHEN 'Under 18' THEN 1
          WHEN '18-30' THEN 2
          WHEN '31-45' THEN 3
          WHEN '46-60' THEN 4
          ELSE 5
        END
    `;

    const result = {
      total: totalPatients,
      newPatients,
      returningPatients,
      byGender: genderGroups.map((g) => ({
        gender: g.gender,
        count: g._count.id,
      })),
      byAgeGroup: ageGroups.map((a) => ({
        ageGroup: a.age_group,
        count: Number(a.count),
      })),
      byNationality: nationalityGroups.map((n) => ({
        nationality: n.nationality,
        count: n._count.id,
      })),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }

  async getInventoryAlerts() {
    const cacheKey = 'dashboard:inventory-alerts';
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const now = new Date();

    const [lowStock, expired, belowReorder] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          quantity: { lte: this.prisma.inventoryItem.fields.minQuantity as never },
        },
        select: {
          id: true,
          sku: true,
          nameAr: true,
          nameEn: true,
          category: true,
          quantity: true,
          minQuantity: true,
          reorderPoint: true,
          unit: true,
          location: true,
        },
        orderBy: { quantity: 'asc' },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          expiryDate: { lt: now },
        },
        select: {
          id: true,
          sku: true,
          nameAr: true,
          nameEn: true,
          category: true,
          quantity: true,
          expiryDate: true,
          batchNumber: true,
          location: true,
        },
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          quantity: { lte: this.prisma.inventoryItem.fields.reorderPoint as never },
        },
        select: {
          id: true,
          sku: true,
          nameAr: true,
          nameEn: true,
          category: true,
          quantity: true,
          reorderPoint: true,
          maxQuantity: true,
          unit: true,
          supplier: { select: { id: true, nameAr: true, nameEn: true, phone: true } },
        },
        orderBy: { quantity: 'asc' },
      }),
    ]);

    const result = {
      lowStock,
      expired,
      belowReorderPoint: belowReorder,
      totalAlerts: lowStock.length + expired.length + belowReorder.length,
    };

    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  async getRecentActivity(limit = 20) {
    const cacheKey = `dashboard:recent-activity:${limit}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const [orders, reports, payments, appointments] = await Promise.all([
      this.prisma.order.findMany({
        where: { deletedAt: null },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstNameAr: true,
              lastNameAr: true,
              firstNameEn: true,
              lastNameEn: true,
            },
          },
          branch: { select: { id: true, nameAr: true, nameEn: true } },
        },
      }),
      this.prisma.report.findMany({
        where: { deletedAt: null },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reportNumber: true,
          status: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstNameAr: true,
              lastNameAr: true,
              firstNameEn: true,
              lastNameEn: true,
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: {},
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          invoice: {
            select: {
              id: true,
              patient: {
                select: {
                  id: true,
                  firstNameAr: true,
                  lastNameAr: true,
                  firstNameEn: true,
                  lastNameEn: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.appointment.findMany({
        where: { deletedAt: null },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          type: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstNameAr: true,
              lastNameAr: true,
              firstNameEn: true,
              lastNameEn: true,
            },
          },
          branch: { select: { id: true, nameAr: true, nameEn: true } },
        },
      }),
    ]);

    const activity = [
      ...orders.map((o) => ({ type: 'order' as const, data: o, timestamp: o.createdAt })),
      ...reports.map((r) => ({ type: 'report' as const, data: r, timestamp: r.createdAt })),
      ...payments.map((p) => ({ type: 'payment' as const, data: p, timestamp: p.createdAt })),
      ...appointments.map((a) => ({ type: 'appointment' as const, data: a, timestamp: a.createdAt })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const result = { activities: activity };

    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  async getSystemHealth() {
    const cacheKey = 'dashboard:system-health';
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const now = Date.now();

    const [
      activeUsers,
      todayErrors,
      totalOrders,
      completedToday,
      dbCheck,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { isActive: true, status: 'ACTIVE' },
      }),
      this.prisma.systemLog.count({
        where: {
          level: 'error',
          createdAt: {
            gte: new Date(now - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.order.count({
        where: { deletedAt: null },
      }),
      this.prisma.order.count({
        where: {
          deletedAt: null,
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.$queryRaw`SELECT 1 AS ok`.then(() => true).catch(() => false),
    ]);

    const result = {
      status: dbCheck ? 'healthy' : 'degraded',
      database: dbCheck ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeUsers,
      errorsLast24h: todayErrors,
      totalOrders,
      completedToday,
      checkedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, 15);
    return result;
  }
}
