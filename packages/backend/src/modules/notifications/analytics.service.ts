import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class NotificationAnalyticsService {
  private readonly logger = new Logger(NotificationAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getChannelPerformance(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [smsStats, emailStats, whatsappStats] = await Promise.all([
      this.getChannelStats((this.prisma as any).smsLog, where),
      this.getChannelStats((this.prisma as any).emailLog, where),
      this.getChannelStats((this.prisma as any).whatsAppLog, where),
    ]);

    return {
      channels: {
        SMS: smsStats,
        EMAIL: emailStats,
        WHATSAPP: whatsappStats,
      },
    };
  }

  private async getChannelStats(model: any, where: any) {
    try {
      const total = await model.count({ where });
      const sent = await model.count({ where: { ...where, status: 'sent' } });
      const failed = await model.count({ where: { ...where, status: 'failed' } });
      const delivered = await model.count({ where: { ...where, status: 'delivered' } });

      return {
        total,
        sent,
        delivered,
        failed,
        deliveryRate: total > 0 ? Math.round(((sent + delivered) / total) * 10000) / 100 : 0,
        failureRate: total > 0 ? Math.round((failed / total) * 10000) / 100 : 0,
      };
    } catch {
      return { total: 0, sent: 0, delivered: 0, failed: 0, deliveryRate: 0, failureRate: 0 };
    }
  }

  async getTypeBreakdown(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const byType = await (this.prisma as any).notification.groupBy({
      by: ['type'],
      where,
      _count: { id: true },
    });

    return {
      breakdown: byType.map((t: any) => ({
        type: t.type,
        sent: t._count.id,
        read: 0,
        readRate: 0,
      })),
    };
  }

  async getHourlyDistribution(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      select: { createdAt: true },
    });

    const hourly: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourly[i] = 0;

    for (const n of notifications) {
      const hour = new Date(n.createdAt).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    }

    return {
      distribution: Object.entries(hourly).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      })),
    };
  }

  async getDailyStats(dateFrom?: string, dateTo?: string) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      select: { createdAt: true, read: true },
    });

    const daily: Record<string, { sent: number; read: number }> = {};
    for (const n of notifications) {
      const day = new Date(n.createdAt).toISOString().split('T')[0];
      if (!daily[day]) daily[day] = { sent: 0, read: 0 };
      daily[day].sent++;
      if (n.read) daily[day].read++;
    }

    return {
      daily: Object.entries(daily).map(([date, stats]) => ({
        date,
        ...stats,
        readRate: stats.sent > 0 ? Math.round((stats.read / stats.sent) * 10000) / 100 : 0,
      })),
    };
  }

  async getUserEngagement(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;

    const totalNotifications = await this.prisma.notification.count({ where });
    const readNotifications = await this.prisma.notification.count({ where: { ...where, read: true } });
    const unreadNotifications = await this.prisma.notification.count({ where: { ...where, read: false } });

    const recentActivity = await this.prisma.notification.findMany({
      where: {
        ...where,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalNotifications,
      readNotifications,
      unreadNotifications,
      engagementRate: totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 10000) / 100 : 0,
      weeklyActivity: recentActivity.length,
      recentNotifications: recentActivity,
    };
  }

  async getCampaignPerformance(campaignId?: string) {
    try {
      const campaignDb = (this.prisma as any).notificationCampaign;
      const where: any = {};
      if (campaignId) where.id = campaignId;

      const campaigns = await campaignDb.findMany({
        where,
        include: {
          _count: { select: { notifications: true } },
        },
      });

      return {
        campaigns: await Promise.all(
          campaigns.map(async (c: any) => {
            const sent = await this.prisma.notification.count({
              where: { type: c.type, createdAt: { gte: c.createdAt } },
            });
            const read = await this.prisma.notification.count({
              where: { type: c.type, read: true, createdAt: { gte: c.createdAt } },
            });

            return {
              id: c.id,
              nameAr: c.nameAr,
              nameEn: c.nameEn,
              type: c.type,
              targetAudience: c.targetAudience,
              sent,
              read,
              readRate: sent > 0 ? Math.round((read / sent) * 10000) / 100 : 0,
              createdAt: c.createdAt,
            };
          }),
        ),
      };
    } catch {
      return { campaigns: [] };
    }
  }

  async getDeliveryTimeStats(channel?: string) {
    if (channel && channel !== 'SMS' && channel !== 'EMAIL' && channel !== 'WHATSAPP') {
      return { channel, avgDeliveryTimeMs: 0, minDeliveryTimeMs: 0, maxDeliveryTimeMs: 0 };
    }

    if (channel === 'SMS' || !channel) {
      const smsLogs = await this.prisma.smsLog.findMany({
        where: { sentAt: { not: null } },
        select: { sentAt: true, createdAt: true as any },
      });
      const smsTimes = smsLogs
        .filter((l: any) => l.sentAt && l.createdAt)
        .map((l: any) => new Date(l.sentAt).getTime() - new Date(l.createdAt).getTime());

      return {
        channel: channel || 'SMS',
        avgDeliveryTimeMs: smsTimes.length > 0 ? Math.round(smsTimes.reduce((a, b) => a + b, 0) / smsTimes.length) : 0,
        minDeliveryTimeMs: smsTimes.length > 0 ? Math.min(...smsTimes) : 0,
        maxDeliveryTimeMs: smsTimes.length > 0 ? Math.max(...smsTimes) : 0,
        sampleSize: smsTimes.length,
      };
    }

    return { channel, avgDeliveryTimeMs: 0 };
  }

  async getTopFailedTypes() {
    const notifications = await this.prisma.notification.findMany({
      select: { type: true, data: true },
    });

    const failed = notifications.filter((n) => {
      const meta = n.data as any;
      return meta?.failedAt || meta?.finalError;
    });

    const byType: Record<string, number> = {};
    for (const n of failed) {
      byType[n.type] = (byType[n.type] || 0) + 1;
    }

    const sorted = Object.entries(byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { failedTypes: sorted };
  }

  async getAnalyticsDashboard() {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    const [channelPerf, typeBreakdown, dailyStats, topFailed, engagement] = await Promise.all([
      this.getChannelPerformance(dateFrom.toISOString(), new Date().toISOString()),
      this.getTypeBreakdown(dateFrom.toISOString(), new Date().toISOString()),
      this.getDailyStats(dateFrom.toISOString(), new Date().toISOString()),
      this.getTopFailedTypes(),
      this.getUserEngagement(),
    ]);

    const totalSent = await this.prisma.notification.count({
      where: { createdAt: { gte: dateFrom } },
    });

    const totalRead = await this.prisma.notification.count({
      where: { read: true, createdAt: { gte: dateFrom } },
    });

    return {
      summary: {
        totalSent,
        totalRead,
        overallReadRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 10000) / 100 : 0,
        periodDays: 30,
      },
      channelPerformance: channelPerf,
      typeBreakdown: typeBreakdown,
      dailyStats: dailyStats,
      topFailedTypes: topFailed,
      userEngagement: engagement,
    };
  }
}

