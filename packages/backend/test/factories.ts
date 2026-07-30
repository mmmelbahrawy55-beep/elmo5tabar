import { faker } from '@faker-js/faker';
import {
  UserRole,
  UserStatus,
  Gender,
  BloodType,
  AppointmentStatus,
  OrderStatus,
  ReportStatus,
  PaymentStatus,
  PaymentMethod,
  SampleStatus,
  QueueStatus,
  QueuePriority,
  NotificationType,
  NotificationChannel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const createUserFactory = (overrides: Partial<Prisma.UserCreateInput> = {}): Prisma.UserCreateInput => ({
  email: faker.internet.email().toLowerCase(),
  phone: faker.phone.number('+9665########'),
  passwordHash: bcrypt.hashSync('Test@1234', 10),
  role: UserRole.PATIENT,
  status: UserStatus.ACTIVE,
  emailVerified: true,
  phoneVerified: true,
  twoFactorEnabled: false,
  preferredLanguage: 'ar',
  timezone: 'Asia/Riyadh',
  ...overrides,
});

export const createAppointmentFactory = (overrides: Partial<Prisma.AppointmentCreateInput> = {}): Prisma.AppointmentCreateInput => ({
  scheduledAt: faker.date.future(),
  durationMinutes: 15,
  status: AppointmentStatus.SCHEDULED,
  type: 'LAB_TEST',
  ...overrides,
} as any);

export const createLabTestFactory = (overrides: Partial<Prisma.LabTestCreateInput> = {}): Prisma.LabTestCreateInput => ({
  nameAr: faker.person.fullName(),
  nameEn: faker.person.fullName(),
  code: faker.string.alphanumeric(8).toUpperCase(),
  sampleType: 'BLOOD',
  tubeType: 'SST',
  tubeColor: 'RED',
  fastingRequired: false,
  turnaroundTimeHours: 24,
  price: Number(faker.finance.amount({ min: 50, max: 500 })),
  currency: 'SAR',
  homeCollection: true,
  popular: false,
  isActive: true,
  ...overrides,
});

export const createResultFactory = (overrides: Partial<Prisma.ReportCreateInput> = {}): Prisma.ReportCreateInput => ({
  reportNumber: `RPT-${faker.date.recent().getFullYear()}${String(faker.number.int({ min: 1, max: 999999 })).padStart(6, '0')}`,
  status: ReportStatus.DRAFT,
  version: 1,
  isCritical: false,
  ...overrides,
} as any);

export const createPaymentFactory = (overrides: Partial<Prisma.PaymentCreateInput> = {}): Prisma.PaymentCreateInput => ({
  paymentNumber: `PAY-${faker.date.recent().getFullYear()}${String(faker.number.int({ min: 1, max: 999999 })).padStart(6, '0')}`,
  amount: Number(faker.finance.amount({ min: 50, max: 2000 })),
  currency: 'SAR',
  method: PaymentMethod.CREDIT_CARD,
  status: PaymentStatus.PENDING,
  ...overrides,
} as any);

export const createBranchFactory = (overrides: Partial<Prisma.BranchCreateInput> = {}): Prisma.BranchCreateInput => ({
  nameAr: faker.location.street(),
  nameEn: faker.location.street(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  phone: faker.phone.number('+9665########'),
  addressAr: faker.location.streetAddress(),
  city: faker.location.city(),
  region: faker.location.state(),
  country: 'SA',
  latitude: Number(faker.location.latitude()),
  longitude: Number(faker.location.longitude()),
  timezone: 'Asia/Riyadh',
  isActive: true,
  ...overrides,
});

export const createDepartmentFactory = (overrides: Partial<Prisma.DepartmentCreateInput> = {}): Prisma.DepartmentCreateInput => ({
  nameAr: faker.person.jobTitle(),
  nameEn: faker.person.jobTitle(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  isActive: true,
  ...overrides,
});

export const createNotificationFactory = (overrides: Partial<Prisma.NotificationCreateInput> = {}): Prisma.NotificationCreateInput => ({
  type: NotificationType.IN_APP,
  channel: NotificationChannel.SYSTEM_ANNOUNCEMENT,
  title: faker.lorem.sentence(),
  titleAr: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
  bodyAr: faker.lorem.paragraph(),
  read: false,
  ...overrides,
} as any);

export const createAuditLogFactory = (overrides: Partial<Prisma.AuditLogCreateInput> = {}): Prisma.AuditLogCreateInput => ({
  action: 'CREATE',
  entity: 'users',
  entityId: faker.string.uuid(),
  severity: 'info',
  ...overrides,
} as any);

export const createBlogPostFactory = (overrides: Partial<Prisma.BlogPostCreateInput> = {}): Prisma.BlogPostCreateInput => ({
  slug: faker.helpers.slugify(faker.lorem.sentence()),
  contentType: 'article',
  titleAr: faker.lorem.sentence(),
  titleEn: faker.lorem.sentence(),
  contentAr: faker.lorem.paragraphs(3),
  contentEn: faker.lorem.paragraphs(3),
  status: 'draft',
  locale: 'both',
  allowComments: true,
  ...overrides,
} as any);

export const createCouponFactory = (overrides: Partial<Prisma.CouponCreateInput> = {}): Prisma.CouponCreateInput => ({
  code: faker.string.alphanumeric(10).toUpperCase(),
  type: 'percentage',
  value: Number(faker.finance.amount({ min: 5, max: 50 })),
  minOrder: 0,
  maxUses: -1,
  validFrom: faker.date.past(),
  validTo: faker.date.future(),
  isActive: true,
  applicableTo: 'all',
  applicableIds: [],
  ...overrides,
});

export const createGiftCardFactory = (overrides: Record<string, any> = {}): Record<string, any> => ({
  code: faker.string.alphanumeric(16).toUpperCase(),
  amount: Number(faker.finance.amount({ min: 50, max: 1000 })),
  currency: 'SAR',
  balance: Number(faker.finance.amount({ min: 50, max: 1000 })),
  isActive: true,
  expiresAt: faker.date.future(),
  ...overrides,
});

export const createSubscriptionFactory = (overrides: Record<string, any> = {}): Record<string, any> => ({
  planId: faker.string.uuid(),
  planName: faker.helpers.arrayElement(['Basic', 'Premium', 'Enterprise']),
  status: 'ACTIVE',
  amount: Number(faker.finance.amount({ min: 99, max: 999 })),
  currency: 'SAR',
  interval: 'monthly',
  currentPeriodStart: faker.date.past(),
  currentPeriodEnd: faker.date.future(),
  ...overrides,
});

export const createWalletTransactionFactory = (overrides: Record<string, any> = {}): Record<string, any> => ({
  amount: Number(faker.finance.amount({ min: 10, max: 5000 })),
  type: faker.helpers.arrayElement(['CREDIT', 'DEBIT']),
  description: faker.finance.transactionDescription(),
  currency: 'SAR',
  ...overrides,
});

export const createSecurityEventFactory = (overrides: Record<string, any> = {}): Record<string, any> => ({
  eventType: faker.helpers.arrayElement(['LOGIN_FAILURE', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED']),
  severity: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  sourceIp: faker.internet.ip(),
  description: faker.lorem.sentence(),
  metadata: {},
  ...overrides,
});
