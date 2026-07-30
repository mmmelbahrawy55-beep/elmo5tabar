import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/prisma/prisma.service';
import { UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Notification Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testNotificationId: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    const user = await prisma.user.create({
      data: {
        email: `notif-e2e-${Date.now()}@example.com`,
        phone: '+966501234567',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: UserRole.PATIENT,
        status: 'ACTIVE',
        emailVerified: true,
        profile: { create: { firstNameAr: 'محمد', lastNameAr: 'أحمد', gender: Gender.MALE } },
      },
    });
    testUserId = user.id;

    const { JwtService } = require('@nestjs/jwt');
    const jwtService = app.get(JwtService);
    authToken = await jwtService.signAsync({ userId: user.id, email: user.email, role: UserRole.PATIENT });
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Send Notification', () => {
    it('should send a notification (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          type: 'SYSTEM_ANNOUNCEMENT',
          data: { titleAr: 'مرحباً', titleEn: 'Welcome', bodyAr: 'أهلاً بك', bodyEn: 'Welcome to the lab' },
          channels: ['IN_APP', 'EMAIL'],
        })
        .expect(201);

      testNotificationId = res.body.id || 'notif-e2e-1';
    });
  });

  describe('List Notifications', () => {
    it('should list notifications for user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('Mark as Read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (res.body.data?.length > 0) {
        const notifId = res.body.data[0].id;
        await request(app.getHttpServer())
          .patch(`/api/v1/notifications/${notifId}/read`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });
  });

  describe('Delivery Status', () => {
    it('should check unread count', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/notifications/unread')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Notification Stats', () => {
    it('should get notification statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.total).toBeDefined();
      expect(res.body.unread).toBeDefined();
    });
  });

  describe('Channel Fallback', () => {
    it('should configure channel preferences', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: true, sms: true, push: false, whatsapp: true })
        .expect(200);
    });
  });
});
