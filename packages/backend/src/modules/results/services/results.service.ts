import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReportFiltersDto, ReportStatus } from '../dto/report-filters.dto';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportItemDto } from '../dto/update-report-item.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(filters: ReportFiltersDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      branchId,
      doctorId,
      patientId,
      dateFrom,
      dateTo,
      isCritical,
      search,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};

    if (status) where.status = status;
    if (doctorId) where.approvedById = doctorId;
    if (patientId) where.patientId = patientId;

    if (isCritical) {
      where.items = { some: { isAbnormal: true } };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstNameAr: { contains: search, mode: 'insensitive' } } },
        { patient: { lastNameAr: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === 'patientName') {
      orderBy.patient = { firstNameAr: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          patient: {
            select: { id: true, firstNameAr: true, lastNameAr: true, phone: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true, status: true },
          },
          items: {
            select: { id: true, value: true, isAbnormal: true, flags: true },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        patient: true,
        order: {
          include: {
            items: true,
            branch: { select: { id: true, nameAr: true } },
          },
        },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            labTest: {
              select: { id: true, nameAr: true, category: true, units: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async findByOrder(orderId: string) {
    const reports = await this.prisma.report.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true },
        },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            labTest: { select: { id: true, nameAr: true } },
          },
        },
      },
    });

    if (!reports.length) {
      throw new NotFoundException(`No reports found for order ${orderId}`);
    }

    return reports;
  }

  async findByPatient(patientId: string, filters: ReportFiltersDto) {
    const { page = 1, limit = 20, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = { patientId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true } },
          items: {
            select: { id: true, value: true, isAbnormal: true, flags: true },
            orderBy: { displayOrder: 'asc' },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateReportDto, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { patient: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    const reportNumber = await this.generateReportNumber();

    const report = await this.prisma.report.create({
      data: {
        reportNumber,
        orderId: dto.orderId,
        patientId: dto.patientId,
        status: ReportStatus.DRAFT,
        summary: dto.summary,
        conclusions: dto.conclusions,
        recommendations: dto.recommendations,
        createdBy: userId,
        version: 1,
        items: {
          create: dto.items.map((item, index) => ({
            labTestId: item.labTestId,
            value: item.value,
            unit: item.unit,
            referenceRangeLow: item.referenceRangeLow,
            referenceRangeHigh: item.referenceRangeHigh,
            isAbnormal: item.isAbnormal ?? false,
            flags: Array.isArray(item.flags) ? item.flags.join(', ') : (item.flags ?? null),
            notes: item.notes,
            displayOrder: item.displayOrder ?? index,
          })),
        },
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        order: { select: { id: true, orderNumber: true } },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            labTest: { select: { id: true, nameAr: true } },
          },
        },
      },
    });

    await this.cache.invalidatePattern('results:*');

    this.logger.log(`Report created: ${reportNumber} for order ${dto.orderId}`);
    return report;
  }

  async updateItem(reportItemId: string, dto: UpdateReportItemDto) {
    const item = await this.prisma.reportItem.findUnique({
      where: { id: reportItemId },
      include: { report: true },
    });

    if (!item) {
      throw new NotFoundException(`Report item with ID ${reportItemId} not found`);
    }

    if (item.report.status === ReportStatus.APPROVED) {
      throw new BadRequestException('Cannot edit items on an approved report');
    }

    if (item.report.status === ReportStatus.RELEASED) {
      throw new BadRequestException('Cannot edit items on a released report');
    }

    const updateData: Prisma.ReportItemUpdateInput = {};
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.referenceRangeLow !== undefined) updateData.referenceRangeLow = dto.referenceRangeLow;
    if (dto.referenceRangeHigh !== undefined) updateData.referenceRangeHigh = dto.referenceRangeHigh;
    if (dto.isAbnormal !== undefined) updateData.isAbnormal = dto.isAbnormal;
    if (dto.abnormalityType !== undefined) updateData.abnormalityType = dto.abnormalityType;
    if (dto.flags !== undefined) updateData.flags = Array.isArray(dto.flags) ? dto.flags.join(', ') : dto.flags;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.reportItem.update({
      where: { id: reportItemId },
      data: updateData,
      include: {
        labTest: { select: { id: true, nameAr: true } },
        report: true,
      },
    });

    this.logger.log(`Report item updated: ${reportItemId}`);
    return updated;
  }

  async approve(id: string, doctorId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.AMENDED) {
      throw new BadRequestException(
        `Cannot approve report with status: ${report.status}. Must be DRAFT or AMENDED.`,
      );
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.APPROVED,
        approvedById: doctorId,
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        items: { orderBy: { displayOrder: 'asc' } },
      },
    });

    await this.cache.invalidatePattern('results:*');

    this.logger.log(`Report approved: ${id} by doctor ${doctorId}`);
    return updated;
  }

  async release(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.status !== ReportStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot release report with status: ${report.status}. Must be APPROVED.`,
      );
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.RELEASED,
        releasedAt: new Date(),
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        items: { orderBy: { displayOrder: 'asc' } },
      },
    });

    try {
      const { NotificationsService } = await import(
        '../../notifications/notifications.service'
      );
    } catch {}

    await this.cache.invalidatePattern('results:*');

    this.logger.log(`Report released: ${id}`);
    return updated;
  }

  async reject(id: string, reason: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.status === ReportStatus.RELEASED) {
      throw new BadRequestException('Cannot reject a released report');
    }

    if (report.status === ReportStatus.CANCELLED) {
      throw new BadRequestException('Report is already cancelled');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.CANCELLED,
        amendReason: reason,
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true },
        },
        items: { orderBy: { displayOrder: 'asc' } },
      },
    });

    await this.cache.invalidatePattern('results:*');

    this.logger.log(`Report rejected: ${id} - ${reason}`);
    return updated;
  }

  async amend(id: string, dto: Partial<CreateReportDto>, doctorId: string) {
    const originalReport = await this.prisma.report.findUnique({
      where: { id },
      include: {
        items: { orderBy: { displayOrder: 'asc' } },
        patient: true,
      },
    });

    if (!originalReport) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (originalReport.status !== ReportStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot amend report with status: ${originalReport.status}. Must be APPROVED.`,
      );
    }

    const amendedReport = await this.prisma.report.create({
      data: {
        reportNumber: await this.generateReportNumber(),
        orderId: originalReport.orderId,
        patientId: originalReport.patientId,
        status: ReportStatus.DRAFT,
        version: originalReport.version + 1,
        amendReason: dto.summary ?? 'Amendment',
        summary: dto.summary ?? originalReport.summary,
        conclusions: dto.conclusions ?? originalReport.conclusions,
        recommendations: dto.recommendations ?? originalReport.recommendations,
        createdBy: doctorId,
        items: {
          create: dto.items
            ? dto.items.map((item, index) => ({
                labTestId: item.labTestId,
                value: item.value,
                unit: item.unit,
                referenceRangeLow: item.referenceRangeLow,
                referenceRangeHigh: item.referenceRangeHigh,
                isAbnormal: item.isAbnormal ?? false,
                flags: Array.isArray(item.flags) ? item.flags.join(', ') : (item.flags ?? null),
                notes: item.notes,
                displayOrder: item.displayOrder ?? index,
              }))
            : originalReport.items.map((item, index) => ({
                labTestId: item.labTestId,
                value: item.value,
                unit: item.unit,
                referenceRangeLow: item.referenceRangeLow,
                referenceRangeHigh: item.referenceRangeHigh,
                isAbnormal: item.isAbnormal,
                flags: item.flags as string | null,
                notes: item.notes,
                displayOrder: item.displayOrder ?? index,
              })),
        },
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        order: { select: { id: true, orderNumber: true } },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            labTest: { select: { id: true, nameAr: true } },
          },
        },
      },
    });

    await this.cache.invalidatePattern('results:*');

    this.logger.log(`Report amended: ${id} -> ${amendedReport.reportNumber} (v${amendedReport.version})`);
    return amendedReport;
  }

  async generatePdf(id: string) {
    const report = await this.findOne(id);

    const pdfBuffer = await this.buildPdf(report);

    const filename = `${report.reportNumber}.pdf`;
    const filePath = `reports/${filename}`;

    await this.cache.set(`report:pdf:${id}`, filePath, 3600);

    this.logger.log(`PDF generated for report: ${id}`);
    return {
      reportNumber: report.reportNumber,
      filename,
      downloadUrl: `/uploads/${filePath}`,
      generatedAt: new Date().toISOString(),
    };
  }

  async downloadPdf(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (report.status !== ReportStatus.RELEASED && report.status !== ReportStatus.APPROVED) {
      throw new BadRequestException('Report must be approved or released to download');
    }

    await this.prisma.report.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    const reportData = await this.findOne(id);
    const pdfBuffer = await this.buildPdf(reportData);

    return {
      buffer: pdfBuffer,
      filename: `${report.reportNumber}.pdf`,
      contentType: 'application/pdf',
    };
  }

  async compareResults(
    patientId: string,
    testIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: Prisma.ReportItemWhereInput = {
      labTestId: { in: testIds },
      report: {
        patientId,
        status: { in: [ReportStatus.APPROVED, ReportStatus.RELEASED] },
      },
    };

    if (dateFrom || dateTo) {
      (where.report as any).createdAt = {};
      if (dateFrom) (where.report as any).createdAt.gte = new Date(dateFrom);
      if (dateTo) (where.report as any).createdAt.lte = new Date(dateTo);
    }

    const items = await this.prisma.reportItem.findMany({
      where,
      orderBy: { report: { createdAt: 'asc' } },
      include: {
        report: {
          select: { id: true, reportNumber: true, createdAt: true },
        },
        labTest: {
          select: { id: true, nameAr: true, units: true },
        },
      },
    });

    const groupedByTest: Record<string, typeof items> = {};
    items.forEach((item) => {
      if (!groupedByTest[item.labTestId]) {
        groupedByTest[item.labTestId] = [];
      }
      groupedByTest[item.labTestId].push(item);
    });

    return {
      patientId,
      testIds,
      dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
      results: groupedByTest,
      totalDataPoints: items.length,
    };
  }

  async getReportStats(dateFrom?: string, dateTo?: string) {
    const where: Prisma.ReportWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, draft, approved, released, cancelled, amended] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.count({ where: { ...where, status: ReportStatus.DRAFT } }),
      this.prisma.report.count({ where: { ...where, status: ReportStatus.APPROVED } }),
      this.prisma.report.count({ where: { ...where, status: ReportStatus.RELEASED } }),
      this.prisma.report.count({ where: { ...where, status: ReportStatus.CANCELLED } }),
      this.prisma.report.count({ where: { ...where, status: ReportStatus.AMENDED } }),
    ]);

    const criticalCount = await this.prisma.report.count({
      where: {
        ...where,
        items: { some: { isAbnormal: true } },
        status: { not: ReportStatus.CANCELLED },
      },
    });

    const totalDownloads = await this.prisma.report.aggregate({
      where: { ...where, status: ReportStatus.RELEASED },
      _sum: { downloadCount: true },
    });

    return {
      total,
      draft,
      approved,
      released,
      cancelled,
      amended,
      criticalCount,
      totalDownloads: totalDownloads._sum.downloadCount ?? 0,
      approvalRate: total > 0 ? Math.round(((approved + released) / total) * 100 * 100) / 100 : 0,
      dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
    };
  }

  async searchReports(query: string, filters?: ReportFiltersDto) {
    const { page = 1, limit = 20, status } = filters ?? {};

    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {
      OR: [
        { reportNumber: { contains: query, mode: 'insensitive' } },
        { patient: { firstNameAr: { contains: query, mode: 'insensitive' } } },
        { patient: { lastNameAr: { contains: query, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: query, mode: 'insensitive' } } },
      ],
    };

    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
          },
          order: { select: { id: true, orderNumber: true } },
          items: {
            select: { id: true, value: true, isAbnormal: true },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async generateReportNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.report.count({
      where: { createdAt: { gte: todayStart } },
    });

    const sequence = (count + 1).toString().padStart(8, '0');
    return `RPT-${year}-${sequence}`;
  }

  private async buildPdf(report: any): Promise<Buffer> {
    const content = `
      Report Number: ${report.reportNumber}
      Patient: ${report.patient?.firstNameAr} ${report.patient?.lastNameAr}
      Order: ${report.order?.orderNumber}
      Date: ${report.createdAt}
      Status: ${report.status}
      Version: ${report.version}

      Summary: ${report.summary || 'N/A'}
      Conclusions: ${report.conclusions || 'N/A'}
      Recommendations: ${report.recommendations || 'N/A'}

      Results:
      ${(report.items || [])
        .map(
          (item: any, i: number) =>
            `${i + 1}. ${item.labTest?.nameAr ?? 'Test'}: ${item.value} ${item.unit || ''} ${item.isAbnormal ? '(ABNORMAL)' : ''}`,
        )
        .join('\n')}
    `;

    return Buffer.from(content, 'utf-8');
  }
}
