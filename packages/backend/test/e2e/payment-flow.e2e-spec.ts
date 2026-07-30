import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/prisma/prisma.service';
import { UserRole, Gender, PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Payment Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testInvoiceId: string;
  let testPaymentId: string;

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
        email: `payment-e2e-${Date.now()}@example.com`,
        phone: '+966501234567',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: UserRole.PATIENT,
        status: 'ACTIVE',
        emailVerified: true,
        profile: { create: { firstNameAr: 'محمد', lastNameAr: 'أحمد', gender: Gender.MALE } },
      },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstNameAr: 'محمد',
        lastNameAr: 'أحمد',
        dateOfBirth: new Date('1990-01-15'),
        gender: Gender.MALE,
        phone: '+966501234567',
        email: user.email,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-PAY-${Date.now()}`,
        patientId: patient.id,
        status: OrderStatus.PENDING,
        subtotal: 500,
        tax: 75,
        total: 575,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-E2E-${Date.now()}`,
        orderId: order.id,
        patientId: patient.id,
        subtotal: 500,
        tax: 75,
        total: 575,
        paidAmount: 0,
        balanceDue: 575,
        status: PaymentStatus.PENDING,
      },
    });
    testInvoiceId = invoice.id;

    const { JwtService } = require('@nestjs/jwt');
    const jwtService = app.get(JwtService);
    authToken = await jwtService.signAsync({ userId: user.id, email: user.email, role: UserRole.PATIENT });
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Create Invoice', () => {
    it('should return invoice details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/payments/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.total).toBe(575);
    });
  });

  describe('Pay via Stripe', () => {
    it('should process Stripe payment (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/pay')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceId: testInvoiceId,
          method: 'CREDIT_CARD',
          amount: 575,
          stripePaymentMethodId: 'pm_test',
        })
        .expect(201);

      testPaymentId = res.body.id || 'pay-e2e-1';
    });
  });

  describe('Wallet Deposit', () => {
    it('should deposit to wallet', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/wallet/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500 })
        .expect(201);

      expect(res.body.balance).toBeDefined();
    });
  });

  describe('Use Wallet Balance', () => {
    it('should pay with wallet', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/wallet/pay')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invoiceId: testInvoiceId, amount: 200 })
        .expect(201);
    });
  });

  describe('Refund', () => {
    it('should process refund', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invoiceId: testInvoiceId, amount: 100, reason: 'Partial refund' })
        .expect(201);
    });
  });

  describe('List Payments', () => {
    it('should list user payments', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });
});
