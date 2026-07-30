import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { QueueModule } from '../queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentGateway } from './gateway/appointment.gateway';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    forwardRef(() => QueueModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentGateway],
  exports: [AppointmentsService, AppointmentGateway],
})
export class AppointmentsModule {}
