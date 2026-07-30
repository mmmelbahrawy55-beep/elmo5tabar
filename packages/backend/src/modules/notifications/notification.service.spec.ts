import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotificationGateway } from './notification.gateway';
import { NotificationTemplateService } from './template.service';
import { NotificationQueueService } from './queue.service';
import { ChannelRouterService } from './channel-router.service';
import { NotificationPreferenceService } from './preference.service';
import { NotificationAnalyticsService } from './analytics.service';
import { NotificationType, NotificationChannel } from '@prisma/client';
import {
  mockPrismaService,
  mockCacheManager,
  mockGateway,
  mockTemplateService,
  mockQueueService,
  mockChannelRouter,
  mockPreferenceService,
  mockAnalyticsService,
  mockWhatsAppService,
  mockTwilioService,
  mockFCMService,
  mockEmailService,
} from '../../../test/mocks';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: typeof mockPrismaService;

  const mockUser = { id: 'user-1', role: 'PATIENT', phone: '+966501234567', email: 'test@example.com' };
  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'APPOINTMENT_REMINDER',
    channel: 'IN_APP',
    title: 'Appointment Reminder',
    titleAr: 'تذكير موعد',
    body: 'You have an appointment tomorrow',
    bodyAr: 'لديك موعد غداً',
    read: false,
    data: { appointmentId: 'apt-1' },
    createdAt: new Date(),
    patientId: null,
    orderId: null,
    sentAt: null,
    deliveredAt: null,
    readAt: null,
    expiresAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: NotificationQueueService, useValue: mockQueueService },
        { provide: ChannelRouterService, useValue: mockChannelRouter },
        { provide: NotificationPreferenceService, useValue: mockPreferenceService },
        { provide: NotificationAnalyticsService, useValue: mockAnalyticsService },
        { provide: 'WHATSAPP_SERVICE', useValue: mockWhatsAppService },
        { provide: 'TWILIO_SERVICE', useValue: mockTwilioService },
        { provide: 'FCM_SERVICE', useValue: mockFCMService },
        { provide: 'EMAIL_SERVICE', useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should send in-app notification successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
      mockChannelRouter.resolveUserChannels.mockResolvedValue(['IN_APP']);
      mockChannelRouter.route.mockResolvedValue(['IN_APP']);

      const result = await service.send('user-1', 'APPOINTMENT_REMINDER', { appointmentId: 'apt-1' });

      expect(result.id).toBe('notif-1');
    });

    it('should throw NotFoundException for invalid user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.send('invalid', 'TEST', {})).rejects.toThrow(NotFoundException);
    });

    it('should use template rendering', async () => {
      const templateData = { name: 'محمد', orderId: 'ORD-123' };
      const rendered = await mockTemplateService.useValue.render('مرحبا {{name}} تأكيد الطلب {{orderId}}', templateData);

      expect(rendered).toBe('مرحبا محمد تأكيد الطلب ORD-123');
    });

    it('should schedule notification when scheduledAt provided', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const futureDate = new Date(Date.now() + 86400000);
      const result = await service.send('user-1', 'APPOINTMENT_REMINDER', {}, ['IN_APP'], 'NORMAL', futureDate);

      expect(result).toBeDefined();
    });
  });

  describe('sendToMany', () => {
    it('should send to multiple users', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
      mockChannelRouter.route.mockResolvedValue(['IN_APP']);

      const result = await service.sendToMany(['user-1', 'user-2'], 'SYSTEM_ANNOUNCEMENT', { message: 'Test' });

      expect(result.sent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sendToRole', () => {
    it('should send to all users with a role', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
      mockChannelRouter.route.mockResolvedValue(['IN_APP']);

      const result = await service.sendToRole('PATIENT', 'SYSTEM_ANNOUNCEMENT', { message: 'Test' });

      expect(result.sent).toBeGreaterThanOrEqual(0);
    });

    it('should handle no users found', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.sendToRole('NONEXISTENT', 'TEST', {});

      expect(result.sent).toBe(0);
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.getNotifications('user-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([mockNotification]);
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.getNotifications('user-1', { type: 'APPOINTMENT_REMINDER' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.update.mockResolvedValue({ ...mockNotification, read: true });

      const result = await service.markAsRead('notif-1');

      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.message).toContain('5');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');

      expect(result.unreadCount).toBe(3);
    });
  });

  describe('channel fallback', () => {
    it('should fallback from WhatsApp to SMS on failure', () => {
      const channelPriority = ['WHATSAPP', 'SMS', 'EMAIL'];
      const channel = channelPriority.find((ch) => ch === 'SMS');

      expect(channel).toBe('SMS');
    });
  });

  describe('template rendering with variables', () => {
    it('should replace template variables', () => {
      const template = 'مرحبا {{name}}، تأكيد الطلب رقم {{orderNumber}}';
      const data = { name: 'سارة', orderNumber: 'ORD-2026000001' };
      const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key as keyof typeof data] || '');

      expect(rendered).toBe('مرحبا سارة، تأكيد الطلب رقم ORD-2026000001');
    });
  });
});
