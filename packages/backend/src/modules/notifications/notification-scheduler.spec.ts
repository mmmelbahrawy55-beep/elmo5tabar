import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('NotificationScheduler', () => {
  let scheduler: SchedulerService;
  let notificationsService: NotificationsService;
  let prisma: typeof mockPrismaService;

  const mockNotificationsService = {
    send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    scheduler = module.get<SchedulerService>(SchedulerService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('cron job execution', () => {
    it('should process scheduled notifications', async () => {
      const scheduledNotifications = [
        {
          id: 'sched-1',
          notificationId: 'notif-1',
          userId: 'user-1',
          type: 'APPOINTMENT_REMINDER',
          channels: ['WHATSAPP'],
          data: { appointmentId: 'apt-1' },
          scheduledAt: new Date(Date.now() - 1000),
          status: 'PENDING',
        },
      ];

      const schedDb = { findMany: jest.fn().mockResolvedValue(scheduledNotifications), update: jest.fn() };
      (prisma as any).scheduledNotification = schedDb;

      mockNotificationsService.send.mockResolvedValue({ id: 'notif-1' });

      await scheduler.handleCron();

      expect(mockNotificationsService.send).toHaveBeenCalled();
    });

    it('should handle empty schedule', async () => {
      const schedDb = { findMany: jest.fn().mockResolvedValue([]) };
      (prisma as any).scheduledNotification = schedDb;

      await scheduler.handleCron();

      expect(mockNotificationsService.send).not.toHaveBeenCalled();
    });

    it('should mark failed notifications', async () => {
      const scheduledNotifications = [
        {
          id: 'sched-1',
          userId: 'user-1',
          type: 'TEST',
          channels: ['EMAIL'],
          data: {},
          scheduledAt: new Date(Date.now() - 1000),
          status: 'PENDING',
        },
      ];

      const schedDb = {
        findMany: jest.fn().mockResolvedValue(scheduledNotifications),
        update: jest.fn().mockResolvedValue({}),
      };
      (prisma as any).scheduledNotification = schedDb;

      mockNotificationsService.send.mockRejectedValue(new Error('Send failed'));

      await scheduler.handleCron();

      expect(schedDb.update).toHaveBeenCalled();
    });
  });

  describe('reminder sending', () => {
    it('should send appointment reminders for upcoming appointments', async () => {
      const upcomingAppointments = [
        {
          id: 'apt-1',
          patient: { userId: 'user-1' },
          scheduledAt: new Date(Date.now() + 86400000),
        },
      ];

      prisma.appointment.findMany.mockResolvedValue(upcomingAppointments);
      mockNotificationsService.send.mockResolvedValue({ id: 'notif-reminder' });

      const appointments = await prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 86400000),
          },
          reminderSent: false,
        },
      });

      for (const apt of appointments) {
        if (apt.patient?.userId) {
          await notificationsService.send(apt.patient.userId, 'APPOINTMENT_REMINDER', { appointmentId: apt.id });
        }
      }

      expect(mockNotificationsService.send).toHaveBeenCalled();
    });

    it('should not send reminders for past appointments', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      const appointments = await prisma.appointment.findMany({
        where: { scheduledAt: { lte: new Date(Date.now() - 86400000) }, reminderSent: false },
      });

      expect(appointments).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('should clean old notifications', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 10 });

      const result = await mockPrismaService.notification.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo }, read: true },
      });

      expect(result.count).toBe(10);
    });

    it('should handle cleanup with no results', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 0 });

      const result = await mockPrismaService.notification.deleteMany({
        where: { createdAt: { lt: new Date() } },
      });

      expect(result.count).toBe(0);
    });
  });
});
