import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    severity?: string;
    requestId?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValues: data.oldValues,
          newValues: data.newValues,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          severity: data.severity || 'info',
          sessionId: data.requestId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`);
    }
  }

  async logAuthEvent(userId: string, action: string, ip?: string, userAgent?: string, details?: any): Promise<void> {
    await this.log({
      userId,
      action,
      entity: 'auth',
      ipAddress: ip,
      userAgent,
      newValues: details,
      severity: action.includes('FAILED') || action.includes('BLOCKED') ? 'warning' : 'info',
    });
  }

  async logDataAccess(userId: string, resourceType: string, resourceId: string, action: string, ip?: string): Promise<void> {
    await this.log({
      userId,
      action: `DATA_ACCESS_${action.toUpperCase()}`,
      entity: resourceType,
      entityId: resourceId,
      ipAddress: ip,
      severity: 'info',
      newValues: { phiAccessed: true },
    });
  }

  async logSecurityEvent(userId: string, action: string, ip?: string, details?: any): Promise<void> {
    await this.log({
      userId,
      action: `SECURITY_${action}`,
      entity: 'security',
      ipAddress: ip,
      newValues: details,
      severity: 'critical',
    });
  }

  async query(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getStats(period?: { dateFrom?: string; dateTo?: string }): Promise<any> {
    const where: any = {};
    if (period?.dateFrom || period?.dateTo) {
      where.createdAt = {};
      if (period.dateFrom) where.createdAt.gte = new Date(period.dateFrom);
      if (period.dateTo) where.createdAt.lte = new Date(period.dateTo);
    }

    const total = await this.prisma.auditLog.count({ where });
    const byAction = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return { total, byAction };
  }
}
