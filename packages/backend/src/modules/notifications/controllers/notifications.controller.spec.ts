import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '../notifications.service';
import { NotificationPreferenceService } from '../preference.service';
import { NotificationTemplateService } from '../template.service';
import { NotificationAnalyticsService } from '../analytics.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    getUnreadCount: jest.fn().mockResolvedValue({ count: 5 }),
    getStats: jest.fn().mockResolvedValue({ total: 50, unread: 5 }),
    getNotificationHistory: jest.fn().mockResolvedValue({ history: [] }),
    markAsRead: jest.fn().mockResolvedValue({ id: 'notif-1', readAt: new Date() }),
    markAllAsRead: jest.fn().mockResolvedValue({ message: 'All notifications marked as read' }),
    delete: jest.fn().mockResolvedValue({ message: 'Notification deleted' }),
    findOne: jest.fn().mockResolvedValue({ id: 'notif-1', type: 'SYSTEM_ANNOUNCEMENT' }),
    send: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    sendBulk: jest.fn().mockResolvedValue({ sent: 10, failed: 0 }),
    sendToRole: jest.fn().mockResolvedValue({ sent: 5 }),
    createCampaign: jest.fn().mockResolvedValue({ id: 'camp-1' }),
    testChannel: jest.fn().mockResolvedValue({ success: true }),
    updateChannelConfig: jest.fn().mockResolvedValue({ success: true }),
    bulkRetry: jest.fn().mockResolvedValue({ retried: 3, failed: 0 }),
    getScheduledNotifications: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  };

  const mockPreferenceService = {
    getPreferences: jest.fn().mockResolvedValue({ email: true, sms: true, push: false }),
    updateBulkPreferences: jest.fn().mockResolvedValue({ updated: true }),
    updatePreference: jest.fn().mockResolvedValue({ channel: 'email', type: 'APPOINTMENT', enabled: true }),
    setQuietHours: jest.fn().mockResolvedValue({ channel: 'email', start: '22:00', end: '08:00' }),
    setMaxPerDay: jest.fn().mockResolvedValue({ channel: 'email', max: 10 }),
  };

  const mockTemplateService = {
    createTemplate: jest.fn().mockResolvedValue({ id: 'tmpl-1' }),
    getTemplates: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getTemplate: jest.fn().mockResolvedValue({ id: 'tmpl-1' }),
    updateTemplate: jest.fn().mockResolvedValue({ id: 'tmpl-1' }),
    deleteTemplate: jest.fn().mockResolvedValue({ message: 'Template deleted' }),
    testTemplate: jest.fn().mockResolvedValue({ rendered: 'Hello {{name}}' }),
  };

  const mockAnalyticsService = {
    getDashboard: jest.fn().mockResolvedValue({ totalSent: 1000, deliveryRate: 95 }),
    getChannelStats: jest.fn().mockResolvedValue({ email: { sent: 500 }, sms: { sent: 300 } }),
    getDeliveryReport: jest.fn().mockResolvedValue({ delivered: 950, failed: 50 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationPreferenceService, useValue: mockPreferenceService },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: NotificationAnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get(NotificationsController);
    jest.clearAllMocks();
  });

  it('should GET /notifications', async () => {
    const result = await controller.findAll('user-1', { page: 1, limit: 20 });
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/unread-count', async () => {
    const result = await controller.getUnreadCount('user-1');
    expect(result.success).toBe(true);
    expect(result.data.count).toBe(5);
  });

  it('should GET /notifications/stats', async () => {
    const result = await controller.getStats('user-1');
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/history', async () => {
    const result = await controller.getHistory('user-1', {});
    expect(result.success).toBe(true);
  });

  it('should PATCH /notifications/:id/read', async () => {
    const result = await controller.markAsRead('notif-1');
    expect(result.success).toBe(true);
  });

  it('should PATCH /notifications/read-all', async () => {
    const result = await controller.markAllAsRead('user-1');
    expect(result.success).toBe(true);
  });

  it('should DELETE /notifications/:id', async () => {
    const result = await controller.delete('notif-1');
    expect(result.success).toBe(true);
  });

  it('should POST /notifications/:id/resend', async () => {
    const result = await controller.resend('notif-1');
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/:id', async () => {
    const result = await controller.findOne('notif-1');
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/preferences', async () => {
    const result = await controller.getPreferences('user-1');
    expect(result.success).toBe(true);
  });

  it('should PUT /notifications/preferences', async () => {
    const result = await controller.updatePreferences('user-1', [{ channel: 'email', type: 'APPOINTMENT', enabled: true }]);
    expect(result.success).toBe(true);
  });

  it('should PUT /notifications/preferences/:channel/:type', async () => {
    const result = await controller.updateSinglePreference('user-1', 'email', 'APPOINTMENT', true);
    expect(result.success).toBe(true);
  });

  it('should PUT /notifications/preferences/quiet-hours', async () => {
    const result = await controller.setQuietHours('user-1', { channel: 'email', start: '22:00', end: '08:00' });
    expect(result.success).toBe(true);
  });

  it('should PUT /notifications/preferences/max-per-day', async () => {
    const result = await controller.setMaxPerDay('user-1', { channel: 'email', max: 10 });
    expect(result.success).toBe(true);
  });

  it('should POST /notifications/send', async () => {
    const result = await controller.send({ userId: 'user-1', type: 'SYSTEM_ANNOUNCEMENT', data: {}, channels: ['IN_APP', 'EMAIL'] });
    expect(result.success).toBe(true);
  });

  it('should POST /notifications/send-bulk', async () => {
    const result = await controller.sendBulk({ userIds: ['u1', 'u2'], type: 'APPOINTMENT_REMINDER', data: {} });
    expect(result.success).toBe(true);
  });

  it('should POST /notifications/send-to-role', async () => {
    const result = await controller.sendToRole({ role: 'PATIENT', type: 'APPOINTMENT_REMINDER', data: {} });
    expect(result.success).toBe(true);
  });

  it('should POST /notifications/campaigns', async () => {
    const result = await controller.createCampaign({ name: 'Campaign 1', type: 'PROMOTIONAL', content: {} });
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/analytics/dashboard', async () => {
    const result = await controller.getAnalyticsDashboard(30);
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/analytics/channel-stats', async () => {
    const result = await controller.getChannelStats();
    expect(result.success).toBe(true);
  });

  it('should GET /notifications/analytics/delivery-report', async () => {
    const result = await controller.getDeliveryReport('2025-01-01', '2025-01-31');
    expect(result.success).toBe(true);
  });

  it('should CRUD templates', async () => {
    let result = await controller.createTemplate({ name: 'Welcome', type: 'SYSTEM', channels: ['EMAIL'], subjectAr: 'مرحباً', bodyAr: 'مرحباً بك' });
    expect(result.success).toBe(true);
    result = await controller.getTemplates({});
    expect(result.success).toBe(true);
    result = await controller.getTemplate('tmpl-1');
    expect(result.success).toBe(true);
    result = await controller.updateTemplate('tmpl-1', { name: 'Updated' });
    expect(result.success).toBe(true);
    result = await controller.deleteTemplate('tmpl-1');
    expect(result.success).toBe(true);
    result = await controller.testTemplate({ templateId: 'tmpl-1', variables: { name: 'Ahmed' } });
    expect(result.success).toBe(true);
  });
});
