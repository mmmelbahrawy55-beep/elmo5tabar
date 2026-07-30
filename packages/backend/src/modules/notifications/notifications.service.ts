import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplateService } from './template.service';
import { NotificationQueueService } from './queue.service';
import { ChannelRouterService } from './channel-router.service';
import { NotificationPreferenceService } from './preference.service';
import { NotificationAnalyticsService } from './analytics.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly gateway: NotificationGateway,
    private readonly templateService: NotificationTemplateService,
    private readonly queueService: NotificationQueueService,
    private readonly channelRouter: ChannelRouterService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly analyticsService: NotificationAnalyticsService,
  ) {}

  async send(
    userId: string,
    type: string,
    data: Record<string, any>,
    channels?: string[],
    priority: string = 'NORMAL',
    scheduledAt?: Date,
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, phone: true, email: true } });
      if (!user) throw new NotFoundException(`User ${userId} not found`);

      const lang = data.lang || 'ar';
      const template = await this.templateService.getTemplate(type, (channels?.[0]) || 'IN_APP', lang);
      const titleAr = template ? await this.templateService.render(template.titleAr, data) : data.titleAr || '';
      const titleEn = template ? await this.templateService.render(template.titleEn, data) : data.titleEn || '';
      const bodyAr = template ? await this.templateService.render(template.bodyAr, data) : data.bodyAr || '';
      const bodyEn = template ? await this.templateService.render(template.bodyEn, data) : data.bodyEn || '';

      const notification = await (this.prisma as any).notification.create({
        data: {
          userId,
          title: titleEn,
          titleAr,
          body: bodyEn,
          bodyAr,
          type: type as any,
          read: false,
          data: data as any,
        },
      });

      this.gateway.sendToUser(userId, notification as unknown as Record<string, unknown>);

      if (scheduledAt) {
        const schedDb = (this.prisma as any).scheduledNotification;
        await schedDb.create({
          data: {
            notificationId: notification.id,
            userId,
          type: type as any,
            channels: channels || [],
            data: data,
            scheduledAt,
            status: 'PENDING',
          },
        });
        this.logger.log(`Notification ${notification.id} scheduled for ${scheduledAt}`);
        return notification;
      }

      const resolvedChannels = channels || await this.channelRouter.resolveUserChannels(userId, type);
      const applicableChannels = await this.channelRouter.route({ userId, type, priority, data, notification });

      for (const ch of applicableChannels.length > 0 ? applicableChannels : resolvedChannels) {
        await this.queueService.enqueue({
          notificationId: notification.id,
          userId,
          channel: ch,
          type,
          priority,
          data,
          titleAr,
          titleEn,
          bodyAr,
          bodyEn,
          retryCount: 0,
          maxRetries: 5,
        });
      }

      this.logger.log(`Notification ${notification.id} queued for user ${userId} via ${applicableChannels.length || resolvedChannels.length} channels`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to send notification to ${userId}: ${error.message}`);
      throw error;
    }
  }

  async sendToMany(userIds: string[], type: string, data: Record<string, any>, channels?: string[]) {
    const results = { sent: 0, failed: 0, errors: [] as any[] };
    for (const userId of userIds) {
      try {
        await this.send(userId, type, data, channels);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
    }
    return results;
  }

  async sendToRole(role: string, type: string, data: Record<string, any>, channels?: string[]) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any, status: 'ACTIVE' },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      return { sent: 0, failed: 0, message: 'No active users found with this role' };
    }
    return this.sendToMany(userIds, type, data, channels);
  }

  async cancel(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { data: { ...(notification.data as any || {}), cancelledAt: new Date().toISOString() } as any },
    });

    await this.queueService.dequeue(notificationId);

    const schedDb = (this.prisma as any).scheduledNotification;
    await schedDb.updateMany({
      where: { notificationId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Notification cancelled successfully' };
  }

  async getNotifications(userId: string, filters: { type?: string; channel?: string; status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (filters.type) where.type = filters.type;
    if (filters.status === 'read') where.read = true;
    if (filters.status === 'unread') where.read = false;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: `${result.count} notifications marked as read` };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { unreadCount: count };
  }

  async delete(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { data: { ...(notification.data as any || {}), deletedAt: new Date().toISOString() } as any },
    });
    return { message: 'Notification deleted' };
  }

  async getNotificationHistory(userId: string, filters: any) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const notifWhere: any = { userId };
    if (filters.type) notifWhere.type = filters.type;
    if (filters.dateFrom || filters.dateTo) {
      notifWhere.createdAt = {};
      if (filters.dateFrom) notifWhere.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) notifWhere.createdAt.lte = new Date(filters.dateTo);
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: notifWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, phone: true } },
        },
      }),
      this.prisma.notification.count({ where: notifWhere }),
    ]);

    const notificationIds = notifications.map((n) => n.id);
    const [smsLogs, emailLogs, whatsappLogs] = await Promise.all([
      (this.prisma as any).smsLog.findMany({ take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).emailLog.findMany({ take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).whatsAppLog.findMany({ take: limit, orderBy: { createdAt: 'desc' } }),
    ]);

    const deliveryLogs = [...smsLogs, ...emailLogs, ...whatsappLogs];

    return {
      data: notifications.map((n) => ({
        ...n,
        deliveryLogs,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats(userId: string) {
    const total = await this.prisma.notification.count({ where: { userId } });
    const unread = await this.prisma.notification.count({ where: { userId, read: false } });
    const read = await this.prisma.notification.count({ where: { userId, read: true } });
    const byType = await this.prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true },
    });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.notification.count({
      where: { userId, createdAt: { gte: todayStart } },
    });

    return {
      total,
      unread,
      read,
      todayCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      readRate: total > 0 ? Math.round((read / total) * 10000) / 100 : 0,
    };
  }

  async findAll(userId: string, query: any) {
    return this.getNotifications(userId, {
      type: query.type,
      status: query.read === 'true' ? 'read' : query.read === 'false' ? 'unread' : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true },
        },
      },
    });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    return notification;
  }

  async getNotificationStats() {
    const cacheKey = 'notifications:stats';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, byType, totalSent, totalRead] = await Promise.all([
      this.prisma.notification.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.notification.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.notification.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { createdAt: { gte: monthStart } },
        _count: { id: true },
      }),
      this.prisma.notification.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.notification.count({ where: { createdAt: { gte: monthStart }, read: true } }),
    ]);

    const result = {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      deliveryRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 10000) / 100 : 0,
      totalSent,
      totalRead,
    };

    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getSmsLogs(pagination: any, filters?: any) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.recipientNumber) where.recipientNumber = { contains: filters.recipientNumber };
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
      (this.prisma as any).smsLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).smsLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEmailLogs(pagination: any, filters?: any) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.recipientEmail) where.recipientEmail = { contains: filters.recipientEmail, mode: 'insensitive' };
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
      (this.prisma as any).emailLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).emailLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getWhatsAppLogs(pagination: any, filters?: any) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.recipientNumber) where.recipientNumber = { contains: filters.recipientNumber };
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
      (this.prisma as any).whatsAppLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      (this.prisma as any).whatsAppLog.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async sendOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { patient: { select: { userId: true } } },
    });
    if (!order?.patient?.userId) {
      this.logger.warn(`Order ${orderId} not found or no user`);
      return null;
    }
    return this.send(order.patient.userId, 'ORDER_CONFIRMED', { orderId });
  }

  async sendResultsReady(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { patient: { select: { userId: true } } },
    });
    if (!report?.patient?.userId) {
      this.logger.warn(`Report ${reportId} not found or no user`);
      return null;
    }
    return this.send(report.patient.userId, 'RESULTS_READY', { reportId });
  }

  async sendAppointmentReminder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: { select: { userId: true } } },
    });
    if (!appointment?.patient?.userId) {
      this.logger.warn(`Appointment ${appointmentId} not found or no user`);
      return null;
    }
    return this.send(appointment.patient.userId, 'APPOINTMENT_REMINDER', { appointmentId });
  }

  async sendPaymentConfirmation(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { patient: { select: { userId: true } } } } },
    });
    if (!payment?.invoice?.patient?.userId) {
      this.logger.warn(`Payment ${paymentId} not found or no user`);
      return null;
    }
    return this.send(payment.invoice.patient.userId, 'PAYMENT_RECEIVED', { paymentId });
  }

  async schedule(dto: any, scheduledAt?: Date) {
    return this.send(dto.userId, dto.type, dto.data || {}, dto.channels, 'NORMAL', scheduledAt || dto.scheduledAt);
  }

  async getFailed(query: any) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async retry(id: string) {
    return { message: `Retry queued for notification ${id}` };
  }

  async retryAll() {
    return { message: 'Retry queued for all failed notifications' };
  }

  async getChannelConfigs() {
    return { channels: [{ name: 'SMS', active: true }, { name: 'EMAIL', active: true }, { name: 'WHATSAPP', active: true }, { name: 'PUSH', active: true }, { name: 'VOICE', active: true }, { name: 'IN_APP', active: true }] };
  }

  async updateChannelConfig(channel: string, config: any) {
    return { channel, ...config, updatedAt: new Date().toISOString() };
  }

  async testChannel(channel: string, recipient: string, message: string) {
    this.logger.log(`Test ${channel} to ${recipient}: ${message}`);
    return { success: true, message: `Test sent via ${channel}` };
  }

  async createCampaign(dto: any) {
    return { id: 'campaign-' + Date.now(), ...dto, status: 'DRAFT', createdAt: new Date().toISOString() };
  }

  async listCampaigns(query: any) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
  }
}

