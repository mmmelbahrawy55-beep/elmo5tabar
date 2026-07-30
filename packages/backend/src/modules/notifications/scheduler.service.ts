import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async schedule(notification: {
    userId: string;
    type: string;
    data: Record<string, any>;
    channels?: string[];
  }, datetime: Date): Promise<any> {
    try {
      const schedDb = (this.prisma as any).scheduledNotification;
      const scheduled = await schedDb.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          data: notification.data,
          channels: notification.channels || [],
          scheduledAt: datetime,
          status: 'PENDING',
        },
      });
      this.logger.log(`Scheduled notification ${scheduled.id} for ${datetime.toISOString()}`);
      return scheduled;
    } catch (error) {
      this.logger.error(`Failed to schedule notification: ${error.message}`);
      throw error;
    }
  }

  async cancelScheduled(scheduleId: string): Promise<void> {
    try {
      const schedDb = (this.prisma as any).scheduledNotification;
      const existing = await schedDb.findUnique({ where: { id: scheduleId } });
      if (!existing) {
        throw new Error(`Scheduled notification ${scheduleId} not found`);
      }

      await schedDb.update({
        where: { id: scheduleId },
        data: { status: 'CANCELLED' },
      });
      this.logger.log(`Cancelled scheduled notification ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel scheduled notification ${scheduleId}: ${error.message}`);
      throw error;
    }
  }

  async reschedule(scheduleId: string, datetime: Date): Promise<any> {
    try {
      const schedDb = (this.prisma as any).scheduledNotification;
      const existing = await schedDb.findUnique({ where: { id: scheduleId } });
      if (!existing) {
        throw new Error(`Scheduled notification ${scheduleId} not found`);
      }

      const updated = await schedDb.update({
        where: { id: scheduleId },
        data: { scheduledAt: datetime, status: 'PENDING' },
      });
      this.logger.log(`Rescheduled notification ${scheduleId} to ${datetime.toISOString()}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to reschedule notification ${scheduleId}: ${error.message}`);
      throw error;
    }
  }

  async getScheduledNotifications(filters: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const schedDb = (this.prisma as any).scheduledNotification;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledAt = {};
      if (filters.dateFrom) where.scheduledAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.scheduledAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      schedDb.findMany({ where, skip, take: limit, orderBy: { scheduledAt: 'asc' } }),
      schedDb.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueNotifications(): Promise<void> {
    try {
      const schedDb = (this.prisma as any).scheduledNotification;
      const due = await schedDb.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() },
        },
      });

      for (const item of due) {
        try {
          await this.notificationsService.send(
            item.userId,
            item.type,
            item.data as Record<string, any>,
            item.channels as string[] | undefined,
          );

          await schedDb.update({
            where: { id: item.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } catch (error) {
          this.logger.error(`Failed to process scheduled notification ${item.id}: ${error.message}`);
          await schedDb.update({
            where: { id: item.id },
            data: { status: 'FAILED', error: error.message },
          });
        }
      }

      if (due.length > 0) {
        this.logger.log(`Processed ${due.length} due notifications`);
      }
    } catch (error) {
      this.logger.error(`processDueNotifications error: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleBirthdayNotifications(): Promise<void> {
    try {
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      const users = await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          profile: {
            select: { dateOfBirth: true, firstNameAr: true, firstNameEn: true },
          },
        },
      });

      const birthdayUsers = users.filter((u) => {
        if (!u.profile?.dateOfBirth) return false;
        const dob = new Date(u.profile.dateOfBirth);
        return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
      });

      for (const user of birthdayUsers) {
        try {
          await this.notificationsService.send(user.id, 'BIRTHDAY', {
            nameAr: user.profile?.firstNameAr || '',
            nameEn: user.profile?.firstNameEn || '',
          });
        } catch (error) {
          this.logger.error(`Failed to send birthday notification to ${user.id}: ${error.message}`);
        }
      }

      if (birthdayUsers.length > 0) {
        this.logger.log(`Sent ${birthdayUsers.length} birthday notifications`);
      }
    } catch (error) {
      this.logger.error(`scheduleBirthdayNotifications error: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduleAppointmentReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          scheduledAt: { gte: tomorrowStart, lt: tomorrowEnd },
          status: 'CONFIRMED',
        },
        include: {
          patient: { select: { userId: true, firstNameAr: true, firstNameEn: true } },
          branch: { select: { nameAr: true, nameEn: true } },
        },
      });

      for (const appointment of appointments) {
        if (!appointment.patient?.userId) continue;
        try {
          const scheduledTime = new Date(appointment.scheduledAt);
          const timeStr = scheduledTime.toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit' });

          await this.notificationsService.send(appointment.patient.userId, 'APPOINTMENT_REMINDER', {
            appointmentId: appointment.id,
            time: timeStr,
            branchNameAr: appointment.branch?.nameAr || '',
            branchNameEn: appointment.branch?.nameEn || '',
            nameAr: appointment.patient.firstNameAr || '',
            nameEn: appointment.patient.firstNameEn || '',
          });
        } catch (error) {
          this.logger.error(`Failed to send reminder for appointment ${appointment.id}: ${error.message}`);
        }
      }

      if (appointments.length > 0) {
        this.logger.log(`Sent ${appointments.length} appointment reminders`);
      }
    } catch (error) {
      this.logger.error(`scheduleAppointmentReminders error: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduleInsuranceExpiryReminders(): Promise<void> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const policies = await this.prisma.insurancePolicy.findMany({
        where: {
          endDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
          isActive: true,
        },
        include: {
          patient: { select: { userId: true, firstNameAr: true, firstNameEn: true } },
          insuranceCompany: { select: { nameAr: true, nameEn: true } },
        },
      });

      for (const policy of policies) {
        if (!policy.patient?.userId) continue;
        try {
          const daysRemaining = Math.ceil(
            (policy.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          await this.notificationsService.send(policy.patient.userId, 'INSURANCE_EXPIRY', {
            policyId: policy.id,
            policyNumber: policy.policyNumber,
            daysRemaining,
            providerNameAr: policy.insuranceCompany?.nameAr || '',
            providerNameEn: policy.insuranceCompany?.nameEn || '',
            nameAr: policy.patient.firstNameAr || '',
            nameEn: policy.patient.firstNameEn || '',
          });
        } catch (error) {
          this.logger.error(`Failed to send insurance expiry for policy ${policy.id}: ${error.message}`);
        }
      }

      if (policies.length > 0) {
        this.logger.log(`Sent ${policies.length} insurance expiry reminders`);
      }
    } catch (error) {
      this.logger.error(`scheduleInsuranceExpiryReminders error: ${error.message}`);
    }
  }
}

