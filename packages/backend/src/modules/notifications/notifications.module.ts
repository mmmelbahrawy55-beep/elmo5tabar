import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTemplateService } from './template.service';
import { NotificationSchedulerService } from './scheduler.service';
import { NotificationQueueService } from './queue.service';
import { ChannelRouterService } from './channel-router.service';
import { SMSProvider } from '../auth/mfa/sms.provider';
import { EmailProvider } from '../auth/mfa/email.provider';
import { WhatsAppProvider } from './channels/whatsapp.provider';
import { PushNotificationProvider } from './channels/push.provider';
import { VoiceCallProvider } from './channels/voice.provider';
import { InAppService } from './channels/in-app.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationAnalyticsService } from './analytics.service';
import { NotificationPreferenceService } from './preference.service';
import { NotificationAdminService } from './admin.service';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    BullModule.registerQueue({ name: 'email-queue' }),
    BullModule.registerQueue({ name: 'sms-queue' }),
    BullModule.registerQueue({ name: 'whatsapp-queue' }),
    BullModule.registerQueue({ name: 'push-queue' }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, NotificationTemplateService, NotificationSchedulerService,
    NotificationQueueService, ChannelRouterService, SMSProvider, EmailProvider,
    WhatsAppProvider, PushNotificationProvider, VoiceCallProvider, InAppService,
    NotificationGateway, NotificationAnalyticsService, NotificationPreferenceService,
    NotificationAdminService, NotificationsProcessor,
  ],
  exports: [NotificationsService, InAppService, NotificationGateway],
})
export class NotificationsModule {}

