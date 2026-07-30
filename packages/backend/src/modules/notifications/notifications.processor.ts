import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { SMSProvider } from '../auth/mfa/sms.provider';
import { EmailProvider } from '../auth/mfa/email.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';
import { PushNotificationProvider } from './channels/push.provider';
import { NotificationGateway } from './notification.gateway';

const BACKOFF_DELAYS = [60000, 300000, 900000, 3600000, 21600000];

interface NotificationJob {
  notificationId: string;
  userId: string;
  channel: string;
  type: string;
  data: Record<string, any>;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  retryCount: number;
  maxRetries: number;
}

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsProvider: SMSProvider,
    private readonly emailProvider: EmailProvider,
    private readonly whatsAppProvider: WhatsAppProvider,
    private readonly pushProvider: PushNotificationProvider,
    private readonly gateway: NotificationGateway,
  ) {}

  @Process('send')
  async processNotification(job: Job<NotificationJob>): Promise<void> {
    const { notificationId, channel, userId } = job.data;
    this.logger.log(`Processing notification ${notificationId} via ${channel}`);

    try {
      switch (channel) {
        case 'SMS':
          await this.sendSms(job);
          break;
        case 'EMAIL':
          await this.sendEmail(job);
          break;
        case 'WHATSAPP':
          await this.sendWhatsApp(job);
          break;
        case 'PUSH':
          await this.sendPush(job);
          break;
        default:
          await this.handleInApp(job);
          break;
      }

      this.logger.log(`Notification ${notificationId} sent via ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notificationId} via ${channel}: ${error.message}`);
      await this.handleRetry(job, error);
    }
  }

  @Process('send-sms')
  async sendSms(job: Job<NotificationJob>): Promise<void> {
    const { data, userId, bodyAr, bodyEn } = job.data;
    const lang = data?.lang || 'ar';
    const message = lang === 'ar' ? bodyAr : bodyEn;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      throw new Error(`User ${userId} has no phone number`);
    }

    const success = await this.smsProvider.send(user.phone, message);

    await (this.prisma as any).smsLog.create({
      data: {
        recipientNumber: user.phone,
        message,
        messageAr: message,
        status: success ? 'sent' : 'failed',
        gateway: 'twilio',
        failureReason: success ? null : 'provider_error',
      },
    });

    if (!success) throw new Error(`SMS provider returned failure for ${userId}`);
  }

  @Process('send-email')
  async sendEmail(job: Job<NotificationJob>): Promise<void> {
    const { data, userId, titleAr, titleEn, bodyAr, bodyEn } = job.data;
    const lang = data?.lang || 'ar';
    const subject = lang === 'ar' ? titleAr : titleEn;
    const html = lang === 'ar' ? bodyAr : bodyEn;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new Error(`User ${userId} has no email`);
    }

    const success = await this.emailProvider.send(user.email, subject, html);

    await (this.prisma as any).emailLog.create({
      data: {
        recipientEmail: user.email,
        subject,
        subjectAr: subject,
        body: html,
        bodyAr: html,
        status: success ? 'sent' : 'failed',
        gateway: 'sendgrid',
        failureReason: success ? null : 'provider_error',
      },
    });

    if (!success) throw new Error(`Email provider returned failure for ${userId}`);
  }

  @Process('send-whatsapp')
  async sendWhatsApp(job: Job<NotificationJob>): Promise<void> {
    const { data, userId, bodyAr, bodyEn } = job.data;
    const lang = data?.lang || 'ar';
    const message = lang === 'ar' ? bodyAr : bodyEn;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      throw new Error(`User ${userId} has no phone number`);
    }

    const success = await this.whatsAppProvider.send(user.phone, message);

    await (this.prisma as any).whatsAppLog.create({
      data: {
        recipientNumber: user.phone,
        messageType: 'text',
        message,
        status: success ? 'sent' : 'failed',
        gateway: 'meta',
        failureReason: success ? null : 'provider_error',
      },
    });

    if (!success) throw new Error(`WhatsApp provider returned failure for ${userId}`);
  }

  @Process('send-push')
  async sendPush(job: Job<NotificationJob>): Promise<void> {
    const { data, userId, titleAr, titleEn, bodyAr, bodyEn } = job.data;
    const lang = data?.lang || 'ar';
    const title = lang === 'ar' ? titleAr : titleEn;
    const body = lang === 'ar' ? bodyAr : bodyEn;

    const devices = await (this.prisma as any).device.findMany({
      where: { userId, pushToken: { not: null } },
      select: { pushToken: true },
    });

    if (!devices || devices.length === 0) {
      this.logger.warn(`No push devices for user ${userId}`);
      return;
    }

    const tokens = devices.map((d: any) => d.pushToken).filter(Boolean);
    const result = await this.pushProvider.sendToMultiple(tokens, title, body, data);

    if ((result as any).failure > 0 && (result as any).success === 0) {
      throw new Error(`Push failed for all ${tokens.length} devices`);
    }
  }

  private async handleInApp(job: Job<NotificationJob>): Promise<void> {
    const { userId, notificationId, data, titleAr, titleEn, bodyAr, bodyEn, type } = job.data;

      this.gateway.sendToUser(userId, {
        id: notificationId,
        type,
        titleAr,
        titleEn,
        bodyAr,
        bodyEn,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      } as unknown as Record<string, unknown>);
  }

  private async handleRetry(job: Job<NotificationJob>, error: Error): Promise<void> {
    const retryCount = (job.data.retryCount || 0) + 1;

    if (retryCount <= job.data.maxRetries) {
      const delay = BACKOFF_DELAYS[retryCount - 1] || 21600000;
      this.logger.log(`Retry ${retryCount}/${job.data.maxRetries} for notification ${job.data.notificationId} in ${delay}ms`);

      await this.prisma.notification.update({
        where: { id: job.data.notificationId },
        data: {
          data: {
            ...job.data.data,
            lastRetry: new Date().toISOString(),
            retryCount,
            lastError: error.message,
          } as any,
        },
      });

      await job.queue.add(job.name, { ...job.data, retryCount }, { delay, attempts: job.opts.attempts });
    } else {
      this.logger.error(`Notification ${job.data.notificationId} failed after ${retryCount} retries`);

      await this.prisma.notification.update({
        where: { id: job.data.notificationId },
        data: {
          data: {
            ...job.data.data,
            failedAt: new Date().toISOString(),
            finalError: error.message,
            retryCount,
          } as any,
        },
      });
    }
  }
}

