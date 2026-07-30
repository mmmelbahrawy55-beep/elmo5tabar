import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/lib/prisma/prisma.service';
import { UserRole, UserStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export async function getAuthToken(app: INestApplication, user: { id: string; email: string; role: UserRole }): Promise<string> {
  const jwtService = app.get(JwtService);
  return jwtService.signAsync({ userId: user.id, email: user.email, role: user.role }, { expiresIn: '15m' });
}

export async function getRefreshToken(app: INestApplication, user: { id: string; email: string; role: UserRole }): Promise<string> {
  const jwtService = app.get(JwtService);
  return jwtService.signAsync(
    { userId: user.id, email: user.email, role: user.role },
    { secret: process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret', expiresIn: '7d' },
  );
}

export async function createTestUser(
  prisma: PrismaService,
  overrides: { role?: UserRole; email?: string; status?: UserStatus } = {},
) {
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash('Test@1234', 10);

  return prisma.user.create({
    data: {
      email,
      phone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash,
      role: overrides.role || UserRole.PATIENT,
      status: overrides.status || UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          firstNameAr: 'محمد',
          lastNameAr: 'أحمد',
          firstNameEn: 'Mohammed',
          lastNameEn: 'Ahmed',
          gender: Gender.MALE,
        },
      },
    },
    include: { profile: true },
  });
}

export async function createTestPatient(prisma: PrismaService) {
  const user = await createTestUser(prisma);
  return prisma.patient.create({
    data: {
      userId: user.id,
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      firstNameEn: 'Mohammed',
      lastNameEn: 'Ahmed',
      dateOfBirth: new Date('1990-01-15'),
      gender: Gender.MALE,
      phone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: user.email,
      isActive: true,
    },
    include: { user: { include: { profile: true } } },
  });
}

export async function createTestDoctor(prisma: PrismaService, departmentId?: string) {
  const user = await createTestUser(prisma, { role: UserRole.DOCTOR });
  return prisma.doctorProfile.create({
    data: {
      userId: user.id,
      licenseNumber: `LIC-${Date.now()}`,
      specialtyAr: 'طب عام',
      specialtyEn: 'General Medicine',
      departmentId: departmentId || undefined,
      consultationFee: 200,
      acceptingPatients: true,
    },
    include: { user: { include: { profile: true } } },
  });
}

export function buildHeaders(token: string): Record<string, [string, string]> {
  return { Authorization: [`Bearer ${token}`] as [string, string] } as any;
}

export function expectPaginatedResponse(res: request.Response): void {
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('meta');
  expect(res.body.meta).toHaveProperty('total');
  expect(res.body.meta).toHaveProperty('page');
  expect(res.body.meta).toHaveProperty('limit');
  expect(res.body.meta).toHaveProperty('totalPages');
}

export function expectSuccessResponse(res: request.Response): void {
  expect(res.status).toBeLessThan(400);
  expect(res.body).toBeDefined();
}

export async function waitForQueue(queue: any): Promise<void> {
  let count = await queue.getWaitingCount();
  let attempts = 0;
  while (count > 0 && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    count = await queue.getWaitingCount();
    attempts++;
  }
}
