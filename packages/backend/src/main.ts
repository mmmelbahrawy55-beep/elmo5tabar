import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Security: Helmet with comprehensive options
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // Compression
  app.use(compression());

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');
  const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-Request-ID',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Al Mokhtabar Laboratory API')
    .setDescription(
      'Al Mokhtabar Laboratory Backend API - مختبر المحتبر API الخلفي\n\n' +
        'Comprehensive laboratory management system for appointments, patients, doctors, ' +
        'results, and billing.\n\n' +
        'نظام إدارة مختبر شامل للمواعيد والمرضى والأطباء والنتائج والفواتير.',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints - نقاط المصادقة')
    .addTag('MFA', 'Multi-factor authentication - المصادقة متعددة العوامل')
    .addTag('Devices', 'Device management - إدارة الأجهزة')
    .addTag('RBAC', 'Role-based access control - التحكم بالوصول القائم على الأدوار')
    .addTag('OAuth', 'Social authentication - مصادقة اجتماعية')
    .addTag('Security', 'Security management - إدارة الأمان')
    .addTag('Compliance', 'Compliance management - إدارة الامتثال')
    .addTag('Patients', 'Patient management - إدارة المرضى')
    .addTag('Doctors', 'Doctor management - إدارة الأطباء')
    .addTag('Departments', 'Department management - إدارة الأقسام')
    .addTag('Appointments', 'Appointment management - إدارة المواعيد')
    .addTag('Queue', 'Queue management - إدارة الطابور')
    .addTag('Results', 'Lab results management - إدارة نتائج المختبر')
    .addTag('Payments', 'Payment management - إدارة المدفوعات')
    .addTag('Branches', 'Branch management - إدارة الفروع')
    .addTag('Tests', 'Test management - إدارة التحاليل')
    .addTag('Packages', 'Package management - إدارة الباقات')
    .addTag('Notifications', 'Notification management - إدارة الإشعارات')
    .addTag('Dashboard', 'Dashboard analytics - لوحة التحكم')
    .addTag('Reports', 'Reports - التقارير')
    .addTag('Insurance', 'Insurance management - إدارة التأمين')
    .addTag('Audit', 'Audit logs - سجلات التدقيق')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Al Mokhtabar Laboratory API',
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://0.0.0.0:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

// Uncaught exception handlers
process.on('uncaughtException', (error) => {
  const logger = new Logger('UncaughtException');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('UnhandledRejection');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown on signals
process.on('SIGTERM', () => {
  const logger = new Logger('SIGTERM');
  logger.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  const logger = new Logger('SIGINT');
  logger.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
