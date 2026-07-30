import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

export interface TimelineEvent {
  id: string;
  type: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  descriptionAr: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export interface DailyEvent {
  hour: string;
  events: TimelineEvent[];
  count: number;
}

interface MonthlyActivity {
  date: string;
  count: number;
  type: string;
}

export interface TimelineStats {
  averageCollectionToRelease: number;
  averageReviewToApproval: number;
  averageDraftToReview: number;
  mostActiveDays: { date: string; count: number }[];
  busiestHour: number;
  totalEvents: number;
  eventsByType: Record<string, number>;
  monthlySummary: { month: string; count: number }[];
}

interface TimelineFilters {
  dateFrom?: string;
  dateTo?: string;
  types?: string[];
  status?: string;
}

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPatientTimeline(patientId: string, filters?: TimelineFilters) {
    try {
      const events: TimelineEvent[] = [];

      const reports = await (this.prisma as any).report.findMany({
        where: {
          patientId,
          ...(filters?.dateFrom || filters?.dateTo
            ? {
                createdAt: {
                  ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                  ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { select: { id: true } },
          approvedBy: { select: { id: true, firstNameAr: true, lastNameAr: true } },
          createdBy: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        },
      });

      for (const report of reports) {
        if (filters?.types && !filters.types.includes('order_placed')) {
          const order = await this.prisma.order.findUnique({
            where: { id: report.orderId },
            select: { createdAt: true },
          });
          if (order) {
            events.push({
              id: `order-${report.orderId}`,
              type: 'order',
              action: 'order_placed',
              entity: 'Order',
              entityId: report.orderId,
              description: `Order placed for patient`,
              descriptionAr: 'تم إنشاء الطلب للمريض',
              timestamp: order.createdAt.toISOString(),
            });
          }
        }

        events.push({
          id: `report-created-${report.id}`,
          type: 'report',
          action: 'report_created',
          entity: 'Report',
          entityId: report.id,
          description: `Report ${report.reportNumber} created as draft`,
          descriptionAr: `تم إنشاء التقرير ${report.reportNumber} كمسودة`,
          timestamp: report.createdAt.toISOString(),
          userId: report.createdBy ?? undefined,
          userName: report.createdBy
            ? `${report.createdBy.firstNameAr} ${report.createdBy.lastNameAr}`
            : undefined,
        });

        if (report.status === 'APPROVED' || report.status === 'RELEASED') {
          events.push({
            id: `report-approved-${report.id}`,
            type: 'report',
            action: 'report_approved',
            entity: 'Report',
            entityId: report.id,
            description: `Report ${report.reportNumber} approved`,
            descriptionAr: `تم اعتماد التقرير ${report.reportNumber}`,
            timestamp: (report.updatedAt || report.updatedAt).toISOString(),
            userId: report.approvedById ?? undefined,
            userName: report.approvedById
              ? `${report.approvedById.firstNameAr} ${report.approvedById.lastNameAr}`
              : undefined,
          });
        }

        if (report.status === 'RELEASED' && report.releasedAt) {
          events.push({
            id: `report-released-${report.id}`,
            type: 'report',
            action: 'report_released',
            entity: 'Report',
            entityId: report.id,
            description: `Report ${report.reportNumber} released to patient`,
            descriptionAr: `تم إصدار التقرير ${report.reportNumber} للمريض`,
            timestamp: report.releasedAt.toISOString(),
          });
        }

        const criticalItems = report['items'].filter((i: any) => i.isAbnormal);
        if (criticalItems.length > 0) {
          events.push({
            id: `critical-${report.id}`,
            type: 'alert',
            action: 'critical_alert',
            entity: 'Report',
            entityId: report.id,
            description: `${criticalItems.length} abnormal result(s) flagged in report ${report.reportNumber}`,
            descriptionAr: `تم رصد ${criticalItems.length} نتيجة غير طبيعية في التقرير ${report.reportNumber}`,
            timestamp: report.updatedAt.toISOString(),
            metadata: { abnormalCount: criticalItems.length },
          });
        }
      }

      const auditLogs = await (this.prisma as any).auditLog?.findMany({
        where: {
          entity: 'Report',
          entityId: { in: reports.map((r) => r.id) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (auditLogs) {
        for (const log of auditLogs) {
          events.push({
            id: `audit-${log.id}`,
            type: 'audit',
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            description: log.description || `${log.action} on ${log.entity}`,
            descriptionAr: log.descriptionAr || `${log.action} على ${log.entity}`,
            timestamp: log.createdAt.toISOString(),
            userId: log.userId ?? undefined,
            metadata: log.metadata as Record<string, unknown> | undefined,
          });
        }
      }

      const sorted = events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return {
        patientId,
        totalEvents: sorted.length,
        events: sorted,
      };
    } catch (error) {
      this.logger.error(`getPatientTimeline failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReportTimeline(reportId: string) {
    try {
      const report = await (this.prisma as any).report.findUnique({
        where: { id: reportId },
        include: {
          approvedBy: { select: { id: true, firstNameAr: true, lastNameAr: true } },
          createdBy: { select: { id: true, firstNameAr: true, lastNameAr: true } },
          items: { select: { id: true, createdAt: true } },
        },
      });

      if (!report) throw new Error(`Report ${reportId} not found`);

      const events: TimelineEvent[] = [
        {
          id: `created-${report.id}`,
          type: 'report',
          action: 'created',
          entity: 'Report',
          entityId: report.id,
          description: `Report ${report.reportNumber} created`,
          descriptionAr: `تم إنشاء التقرير ${report.reportNumber}`,
          timestamp: report.createdAt.toISOString(),
          userId: report.createdBy ?? undefined,
          userName: report.createdBy
            ? `${report.createdBy.firstNameAr} ${report.createdBy.lastNameAr}`
            : undefined,
        },
      ];

      for (const item of report['items']) {
        events.push({
          id: `item-added-${item.id}`,
          type: 'item',
          action: 'item_added',
          entity: 'ReportItem',
          entityId: item.id,
          description: `Test result item added`,
          descriptionAr: 'تم إضافة نتيجة اختبار',
          timestamp: item.createdAt.toISOString(),
        });
      }

      if (report.status === 'APPROVED' || report.updatedAt) {
        events.push({
          id: `reviewed-${report.id}`,
          type: 'review',
          action: 'reviewed',
          entity: 'Report',
          entityId: report.id,
          description: `Report ${report.reportNumber} reviewed`,
          descriptionAr: `تم مراجعة التقرير ${report.reportNumber}`,
          timestamp: (report.updatedAt || report.updatedAt).toISOString(),
        });
      }

      if (report.approvedById) {
        events.push({
          id: `approved-${report.id}`,
          type: 'approval',
          action: 'approved',
          entity: 'Report',
          entityId: report.id,
          description: `Report ${report.reportNumber} approved`,
          descriptionAr: `تم اعتماد التقرير ${report.reportNumber}`,
          timestamp: (report.updatedAt || report.updatedAt).toISOString(),
          userId: report.approvedById ?? undefined,
          userName: report.approvedById
            ? `${report.approvedById.firstNameAr} ${report.approvedById.lastNameAr}`
            : undefined,
        });
      }

      if (report.releasedAt) {
        events.push({
          id: `released-${report.id}`,
          type: 'release',
          action: 'released',
          entity: 'Report',
          entityId: report.id,
          description: `Report ${report.reportNumber} released`,
          descriptionAr: `تم إصدار التقرير ${report.reportNumber}`,
          timestamp: report.releasedAt.toISOString(),
        });
      }

      events.push({
        id: `status-${report.id}`,
        type: 'status',
        action: 'status_change',
        entity: 'Report',
        entityId: report.id,
        description: `Status changed to ${report.status}`,
        descriptionAr: `تم تغيير الحالة إلى ${report.status}`,
        timestamp: report.updatedAt.toISOString(),
        metadata: { status: report.status } as Record<string, unknown>,
      });

      const auditLogs = await (this.prisma as any).auditLog?.findMany({
        where: { entity: 'Report', entityId: reportId },
        orderBy: { createdAt: 'asc' },
      });

      if (auditLogs) {
        for (const log of auditLogs) {
          events.push({
            id: `audit-${log.id}`,
            type: 'audit',
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            description: log.description || `${log.action} on report`,
            descriptionAr: log.descriptionAr || `${log.action} على التقرير`,
            timestamp: log.createdAt.toISOString(),
            userId: log.userId ?? undefined,
            metadata: log.metadata as Record<string, unknown> | undefined,
          });
        }
      }

      const sorted = events.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      return {
        reportId,
        reportNumber: report.reportNumber,
        totalEvents: sorted.length,
        events: sorted,
      };
    } catch (error) {
      this.logger.error(`getReportTimeline failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDailyTimeline(patientId: string, date: string) {
    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const timeline = await this.getPatientTimeline(patientId, {
        dateFrom: dayStart.toISOString(),
        dateTo: dayEnd.toISOString(),
      });

      const groupedByHour: Record<string, TimelineEvent[]> = {};
      for (const event of timeline.events) {
        const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0');
        if (!groupedByHour[hour]) groupedByHour[hour] = [];
        groupedByHour[hour].push(event);
      }

      const hourly: DailyEvent[] = Object.entries(groupedByHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([hour, evts]) => ({
          hour: `${hour}:00`,
          events: evts,
          count: evts.length,
        }));

      return {
        date,
        patientId,
        totalEvents: timeline.totalEvents,
        hourly,
      };
    } catch (error) {
      this.logger.error(`getDailyTimeline failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMonthlyActivity(patientId: string, year: number, month: number) {
    try {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const timeline = await this.getPatientTimeline(patientId, {
        dateFrom: monthStart.toISOString(),
        dateTo: monthEnd.toISOString(),
      });

      const daily: Record<string, { created: number; approved: number; released: number; alerts: number }> = {};

      for (const event of timeline.events) {
        const dayKey = new Date(event.timestamp).toISOString().split('T')[0];
        if (!daily[dayKey]) {
          daily[dayKey] = { created: 0, approved: 0, released: 0, alerts: 0 };
        }
        if (event.action === 'report_created') daily[dayKey].created++;
        else if (event.action === 'report_approved') daily[dayKey].approved++;
        else if (event.action === 'report_released') daily[dayKey].released++;
        else if (event.action === 'critical_alert') daily[dayKey].alerts++;
      }

      const activityData: MonthlyActivity[] = [];
      for (const [date, counts] of Object.entries(daily)) {
        for (const [type, count] of Object.entries(counts)) {
          if (count > 0) {
            activityData.push({ date, count, type });
          }
        }
      }

      return {
        patientId,
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleString('en', { month: 'long' }),
        totalEvents: timeline.totalEvents,
        dailyBreakdown: daily,
        activity: activityData.sort((a, b) => a.date.localeCompare(b.date)),
        summary: {
          reportsCreated: activityData.filter((a) => a.type === 'created').reduce((s, a) => s + a.count, 0),
          reportsApproved: activityData.filter((a) => a.type === 'approved').reduce((s, a) => s + a.count, 0),
          reportsReleased: activityData.filter((a) => a.type === 'released').reduce((s, a) => s + a.count, 0),
          criticalAlerts: activityData.filter((a) => a.type === 'alerts').reduce((s, a) => s + a.count, 0),
        },
      };
    } catch (error) {
      this.logger.error(`getMonthlyActivity failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTimelineStats(patientId: string, dateFrom?: string, dateTo?: string) {
    try {
      const where: any = { patientId };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const reports = await (this.prisma as any).report.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          releasedAt: true,
          approvedAt: true,
          reviewedAt: true,
        },
      });

      const collectionToRelease: number[] = [];
      const reviewToApproval: number[] = [];
      const draftToReview: number[] = [];

      for (const report of reports) {
        if (report.createdAt && report.releasedAt) {
          collectionToRelease.push(
            (new Date(report.releasedAt).getTime() - new Date(report.createdAt).getTime()) / (1000 * 60),
          );
        }
        if (report.updatedAt && report.updatedAt) {
          reviewToApproval.push(
            (new Date(report.updatedAt).getTime() - new Date(report.updatedAt).getTime()) / (1000 * 60),
          );
        }
        if (report.createdAt && report.updatedAt) {
          draftToReview.push(
            (new Date(report.updatedAt).getTime() - new Date(report.createdAt).getTime()) / (1000 * 60),
          );
        }
      }

      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;

      const dailyCounts: Record<string, number> = {};
      for (const report of reports) {
        const day = report.createdAt.toISOString().split('T')[0];
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }

      const sortedDays = Object.entries(dailyCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([date, count]) => ({ date, count }));

      const hourlyCounts: Record<number, number> = {};
      for (const report of reports) {
        const hour = new Date(report.createdAt).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }

      let busiestHour = 0;
      let maxCount = 0;
      for (const [hour, count] of Object.entries(hourlyCounts)) {
        if (count > maxCount) {
          maxCount = count;
          busiestHour = parseInt(hour);
        }
      }

      const monthly: Record<string, number> = {};
      for (const report of reports) {
        const month = report.createdAt.toISOString().substring(0, 7);
        monthly[month] = (monthly[month] || 0) + 1;
      }

      const eventsByType: Record<string, number> = {};
      for (const report of reports) {
        eventsByType[report.status] = (eventsByType[report.status] || 0) + 1;
      }

      const stats: TimelineStats = {
        averageCollectionToRelease: avg(collectionToRelease),
        averageReviewToApproval: avg(reviewToApproval),
        averageDraftToReview: avg(draftToReview),
        mostActiveDays: sortedDays,
        busiestHour,
        totalEvents: reports.length,
        eventsByType,
        monthlySummary: Object.entries(monthly)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count })),
      };

      return stats;
    } catch (error) {
      this.logger.error(`getTimelineStats failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  generateEventDescription(event: {
    action: string;
    entity: string;
    metadata?: Record<string, unknown>;
  }): { en: string; ar: string } {
    const descriptions: Record<string, { en: string; ar: string }> = {
      order_placed: { en: 'Order was placed', ar: 'تم إنشاء الطلب' },
      report_created: { en: 'Report created as draft', ar: 'تم إنشاء التقرير كمسودة' },
      report_approved: { en: 'Report was approved', ar: 'تم اعتماد التقرير' },
      report_released: { en: 'Report was released to patient', ar: 'تم إصدار التقرير للمريض' },
      report_rejected: { en: 'Report was rejected', ar: 'تم رفض التقرير' },
      critical_alert: { en: 'Critical alert triggered', ar: 'تم إطلاق تنبيه خطير' },
      item_added: { en: 'Test result item added', ar: 'تم إضافة نتيجة اختبار' },
      reviewed: { en: 'Report was reviewed', ar: 'تم مراجعة التقرير' },
      viewed: { en: 'Report was viewed', ar: 'تم عرض التقرير' },
      downloaded: { en: 'Report was downloaded', ar: 'تم تحميل التقرير' },
      status_change: { en: 'Status changed', ar: 'تم تغيير الحالة' },
      created: { en: 'Resource was created', ar: 'تم إنشاء المورد' },
      updated: { en: 'Resource was updated', ar: 'تم تحديث المورد' },
      deleted: { en: 'Resource was deleted', ar: 'تم حذف المورد' },
    };

    const base = descriptions[event.action] || {
      en: `${event.action} on ${event.entity}`,
      ar: `${event.action} على ${event.entity}`,
    };

    return base;
  }

  async getCriticalPath(patientId: string, dateFrom?: string, dateTo?: string) {
    try {
      const where: any = {
        patientId,
        status: 'RELEASED',
      };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const criticalReports = await (this.prisma as any).report.findMany({
        where: {
          ...where,
          items: { some: { isAbnormal: true } },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            where: { isAbnormal: true },
            include: { labTest: true },
          },
          approvedBy: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        },
      });

      const pathItems = criticalReports.map((report) => ({
        reportId: report.id,
        reportNumber: report.reportNumber,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        approvedAt: report.updatedAt?.toISOString() ?? null,
        releasedAt: report.releasedAt?.toISOString() ?? null,
        approvedBy: report.approvedById
          ? `${report.approvedById.firstNameAr} ${report.approvedById.lastNameAr}`
          : null,
        criticalItems: report['items'].map((item: any) => ({
          testName: item.labTest?.nameAr || item.labTest?.nameEn || 'Unknown',
          value: item.value,
          flags: item.flags,
        })),
        turnaroundMinutes:
          report.createdAt && report.releasedAt
            ? Math.round(
                (new Date(report.releasedAt).getTime() - new Date(report.createdAt).getTime()) /
                  (1000 * 60),
              )
            : null,
      }));

      return {
        patientId,
        totalCriticalReports: pathItems.length,
        dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
        reports: pathItems,
        averageTurnaroundMinutes:
          pathItems.length > 0
            ? Math.round(
                pathItems.reduce((s, r) => s + (r.turnaroundMinutes ?? 0), 0) / pathItems.length,
              )
            : 0,
      };
    } catch (error) {
      this.logger.error(`getCriticalPath failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  formatTimelineForDisplay(events: TimelineEvent[], language: 'ar' | 'en') {
    return events.map((event) => ({
      id: event.id,
      type: event.type,
      action: event.action,
      description: language === 'ar' ? event.descriptionAr : event.description,
      timestamp: event.timestamp,
      timeAgo: this.getTimeAgo(new Date(event.timestamp), language),
      userName: event.userName,
      metadata: event.metadata,
    }));
  }

  private getTimeAgo(date: Date, language: 'ar' | 'en'): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (language === 'ar') {
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 30) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString('ar-SA');
    }

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB');
  }
}


