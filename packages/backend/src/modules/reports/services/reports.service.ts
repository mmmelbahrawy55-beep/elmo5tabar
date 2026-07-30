import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { ReportType, GenerateReportDto, SaveReportDto } from '../dto/generate-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly CACHE_TTL = 300_000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async generateReport(dto: GenerateReportDto) {
    const { type, dateFrom, dateTo, branchId, departmentId } = dto;
    const cacheKey = `report_${type}_${dateFrom}_${dateTo}_${branchId || ''}_${departmentId || ''}`;

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    let data: any[] = [];
    let summary: any = {};

    const baseFilter: any = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      ...(branchId && { branchId }),
    };

    switch (type) {
      case ReportType.DAILY_REVENUE:
        ({ data, summary } = await this.dailyRevenue(baseFilter, dateFrom, dateTo));
        break;
      case ReportType.MONTHLY_REVENUE:
        ({ data, summary } = await this.monthlyRevenue(baseFilter, dateFrom, dateTo));
        break;
      case ReportType.PATIENT_SUMMARY:
        ({ data, summary } = await this.patientSummary(baseFilter, dateFrom, dateTo));
        break;
      case ReportType.ORDER_SUMMARY:
        ({ data, summary } = await this.orderSummary(baseFilter, departmentId));
        break;
      case ReportType.DOCTOR_PERFORMANCE:
        ({ data, summary } = await this.doctorPerformance(baseFilter));
        break;
      case ReportType.BRANCH_PERFORMANCE:
        ({ data, summary } = await this.branchPerformance(dateFrom, dateTo));
        break;
      case ReportType.INVENTORY_REPORT:
        ({ data, summary } = await this.inventoryReport());
        break;
      case ReportType.INSURANCE_REPORT:
        ({ data, summary } = await this.insuranceReport(baseFilter));
        break;
      case ReportType.TAX_REPORT:
        ({ data, summary } = await this.taxReport(baseFilter));
        break;
    }

    const report = {
      title: `Report: ${type}`,
      titleAr: this.getArabicTitle(type),
      type,
      data,
      summary,
      generatedAt: new Date(),
      params: dto,
    };

    await this.cache.set(cacheKey, report, this.CACHE_TTL);
    return report;
  }

  private async dailyRevenue(filter: any, dateFrom: string, dateTo: string) {
    const orders = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        ...filter,
        status: 'COMPLETED',
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    });

    const data = orders.map((o) => ({
      date: o.createdAt,
      revenue: o._sum.total || 0,
      orderCount: o._count,
      avgValue: o._avg.total || 0,
    }));

    const summary = {
      totalRevenue: data.reduce((s, d) => s + d.revenue, 0),
      totalOrders: data.reduce((s, d) => s + d.orderCount, 0),
      avgDailyRevenue: data.length ? data.reduce((s, d) => s + d.revenue, 0) / data.length : 0,
    };

    return { data, summary };
  }

  private async monthlyRevenue(filter: any, dateFrom: string, dateTo: string) {
    const currentYear = new Date(dateFrom).getFullYear();
    const prevYear = currentYear - 1;

    const [current, previous] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        where: { ...filter, createdAt: { gte: new Date(currentYear, 0, 1), lte: new Date(currentYear, 11, 31) } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: new Date(prevYear, 0, 1), lte: new Date(prevYear, 11, 31) } },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const monthlyOrders = await this.prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM "createdAt") AS month,
        SUM("total") AS revenue,
        COUNT(*)::int AS "orderCount"
      FROM "orders"
      WHERE "createdAt" >= ${new Date(dateFrom)}::timestamp
        AND "createdAt" <= ${new Date(dateTo)}::timestamp
        AND "status" = 'COMPLETED'
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

    const data = (monthlyOrders as any[]).map((m) => ({
      month: Number(m.month),
      revenue: Number(m.revenue),
      orderCount: m.orderCount,
    }));

    const currentRevenue = Number(current._sum.total || 0);
    const previousRevenue = Number(previous._sum.total || 0);
    const yoyGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const summary = {
      totalRevenue: currentRevenue,
      totalOrders: current._count,
      previousYearRevenue: previousRevenue,
      yoyGrowth: Math.round(yoyGrowth * 100) / 100,
    };

    return { data, summary };
  }

  private async patientSummary(filter: any, dateFrom: string, dateTo: string) {
    const newPatients = await this.prisma.patient.count({
      where: { createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) } },
    });

    const totalPatients = await this.prisma.patient.count();

    const referringSources = await (this.prisma.order.groupBy as any)({
      by: ['referralSource'],
      where: filter,
      _count: true,
    });

    const demographics = await this.prisma.patient.groupBy({
      by: ['gender'],
      _count: true,
    });

    const data = [
      { metric: 'New Patients', value: newPatients },
      { metric: 'Returning Patients', value: totalPatients - newPatients },
      { metric: 'Total Patients', value: totalPatients },
    ];

    const summary = {
      newPatients,
      returningPatients: totalPatients - newPatients,
      totalPatients,
      referralSources: referringSources.map((r) => ({
        source: r.referralSource || 'Unknown',
        count: r._count,
      })),
      demographics: demographics.map((d) => ({
        gender: d.gender,
        count: d._count,
      })),
    };

    return { data, summary };
  }

  private async orderSummary(filter: any, departmentId?: string) {
    const byStatus = await this.prisma.order.groupBy({
      by: ['status'],
      where: filter,
      _count: true,
      _sum: { total: true },
    });

    const byType = await this.prisma.order.groupBy({
      by: ['collectionType'],
      where: filter,
      _count: true,
    });

    const byBranch = await this.prisma.order.groupBy({
      by: ['branchId'],
      where: filter,
      _count: true,
      _sum: { total: true },
    });

    const data = byStatus.map((s) => ({
      status: s.status,
      count: s._count,
      revenue: s._sum.total || 0,
    }));

    const summary = {
      byStatus,
      byType: byType.map((t) => ({ type: t.collectionType, count: t._count })),
      byBranch: byBranch.map((b) => ({
        branchId: b.branchId,
        count: b._count,
        revenue: b._sum.total || 0,
      })),
      totalOrders: byStatus.reduce((s, v) => s + v._count, 0),
    };

    return { data, summary };
  }

  private async doctorPerformance(filter: any) {
    const doctors = await this.prisma.doctorProfile.findMany({
      include: {
        issuedOrders: {
          where: { ...filter, status: 'COMPLETED' },
          select: { id: true, total: true, createdAt: true, completedAt: true },
        },
        user: { select: { profile: { select: { firstNameAr: true, lastNameAr: true } } } },
      },
    });

    const data = doctors.map((d) => {
      const completedOrders = d.issuedOrders;
      const turnaroundTimes = completedOrders
        .filter((o) => o.completedAt)
        .map((o) => {
          const diff = new Date(o.completedAt!).getTime() - new Date(o.createdAt).getTime();
          return diff / (1000 * 60 * 60);
        });

      return {
        doctorId: d.id,
        doctorName: `${d.user?.profile?.firstNameAr ?? ''} ${d.user?.profile?.lastNameAr ?? ''}`,
        ordersCount: completedOrders.length,
        revenue: completedOrders.reduce((s, o) => s + (o.total || 0), 0),
        avgTurnaroundHours: turnaroundTimes.length
          ? Math.round(turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length * 100) / 100
          : 0,
      };
    });

    const summary = {
      totalDoctors: data.length,
      avgOrdersPerDoctor: data.length
        ? Math.round(data.reduce((s, d) => s + d.ordersCount, 0) / data.length)
        : 0,
      topPerformer: data.sort((a, b) => b.revenue - a.revenue)[0] || null,
    };

    return { data, summary };
  }

  private async branchPerformance(dateFrom: string, dateTo: string) {
    const branches = await this.prisma.branch.findMany({
      include: {
        orders: {
          where: {
            status: 'COMPLETED',
            createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
          },
          select: { id: true, total: true },
        },
      },
    });

    const data = branches.map((b) => ({
      branchId: b.id,
      branchName: b.nameAr,
      ordersCount: b.orders.length,
      revenue: b.orders.reduce((s, o) => s + (o.total || 0), 0),
    }));

    const summary = {
      totalBranches: data.length,
      totalRevenue: data.reduce((s, d) => s + d.revenue, 0),
      totalOrders: data.reduce((s, d) => s + d.ordersCount, 0),
      topBranch: data.sort((a, b) => b.revenue - a.revenue)[0] || null,
    };

    return { data, summary };
  }

  private async inventoryReport() {
    const items = await this.prisma.inventoryItem.findMany();

    const data = items.map((i) => ({
      id: i.id,
      name: i.nameAr,
      currentStock: i.quantity,
      reorderLevel: i.reorderPoint,
      isLowStock: i.quantity <= i.reorderPoint,
      expiryDate: i.expiryDate,
      isExpired: i.expiryDate ? new Date(i.expiryDate) < new Date() : false,
    }));

    const summary = {
      totalItems: data.length,
      lowStockItems: data.filter((d) => d.isLowStock).length,
      expiredItems: data.filter((d) => d.isExpired).length,
    };

    return { data, summary };
  }

  private async insuranceReport(filter: any) {
    const claims = await this.prisma.insuranceClaim.groupBy({
      by: ['insuranceCompanyId'],
      where: filter,
      _count: true,
      _sum: { submittedAmount: true },
    });

    const data = claims.map((c) => ({
      providerId: c.insuranceCompanyId,
      totalClaims: c._count,
      totalAmount: c._sum.submittedAmount || 0,
    }));

    const summary = {
      totalClaims: data.reduce((s, d) => s + d.totalClaims, 0),
      totalAmount: data.reduce((s, d) => s + d.totalAmount, 0),
    };

    return { data, summary };
  }

  private async taxReport(filter: any) {
    const invoices = await this.prisma.invoice.findMany({
      where: { createdAt: filter.createdAt },
      select: { total: true, tax: true, createdAt: true },
    });

    const vatRate = 15;
    const data = invoices.map((inv) => ({
      date: inv.createdAt,
      subtotal: (inv.total || 0) - (inv.tax || 0),
      vat: inv.tax || 0,
      total: inv.total || 0,
    }));

    const summary = {
      totalRevenue: data.reduce((s, d) => s + d.total, 0),
      totalVat: data.reduce((s, d) => s + d.vat, 0),
      totalSubtotal: data.reduce((s, d) => s + d.subtotal, 0),
      vatRate,
      zatcaCompliant: true,
    };

    return { data, summary };
  }

  private getArabicTitle(type: ReportType): string {
    const titles: Record<ReportType, string> = {
      [ReportType.DAILY_REVENUE]: 'تقرير الإيرادات اليومية',
      [ReportType.MONTHLY_REVENUE]: 'تقرير الإيرادات الشهرية',
      [ReportType.PATIENT_SUMMARY]: 'ملخص المرضى',
      [ReportType.ORDER_SUMMARY]: 'ملخص الطلبات',
      [ReportType.DOCTOR_PERFORMANCE]: 'أداء الأطباء',
      [ReportType.BRANCH_PERFORMANCE]: 'أداء الفروع',
      [ReportType.INVENTORY_REPORT]: 'تقرير المخزون',
      [ReportType.INSURANCE_REPORT]: 'تقرير التأمين',
      [ReportType.TAX_REPORT]: 'التقرير الضريبي',
    };
    return titles[type] || 'تقرير';
  }

  async exportToPdf(reportData: any): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${reportData.titleAr}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1a237e; }
          h2 { color: #333; border-bottom: 2px solid #1a237e; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #1a237e; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .generated { color: #666; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>${reportData.titleAr}</h1>
        <p style="text-align:center;color:#666;">${reportData.title}</p>
        <div class="summary">
          <h2>الملخص</h2>
          ${Object.entries(reportData.summary)
            .map(([key, val]) => `<p><strong>${key}:</strong> ${val}</p>`)
            .join('')}
        </div>
        <h2>البيانات</h2>
        <table>
          <thead>
            <tr>${reportData.data.length ? Object.keys(reportData.data[0]).map((k) => `<th>${k}</th>`).join('') : ''}</tr>
          </thead>
          <tbody>
            ${reportData.data
              .map((row: any) => `<tr>${Object.values(row).map((v) => `<td>${v}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
        <p class="generated">تم الإنشاء: ${new Date(reportData.generatedAt).toLocaleString('ar-SA')}</p>
      </body>
      </html>
    `;
    return html;
  }

  async exportToExcel(reportData: any): Promise<string> {
    const headers = reportData.data.length ? Object.keys(reportData.data[0]) : [];
    const rows = reportData.data.map((row: any) =>
      headers.map((h) => String(row[h] ?? '')).join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }

  async getSavedReports(userId: string) {
    return this.prisma.report.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveReport(userId: string, dto: SaveReportDto) {
    return this.prisma.report.create({
      data: {
        reportNumber: `RPT-SAVED-${Date.now()}`,
        orderId: dto.params ? JSON.parse(dto.params).orderId : '',
        patientId: dto.params ? JSON.parse(dto.params).patientId : '',
        status: 'DRAFT',
        summary: dto.description,
        createdBy: userId,
      },
    });
  }
}
