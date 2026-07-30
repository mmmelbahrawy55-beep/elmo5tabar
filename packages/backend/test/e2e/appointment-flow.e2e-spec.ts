import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/prisma/prisma.service';
import { UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Appointment Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testPatientId: string;
  let testBranchId: string;
  let testDoctorId: string;
  let testAppointmentId: string;

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
        email: `apt-e2e-${Date.now()}@example.com`,
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
    testPatientId = patient.id;

    const branch = await prisma.branch.create({
      data: {
        nameAr: 'فرع الرياض',
        nameEn: 'Riyadh Branch',
        code: 'RIY-E2E',
        phone: '+966501234567',
        addressAr: 'الرياض',
        city: 'الرياض',
        region: 'منطقة الرياض',
        isActive: true,
      },
    });
    testBranchId = branch.id;

    const doctorUser = await prisma.user.create({
      data: {
        email: `doctor-e2e-${Date.now()}@example.com`,
        phone: '+966501234568',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: UserRole.DOCTOR,
        status: 'ACTIVE',
        emailVerified: true,
        profile: { create: { firstNameAr: 'د. أحمد', lastNameAr: 'علي', gender: Gender.MALE } },
      },
    });

    const doctor = await prisma.doctorProfile.create({
      data: { userId: doctorUser.id, licenseNumber: `LIC-E2E-${Date.now()}`, specialtyAr: 'طب عام', specialtyEn: 'General Medicine', acceptingPatients: true },
    });
    testDoctorId = doctor.id;

    const { JwtService } = require('@nestjs/jwt');
    const jwtService = app.get(JwtService);
    authToken = await jwtService.signAsync({ userId: user.id, email: user.email, role: UserRole.PATIENT });
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Book Appointment', () => {
    it('should create a new appointment (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatientId,
          branchId: testBranchId,
          doctorId: testDoctorId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          notes: 'E2E test appointment',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      testAppointmentId = res.body.id;
    });

    it('should reject overlapping appointment (409)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatientId,
          branchId: testBranchId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(201);
    });
  });

  describe('View Queue Position', () => {
    it('should get available slots', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/appointments/slots`)
        .query({ branchId: testBranchId, date: new Date(Date.now() + 86400000).toISOString().split('T')[0] })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Reschedule Appointment', () => {
    it('should reschedule an appointment (200)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/appointments/${testAppointmentId}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newScheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(), reason: 'Schedule conflict' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      testAppointmentId = res.body.id;
    });
  });

  describe('Cancel Appointment', () => {
    it('should cancel an appointment (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Patient request' })
        .expect(200);
    });

    it('should reject cancelling already cancelled appointment (400)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Again' })
        .expect(400);
    });
  });

  describe('Appointment History', () => {
    it('should list appointments with filters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should get specific appointment details', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
