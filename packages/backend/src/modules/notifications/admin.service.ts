import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationQueueService } from './queue.service';
import { SMSProvider } from '../auth/mfa/sms.provider';
import { EmailProvider } from '../auth/mfa/email.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';

@Injectable()
export class NotificationAdminService {
  private readonly logger = new Logger(NotificationAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly queueService: NotificationQueueService,
    private readonly smsProvider: SMSProvider,
    private readonly emailProvider: EmailProvider,
    private readonly whatsAppProvider: WhatsAppProvider,
  ) {}

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [sentToday, totalNotifications, readNotifications, queueStatus, channelsStatus] = await Promise.all([
      this.prisma.notification.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { read: true } }),
      this.queueService.getQueueStatus(),
      this.getChannelConfig(),
    ]);

    const deliveryRate = totalNotifications > 0
      ? Math.round((readNotifications / totalNotifications) * 10000) / 100
      : 0;

    return {
      sentToday,
      totalNotifications,
      deliveryRate,
      queueStatus,
      channels: channelsStatus,
      timestamp: new Date().toISOString(),
    };
  }

  async getChannelConfig() {
    try {
      const configDb = (this.prisma as any).channelConfig;
      const configs = await configDb.findMany();
      return configs;
    } catch {
      return [
        { channel: 'SMS', provider: 'twilio', active: true, rateLimitPerMinute: 20 },
        { channel: 'EMAIL', provider: 'smtp', active: true, rateLimitPerMinute: 50 },
        { channel: 'WHATSAPP', provider: 'twilio', active: true, rateLimitPerMinute: 10 },
        { channel: 'PUSH', provider: 'firebase', active: true, rateLimitPerMinute: 100 },
        { channel: 'VOICE', provider: 'twilio', active: false, rateLimitPerMinute: 5 },
      ];
    }
  }

  async updateChannelConfig(id: string, dto: { config?: Record<string, any>; active?: boolean }) {
    try {
      const configDb = (this.prisma as any).channelConfig;
      const existing = await configDb.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Channel config ${id} not found`);

      const data: any = {};
      if (dto.config !== undefined) data.config = dto.config;
      if (dto.active !== undefined) data.active = dto.active;

      return configDb.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update channel config ${id}: ${error.message}`);
      throw error;
    }
  }

  async toggleChannel(channel: string, active: boolean) {
    try {
      const configDb = (this.prisma as any).channelConfig;
      await configDb.updateMany({
        where: { channel },
        data: { active, updatedAt: new Date() },
      });

      if (!active) {
        await this.queueService.pauseQueue(channel);
      } else {
        await this.queueService.resumeQueue(channel);
      }

      return { channel, active, message: `Channel ${channel} ${active ? 'enabled' : 'disabled'}` };
    } catch (error) {
      this.logger.error(`Failed to toggle channel ${channel}: ${error.message}`);
      throw error;
    }
  }

  async testChannel(channel: string, recipient: string) {
    const testMessage = 'This is a test notification from Al Mokhtabar Lab.';

    switch (channel.toUpperCase()) {
      case 'SMS':
        await this.smsProvider.send(recipient, testMessage);
        break;
      case 'EMAIL':
        await this.emailProvider.send(recipient, 'Test Notification - Al Mokhtabar', `<p>${testMessage}</p>`);
        break;
      case 'WHATSAPP':
        await this.whatsAppProvider.send(recipient, testMessage);
        break;
      default:
        throw new BadRequestException(`Unsupported channel: ${channel}`);
    }

    return { channel, recipient, status: 'sent', message: `Test ${channel} sent to ${recipient}` };
  }

  async getRateLimits() {
    try {
      const configDb = (this.prisma as any).channelConfig;
      const configs = await configDb.findMany();
      return configs.map((c: any) => ({
        channel: c.channel,
        rateLimitPerMinute: c.rateLimitPerMinute || 0,
        rateLimitPerHour: c.rateLimitPerHour || 0,
        rateLimitPerDay: c.rateLimitPerDay || 0,
      }));
    } catch {
      return [];
    }
  }

  async updateRateLimit(channel: string, limits: { maxPerMinute: number; maxPerHour: number; maxPerDay: number }) {
    try {
      const configDb = (this.prisma as any).channelConfig;
      await configDb.updateMany({
        where: { channel },
        data: {
          rateLimitPerMinute: limits.maxPerMinute,
          rateLimitPerHour: limits.maxPerHour,
          rateLimitPerDay: limits.maxPerDay,
          updatedAt: new Date(),
        },
      });

      return { channel, ...limits, message: 'Rate limits updated' };
    } catch (error) {
      this.logger.error(`Failed to update rate limits for ${channel}: ${error.message}`);
      throw error;
    }
  }

  async getBatchHistory() {
    try {
      const campaignDb = (this.prisma as any).notificationCampaign;
      const campaigns = await campaignDb.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        campaigns: await Promise.all(
          campaigns.map(async (c: any) => {
            const sent = await this.prisma.notification.count({
              where: { type: c.type },
            });
            return {
              id: c.id,
              nameAr: c.nameAr,
              nameEn: c.nameEn,
              type: c.type,
              channels: c.channels,
              totalSent: sent,
              status: c.status,
              createdAt: c.createdAt,
              scheduledAt: c.scheduledAt,
            };
          }),
        ),
      };
    } catch {
      return { campaigns: [] };
    }
  }

  async createBatchCampaign(dto: {
    nameAr: string;
    nameEn: string;
    type: string;
    channels: string[];
    audienceQuery: Record<string, any>;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    scheduledAt?: string;
  }) {
    try {
      const campaignDb = (this.prisma as any).notificationCampaign;
      const campaign = await campaignDb.create({
        data: {
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          type: dto.type,
          channels: dto.channels,
          audienceQuery: dto.audienceQuery,
          status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        },
      });

      let users: any[] = [];
      try {
        users = await this.prisma.user.findMany({
          where: dto.audienceQuery as any,
          select: { id: true },
        });
      } catch {
        this.logger.warn('Could not resolve audience query, campaign created as draft');
      }

      if (users.length > 0 && !dto.scheduledAt) {
        await this.notificationsService.sendToMany(
          users.map((u) => u.id),
          dto.type,
          { titleAr: dto.titleAr, titleEn: dto.titleEn, bodyAr: dto.bodyAr, bodyEn: dto.bodyEn },
          dto.channels,
        );

        await campaignDb.update({
          where: { id: campaign.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      }

      return campaign;
    } catch (error) {
      this.logger.error(`Failed to create campaign: ${error.message}`);
      throw error;
    }
  }

  async getFailedNotifications(filters: {
    channel?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      data: {
        path: ['failedAt'],
        not: null,
      },
    };

    if (filters.type) where.type = filters.type;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async manualRetry(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);

    const meta = notification.data as any;
    if (!meta?.failedAt) {
      throw new BadRequestException('Notification has not failed');
    }

    await this.notificationsService.send(
      notification.userId,
      notification.type,
      { ...meta, retryBy: 'admin', originalNotificationId: notificationId },
    );

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        data: { ...meta, retriedAt: new Date().toISOString(), retriedBy: 'admin' },
      },
    });

    return { message: `Notification ${notificationId} queued for retry` };
  }

  async bulkRetry(filters: { channel?: string; type?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {
      data: {
        path: ['failedAt'],
        not: null,
      },
    };
    if (filters.type) where.type = filters.type;
    if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };

    const failedNotifications = await this.prisma.notification.findMany({ where });

    let retried = 0;
    let failed = 0;

    for (const notification of failedNotifications) {
      try {
        const meta = notification.data as any;
        await this.notificationsService.send(
          notification.userId,
          notification.type,
          { ...meta, retryBy: 'admin-bulk' },
        );
        retried++;
      } catch {
        failed++;
      }
    }

    return { retried, failed, total: failedNotifications.length };
  }

  async getNotificationAudit(filters: { userId?: string; action?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    try {
      const auditDb = (this.prisma as any).notificationAudit;
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      const [data, total] = await Promise.all([
        auditDb.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        auditDb.count({ where }),
      ]);

      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } catch {
      return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }
  }
}

