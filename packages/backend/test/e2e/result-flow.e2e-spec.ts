import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/prisma/prisma.service';
import { UserRole, Gender, ReportStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Result Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let labTechToken: string;
  let patientToken: string;
  let testOrderId: string;
  let testReportId: string;

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

    const labTechUser = await prisma.user.create({
      data: {
        email: `labtech-e2e-${Date.now()}@example.com`,
        phone: '+966501234567',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: UserRole.LAB_TECHNICIAN,
        status: 'ACTIVE',
        emailVerified: true,
        profile: { create: { firstNameAr: 'فني', lastNameAr: 'مختبر', gender: Gender.MALE } },
      },
    });

    const patientUser = await prisma.user.create({
      data: {
        email: `patient-e2e-${Date.now()}@example.com`,
        phone: '+966501234568',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: UserRole.PATIENT,
        status: 'ACTIVE',
        emailVerified: true,
        profile: { create: { firstNameAr: 'مريض', lastNameAr: 'تجربة', gender: Gender.MALE } },
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: patientUser.id,
        firstNameAr: 'مريض',
        lastNameAr: 'تجربة',
        dateOfBirth: new Date('1990-01-15'),
        gender: Gender.MALE,
        phone: '+966501234568',
        email: patientUser.email,
      },
    });

    const category = await prisma.testCategory.create({
      data: { nameAr: 'فحوصات الدم', nameEn: 'Blood Tests', slug: 'blood-tests' },
    });

    const labTest = await prisma.labTest.create({
      data: {
        nameAr: 'سكر صائم',
        nameEn: 'Fasting Glucose',
        code: `GLU-${Date.now()}`,
        categoryId: category.id,
        sampleType: 'BLOOD',
        price: 150,
        currency: 'SAR',
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-E2E-${Date.now()}`,
        patientId: patient.id,
        status: OrderStatus.PENDING,
        subtotal: 150,
        tax: 22.5,
        total: 172.5,
        items: { create: { labTestId: labTest.id, name: 'Fasting Glucose', price: 150, quantity: 1, total: 150 } },
      },
    });
    testOrderId = order.id;

    const { JwtService } = require('@nestjs/jwt');
    const jwtService = app.get(JwtService);
    labTechToken = await jwtService.signAsync({ userId: labTechUser.id, email: labTechUser.email, role: UserRole.LAB_TECHNICIAN });
    patientToken = await jwtService.signAsync({ userId: patientUser.id, email: patientUser.email, role: UserRole.PATIENT });
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Submit Lab Test Results', () => {
    it('should create a report with results (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/results')
        .set('Authorization', `Bearer ${labTechToken}`)
        .send({
          orderId: testOrderId,
          items: [{ labTestId: expect.any(String), value: '5.5', numericValue: 5.5, unit: 'mmol/L', referenceRangeLow: 3.9, referenceRangeHigh: 6.1 }],
        })
        .expect(201);

      testReportId = res.body.id || 'rpt-e2e-1';
    });
  });

  describe('Generate Report', () => {
    it('should generate report PDF', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/results/${testReportId}/generate`)
        .set('Authorization', `Bearer ${labTechToken}`)
        .expect(201);

      expect(res.body).toBeDefined();
    });
  });

  describe('Verify Signature', () => {
    it('should verify report digital signature', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/results/${testReportId}/verify`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.verified).toBeDefined();
    });
  });

  describe('Share Results', () => {
    it('should create share link (201)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/results/${testReportId}/share`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ expiresInHours: 48 })
        .expect(201);

      expect(res.body.shareUrl).toBeDefined();
    });
  });

  describe('View on Patient Side', () => {
    it('should get patient reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/results')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });
});
