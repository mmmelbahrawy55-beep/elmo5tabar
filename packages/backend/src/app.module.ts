import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { redisStore } from 'cache-manager-redis-store';

// AI Assistant module
import { AiModule } from './modules/ai/ai.module';
import { CmsModule } from './modules/cms/cms.module';

// Existing feature modules
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { TestsModule } from './modules/tests/tests.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';
import { ResultsModule } from './modules/results/results.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PackagesModule } from './modules/packages/packages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { AuditModule } from './modules/audit/audit.module';

// Auth/Security modules
import { AuthModule } from './modules/auth/auth.module';
import { MFAModule } from './modules/auth/mfa/mfa.module';
import { DevicesModule } from './modules/auth/devices/devices.module';
import { RBACModule } from './modules/auth/rbac/rbac.module';
import { OAuthModule } from './modules/auth/oauth/oauth.module';
import { SecurityModule } from './modules/security/security.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

// Infrastructure
import { PrismaModule } from './lib/prisma/prisma.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    // Caching with Redis
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', ''),
          db: config.get<number>('REDIS_DB', 0),
          ttl: config.get<number>('CACHE_TTL', 600),
        }),
      }),
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Static file serving
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // Auth infrastructure
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),

    // Database
    PrismaModule,

    // Auth/Security/Compliance modules
    AuthModule,
    MFAModule,
    DevicesModule,
    RBACModule,
    OAuthModule,
    SecurityModule,
    ComplianceModule,

    // Feature modules
    PatientsModule,
    DoctorsModule,
    DepartmentsModule,
    BranchesModule,
    TestsModule,
    AppointmentsModule,
    QueueModule,
    ResultsModule,
    PaymentsModule,
    PackagesModule,
    NotificationsModule,
    DashboardModule,
    ReportsModule,
    InsuranceModule,
    AuditModule,
    AiModule,
    CmsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}
