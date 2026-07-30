import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Request } from 'express';
import * as crypto from 'crypto';

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description: string;
  descriptionAr: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AuditFilters {
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SuspiciousActivity {
  type: 'mass_download' | 'off_hours_access' | 'rapid_succession' | 'unusual_entity_access';
  severity: 'low' | 'medium' | 'high';
  description: string;
  descriptionAr: string;
  userId?: string;
  userName?: string;
  count: number;
  timeWindow: string;
  events: AuditEntry[];
}

@Injectable()
export class AuditTrailService {
  private readonly logger = new Logger(AuditTrailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    req?: Request,
  ): Promise<void> {
    try {
      const descriptions = this.getActionDescriptions(action, entity, entityId);

      const auditData: any = {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        description: descriptions.en,
        descriptionAr: descriptions.ar,
        ipAddress: req?.ip || req?.socket?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
        createdAt: new Date(),
      };

      await (this.prisma as any).auditLog?.create?.({ data: auditData });

      this.logger.log(`Audit: ${action} on ${entity}(${entityId}) by user ${userId}`);
    } catch (error) {
      this.logger.error(`logAction failed: ${error.message}`, error.stack);
    }
  }

  async getAuditTrail(entity: string, entityId: string, filters?: AuditFilters) {
    try {
      const where: any = { entity, entityId };

      if (filters?.action) where.action = filters.action;
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 50;
      const skip = (page - 1) * limit;
      const sortOrder = filters?.sortOrder ?? 'desc';

      const orderBy: any = {};
      orderBy[filters?.sortBy || 'createdAt'] = sortOrder;

      const [auditLogs, total] = await Promise.all([
        (this.prisma as any).auditLog?.findMany?.({
          where,
          skip,
          take: limit,
          orderBy,
        }) ?? Promise.resolve([]),
        (this.prisma as any).auditLog?.count?.({ where }) ?? Promise.resolve(0),
      ]);

      const entries = await this.enrichAuditEntries(auditLogs || []);

      return {
        data: entries,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`getAuditTrail failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserAudit(userId: string, filters?: AuditFilters) {
    try {
      const where: any = { userId };

      if (filters?.action) where.action = filters.action;
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 50;
      const skip = (page - 1) * limit;

      const [auditLogs, total] = await Promise.all([
        (this.prisma as any).auditLog?.findMany?.({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }) ?? Promise.resolve([]),
        (this.prisma as any).auditLog?.count?.({ where }) ?? Promise.resolve(0),
      ]);

      const entries = await this.enrichAuditEntries(auditLogs || []);

      return {
        data: entries,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error(`getUserAudit failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getReportAuditTrail(reportId: string) {
    try {
      const logs = await (this.prisma as any).auditLog?.findMany?.({
        where: {
          OR: [
            { entity: 'Report', entityId: reportId },
            { entity: 'ReportItem', entityId: reportId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      }) ?? [];

      const entries = await this.enrichAuditEntries(logs);

      return {
        reportId,
        totalEvents: entries.length,
        events: entries,
        lifecycle: {
          created: entries.find((e: AuditEntry) => e.action === 'created'),
          updated: entries.filter((e: AuditEntry) => e.action === 'updated'),
          approved: entries.find((e: AuditEntry) => e.action === 'approved'),
          released: entries.find((e: AuditEntry) => e.action === 'released'),
          viewed: entries.filter((e: AuditEntry) => e.action === 'viewed'),
          downloaded: entries.filter((e: AuditEntry) => e.action === 'downloaded'),
        },
      };
    } catch (error) {
      this.logger.error(`getReportAuditTrail failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatientAuditTrail(patientId: string) {
    try {
      const audits = await (this.prisma as any).auditLog?.findMany?.({
        where: { entity: 'Patient', entityId: patientId },
        orderBy: { createdAt: 'desc' },
      }) ?? [];

      const reportAudits = await (this.prisma as any).auditLog?.findMany?.({
        where: {
          entity: 'Report',
          entityId: {
            in: (
              await this.prisma.report.findMany({
                where: { patientId },
                select: { id: true },
              })
            ).map((r) => r.id),
          },
        },
        orderBy: { createdAt: 'desc' },
      }) ?? [];

      const allLogs = [...audits, ...reportAudits].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const entries = await this.enrichAuditEntries(allLogs);

      const accessByUser: Record<string, number> = {};
      for (const entry of entries) {
        if (entry.userId) {
          accessByUser[entry.userId] = (accessByUser[entry.userId] || 0) + 1;
        }
      }

      return {
        patientId,
        totalAccesses: entries.length,
        uniqueUsers: Object.keys(accessByUser).length,
        accessByUser,
        accesses: entries,
      };
    } catch (error) {
      this.logger.error(`getPatientAuditTrail failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSuspiciousActivity(dateFrom?: string, dateTo?: string) {
    try {
      const since = dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const until = dateTo ? new Date(dateTo) : new Date();

      const logs: any[] =
        (await (this.prisma as any).auditLog?.findMany?.({
          where: {
            createdAt: { gte: since, lte: until },
          },
          orderBy: { createdAt: 'desc' },
        })) ?? [];

      const suspicious: SuspiciousActivity[] = [];
      const userIdActions: Record<string, any[]> = {};
      const hourCounts: Record<string, number> = {};

      for (const log of logs) {
        if (!userIdActions[log.userId]) userIdActions[log.userId] = [];
        userIdActions[log.userId].push(log);

        const hour = new Date(log.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      for (const [userId, actions] of Object.entries(userIdActions)) {
        const downloads = actions.filter(
          (a: any) => a.action === 'downloaded' || a.action === 'export',
        );
        if (downloads.length >= 20) {
          suspicious.push({
            type: 'mass_download',
            severity: downloads.length >= 50 ? 'high' : 'medium',
            description: `User downloaded ${downloads.length} reports in the period`,
            descriptionAr: `قام المستخدم بتحميل ${downloads.length} تقرير في الفترة`,
            userId,
            count: downloads.length,
            timeWindow: `${since.toISOString()} - ${until.toISOString()}`,
            events: await this.enrichAuditEntries(downloads),
          });
        }

        const offHours = actions.filter((a: any) => {
          const hour = new Date(a.createdAt).getHours();
          return hour < 6 || hour > 22;
        });
        if (offHours.length >= 10) {
          suspicious.push({
            type: 'off_hours_access',
            severity: offHours.length >= 25 ? 'high' : 'medium',
            description: `User accessed system off-hours (${offHours.length} times)`,
            descriptionAr: `قام المستخدم بالوصول خارج ساعات العمل (${offHours.length} مرة)`,
            userId,
            count: offHours.length,
            timeWindow: `${since.toISOString()} - ${until.toISOString()}`,
            events: await this.enrichAuditEntries(offHours),
          });
        }

        const sorted = actions.sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const rapidAccess = [];
        for (let i = 1; i < sorted.length; i++) {
          const diff =
            new Date(sorted[i].createdAt).getTime() - new Date(sorted[i - 1].createdAt).getTime();
          if (diff < 1000) {
            rapidAccess.push(sorted[i]);
          }
        }
        if (rapidAccess.length >= 5) {
          suspicious.push({
            type: 'rapid_succession',
            severity: 'medium',
            description: `Rapid access pattern detected (${rapidAccess.length} events within 1 second)`,
            descriptionAr: `نمط وصول سريع ملحوظ (${rapidAccess.length} حدث خلال ثانية)`,
            userId,
            count: rapidAccess.length,
            timeWindow: `${since.toISOString()} - ${until.toISOString()}`,
            events: await this.enrichAuditEntries(rapidAccess),
          });
        }
      }

      return {
        dateRange: { from: since.toISOString(), to: until.toISOString() },
        totalSuspicious: suspicious.length,
        activities: suspicious.sort((a, b) => {
          const rank = { high: 3, medium: 2, low: 1 };
          return rank[b.severity] - rank[a.severity];
        }),
        summary: {
          massDownloads: suspicious.filter((s) => s.type === 'mass_download').length,
          offHoursAccess: suspicious.filter((s) => s.type === 'off_hours_access').length,
          rapidSuccession: suspicious.filter((s) => s.type === 'rapid_succession').length,
        },
      };
    } catch (error) {
      this.logger.error(`getSuspiciousActivity failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAuditStats(dateFrom?: string, dateTo?: string) {
    try {
      const where: any = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const totalLogs = await (this.prisma as any).auditLog?.count?.({ where }) ?? 0;

      const actionLogs = await (this.prisma as any).auditLog?.groupBy?.({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }) ?? [];

      const userLogs = await (this.prisma as any).auditLog?.groupBy?.({
        by: ['userId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }) ?? [];

      const entityLogs = await (this.prisma as any).auditLog?.groupBy?.({
        by: ['entity'],
        where,
        _count: { id: true },
      }) ?? [];

      const timeline = await (this.prisma as any).auditLog?.findMany?.({
        where,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }) ?? [];

      const dailyCounts: Record<string, number> = {};
      for (const log of timeline) {
        const day = new Date(log.createdAt).toISOString().split('T')[0];
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }

      return {
        totalLogs,
        actionsByType: actionLogs.reduce(
          (acc: Record<string, number>, a: any) => {
            acc[a.action] = a._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        topUsers: userLogs.map((u: any) => ({
          userId: u.userId,
          actionCount: u._count.id,
        })),
        actionsByEntity: entityLogs.reduce(
          (acc: Record<string, number>, e: any) => {
            acc[e.entity] = e._count.id;
            return acc;
          },
          {} as Record<string, number>,
        ),
        dailyTimeline: Object.entries(dailyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
      };
    } catch (error) {
      this.logger.error(`getAuditStats failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exportAuditLog(
    filters: AuditFilters,
    format: 'csv' | 'json' = 'json',
  ): Promise<{ filename: string; data: string; mimeType: string }> {
    try {
      const where: any = {};
      if (filters.action) where.action = filters.action;
      if (filters.userId) where.userId = filters.userId;
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const logs: any[] =
        (await (this.prisma as any).auditLog?.findMany?.({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10000,
        })) ?? [];

      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'csv') {
        const headers = [
          'ID,User ID,Action,Entity,Entity ID,Description,Description (Ar),IP Address,Timestamp,Old Values,New Values',
        ];
        const rows = logs.map((log) =>
          [
            log.id,
            log.userId,
            log.action,
            log.entity,
            log.entityId,
            `"${(log.description || '').replace(/"/g, '""')}"`,
            `"${(log.descriptionAr || '').replace(/"/g, '""')}"`,
            log.ipAddress || '',
            log.createdAt.toISOString(),
            `"${(log.oldValues || '').replace(/"/g, '""')}"`,
            `"${(log.newValues || '').replace(/"/g, '""')}"`,
          ].join(','),
        );
        return {
          filename: `audit_export_${dateStr}.csv`,
          data: [...headers, ...rows].join('\n'),
          mimeType: 'text/csv',
        };
      }

      return {
        filename: `audit_export_${dateStr}.json`,
        data: JSON.stringify(logs, null, 2),
        mimeType: 'application/json',
      };
    } catch (error) {
      this.logger.error(`exportAuditLog failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getComplianceReport(dateFrom?: string, dateTo?: string) {
    try {
      const since = dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const until = dateTo ? new Date(dateTo) : new Date();

      const logs: any[] =
        (await (this.prisma as any).auditLog?.findMany?.({
          where: { createdAt: { gte: since, lte: until } },
          orderBy: { createdAt: 'desc' },
        })) ?? [];

      const totalAccesses = logs.length;
      const uniqueUsers = new Set(logs.map((l) => l.userId)).size;
      const uniquePatients = new Set(logs.filter((l) => l.entity === 'Patient').map((l) => l.entityId)).size;
      const uniqueReports = new Set(logs.filter((l) => l.entity === 'Report').map((l) => l.entityId)).size;

      const actionsByType: Record<string, number> = {};
      for (const log of logs) {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      }

      const accessesByDay: Record<string, number> = {};
      for (const log of logs) {
        const day = new Date(log.createdAt).toISOString().split('T')[0];
        accessesByDay[day] = (accessesByDay[day] || 0) + 1;
      }

      const offHoursAccesses = logs.filter((l) => {
        const hour = new Date(l.createdAt).getHours();
        return hour < 6 || hour > 22;
      }).length;

      const avgAccessesPerDay =
        Object.keys(accessesByDay).length > 0
          ? Math.round(totalAccesses / Object.keys(accessesByDay).length)
          : 0;

      return {
        reportGeneratedAt: new Date().toISOString(),
        reportPeriod: { from: since.toISOString(), to: until.toISOString() },
        standards: ['HIPAA', 'GDPR'],
        summary: {
          totalAccesses,
          uniqueUsers,
          uniquePatientsAccessed: uniquePatients,
          uniqueReportsAccessed: uniqueReports,
          offHoursAccesses,
          averageAccessesPerDay: avgAccessesPerDay,
        },
        actionsByType,
        dataAccessTrend: Object.entries(accessesByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        complianceScore: this.calculateComplianceScore(logs, offHoursAccesses),
        recommendations: this.generateComplianceRecommendations(logs, offHoursAccesses),
      };
    } catch (error) {
      this.logger.error(`getComplianceReport failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async anonymizeAuditLog(logId: string): Promise<void> {
    try {
      const log = await (this.prisma as any).auditLog?.findUnique?.({ where: { id: logId } });
      if (!log) throw new Error(`Audit log ${logId} not found`);

      const anonymizedUserId = crypto
        .createHash('sha256')
        .update(`anon-${log.userId}-${log.createdAt?.toISOString?.() || Date.now()}`)
        .digest('hex')
        .substring(0, 16);

      const anonymizedIp = log.ipAddress
        ? crypto.createHash('sha256').update(log.ipAddress).digest('hex').substring(0, 8)
        : null;

      await (this.prisma as any).auditLog?.update?.({
        where: { id: logId },
        data: {
          userId: `ANON-${anonymizedUserId}`,
          ipAddress: anonymizedIp,
          userAgent: null,
          oldValues: null,
          newValues: null,
          metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
        },
      });

      this.logger.log(`Audit log ${logId} anonymized`);
    } catch (error) {
      this.logger.error(`anonymizeAuditLog failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async enrichAuditEntries(logs: any[]): Promise<AuditEntry[]> {
    if (!logs || logs.length === 0) return [];

    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
    const users: any[] = [];

    if (userIds.length > 0) {
      try {
        const found = await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, role: true },
        });
        users.push(...found);
      } catch {}
    }

    const userMap = new Map(users.map((u) => [u.id, u]));

    return logs.map((log) => {
      const user = userMap.get(log.userId);
      return {
        id: log.id,
        userId: log.userId,
        userName: user ? `${user.firstNameAr || user.firstNameEn || ''} ${user.lastNameAr || user.lastNameEn || ''}`.trim() || log.userId : log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        oldValues: log.oldValues ? this.tryParseJson(log.oldValues) : undefined,
        newValues: log.newValues ? this.tryParseJson(log.newValues) : undefined,
        description: log.description || '',
        descriptionAr: log.descriptionAr || '',
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        timestamp: log.createdAt?.toISOString?.() || log.createdAt,
        metadata: log.metadata ? this.tryParseJson(log.metadata) : undefined,
      };
    });
  }

  private tryParseJson(value: string | Record<string, unknown>): Record<string, unknown> | undefined {
    if (typeof value === 'object') return value as Record<string, unknown>;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  private getActionDescriptions(
    action: string,
    entity: string,
    entityId: string,
  ): { en: string; ar: string } {
    const descriptions: Record<string, { en: string; ar: string }> = {
      created: {
        en: `${entity} ${entityId} was created`,
        ar: `تم إنشاء ${entity} ${entityId}`,
      },
      updated: {
        en: `${entity} ${entityId} was updated`,
        ar: `تم تحديث ${entity} ${entityId}`,
      },
      deleted: {
        en: `${entity} ${entityId} was deleted`,
        ar: `تم حذف ${entity} ${entityId}`,
      },
      viewed: {
        en: `${entity} ${entityId} was viewed`,
        ar: `تم عرض ${entity} ${entityId}`,
      },
      downloaded: {
        en: `${entity} ${entityId} was downloaded`,
        ar: `تم تحميل ${entity} ${entityId}`,
      },
      approved: {
        en: `Report ${entityId} was approved`,
        ar: `تم اعتماد التقرير ${entityId}`,
      },
      released: {
        en: `Report ${entityId} was released`,
        ar: `تم إصدار التقرير ${entityId}`,
      },
      rejected: {
        en: `Report ${entityId} was rejected`,
        ar: `تم رفض التقرير ${entityId}`,
      },
      exported: {
        en: `Data exported from ${entity} ${entityId}`,
        ar: `تم تصدير البيانات من ${entity} ${entityId}`,
      },
      printed: {
        en: `${entity} ${entityId} was printed`,
        ar: `تم طباعة ${entity} ${entityId}`,
      },
    };

    return (
      descriptions[action] || {
        en: `${action} performed on ${entity} ${entityId}`,
        ar: `تم ${action} على ${entity} ${entityId}`,
      }
    );
  }

  private calculateComplianceScore(logs: any[], offHoursAccesses: number): number {
    let score = 100;

    if (offHoursAccesses > 0) {
      score -= Math.min(offHoursAccesses * 2, 20);
    }

    const accessesWithoutUser = logs.filter((l) => !l.userId).length;
    if (accessesWithoutUser > 0) {
      score -= Math.min(accessesWithoutUser * 5, 15);
    }

    const logsWithoutIp = logs.filter((l) => !l.ipAddress).length;
    if (logsWithoutIp > logs.length * 0.1) {
      score -= 5;
    }

    const bulkExports = logs.filter((l) => l.action === 'export' || l.action === 'exported').length;
    if (bulkExports > 10) {
      score -= Math.min((bulkExports - 10) * 2, 10);
    }

    return Math.max(0, Math.round(score));
  }

  private generateComplianceRecommendations(
    logs: any[],
    offHoursAccesses: number,
  ): string[] {
    const recommendations: string[] = [];

    if (offHoursAccesses > 20) {
      recommendations.push('Review off-hours access patterns and consider implementing time-based access restrictions');
    }

    const highVolumeUsers = logs
      .reduce(
        (acc: Record<string, number>, log: any) => {
          if (log.userId) acc[log.userId] = (acc[log.userId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    for (const [userId, count] of Object.entries(highVolumeUsers)) {
      if ((count as number) > 100) {
        recommendations.push(`User ${userId} has unusually high access volume (${count} actions). Review if this is expected.`);
      }
    }

    const updateActions = logs.filter((l) => l.action === 'updated' && l.oldValues && l.newValues);
    if (updateActions.length > 0) {
      recommendations.push('Ensure data modification policies are documented and all updates are justified');
    }

    recommendations.push('Schedule regular audit log reviews to maintain compliance with HIPAA and GDPR requirements');

    return recommendations;
  }
}

