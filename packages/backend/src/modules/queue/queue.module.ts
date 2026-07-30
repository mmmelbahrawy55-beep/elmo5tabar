import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueController } from './controllers/queue.controller';
import { QueueService } from './services/queue.service';
import { QueueGateway } from './gateway/queue.gateway';

@Module({
  imports: [PrismaModule, CacheModule, forwardRef(() => NotificationsModule)],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
