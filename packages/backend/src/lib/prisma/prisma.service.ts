import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    // Prisma 5.x doesn't expose $modelNames; use manual cleanup
    const tables = [
      'AuditLog', 'ActivityLog', 'SystemLog', 'Notification', 'SmsLog', 'EmailLog', 'WhatsAppLog',
      'ReportItem', 'Report', 'Sample', 'SampleTrackingEvent', 'OrderItem', 'Order',
      'Appointment', 'QueueEntry', 'InsuranceVerification', 'InsuranceClaim',
      'InsurancePolicy', 'Payment', 'Refund', 'Invoice', 'MedicalHistory',
      'DoctorSchedule', 'EmployeeProfile', 'PhlebotomistProfile', 'DoctorProfile',
      'Patient', 'RolePermission', 'RefreshToken', 'Session', 'Device',
    ];
    for (const table of tables) {
      try { await (this as any)[table].deleteMany(); } catch { /* skip */ }
    }
  }
}
