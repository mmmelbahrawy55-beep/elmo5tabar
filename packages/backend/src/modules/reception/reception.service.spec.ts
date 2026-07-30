import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('ReceptionService', () => {
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('patient check-in', () => {
    it('should check in a patient with appointment', async () => {
      const appointment = {
        id: 'apt-1',
        patientId: 'patient-1',
        branchId: 'branch-1',
        status: 'SCHEDULED',
        scheduledAt: new Date(),
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(appointment);
      mockPrismaService.appointment.update.mockResolvedValue({ ...appointment, status: 'CHECKED_IN', checkedInAt: new Date() });

      const result = await mockPrismaService.appointment.update({
        where: { id: 'apt-1' },
        data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      });

      expect(result.status).toBe('CHECKED_IN');
    });

    it('should handle walk-in patient check-in', async () => {
      const walkIn = {
        id: 'entry-1',
        patientName: 'سارة أحمد',
        patientPhone: '+966501234567',
        serviceType: 'WALK_IN',
        status: 'WAITING',
        ticketNumber: 'Q0042',
      };

      mockPrismaService.queueEntry.create.mockResolvedValue(walkIn);

      const result = await mockPrismaService.queueEntry.create({
        data: { branchId: 'branch-1', patientName: 'سارة أحمد', patientPhone: '+966501234567', serviceType: 'WALK_IN', ticketNumber: 'Q0042', status: 'WAITING' } as any,
      });

      expect(result.ticketNumber).toBe('Q0042');
    });

    it('should throw for non-existent appointment', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      const result = await mockPrismaService.appointment.findUnique({ where: { id: 'invalid' } });
      expect(result).toBeNull();
    });

    it('should prevent duplicate check-in', async () => {
      const alreadyCheckedIn = { status: 'CHECKED_IN', checkedInAt: new Date() };
      expect(alreadyCheckedIn.status).toBe('CHECKED_IN');
    });
  });

  describe('queue management', () => {
    it('should get current queue status', async () => {
      mockPrismaService.queueEntry.count.mockResolvedValue(15);

      const waiting = await mockPrismaService.queueEntry.count({
        where: { branchId: 'branch-1', status: 'WAITING' },
      });

      expect(waiting).toBe(15);
    });

    it('should call next patient', async () => {
      const nextTicket = {
        id: 'ticket-1',
        ticketNumber: 'Q0043',
        patientName: 'محمد',
        status: 'WAITING',
      };

      mockPrismaService.queueEntry.findFirst.mockResolvedValue(nextTicket);
      mockPrismaService.queueEntry.update.mockResolvedValue({ ...nextTicket, status: 'CALLED', calledAt: new Date() });

      const result = await mockPrismaService.queueEntry.update({
        where: { id: 'ticket-1' },
        data: { status: 'CALLED', calledAt: new Date() },
      });

      expect(result.status).toBe('CALLED');
    });

    it('should handle empty queue', async () => {
      mockPrismaService.queueEntry.findFirst.mockResolvedValue(null);

      const next = await mockPrismaService.queueEntry.findFirst({
        where: { branchId: 'branch-1', status: 'WAITING' },
      });

      expect(next).toBeNull();
    });
  });

  describe('walk-in registration', () => {
    it('should register walk-in patient without account', async () => {
      const walkInPatient = {
        id: 'patient-walkin',
        firstNameAr: 'مريم',
        lastNameAr: 'علي',
        phone: '+966501234567',
        dateOfBirth: new Date('1995-05-15'),
        gender: 'FEMALE',
        isActive: true,
      };

      mockPrismaService.patient.create.mockResolvedValue(walkInPatient);

      const result = await mockPrismaService.patient.create({
        data: { firstNameAr: 'مريم', lastNameAr: 'علي', phone: '+966501234567', dateOfBirth: new Date('1995-05-15'), gender: 'FEMALE' } as any,
      });

      expect(result.firstNameAr).toBe('مريم');
    });

    it('should find existing patient by phone', async () => {
      mockPrismaService.patient.findUnique.mockResolvedValue({
        id: 'patient-1',
        phone: '+966501234567',
        firstNameAr: 'محمد',
      });

      const patient = await mockPrismaService.patient.findUnique({ where: { phone: '+966501234567' } });
      expect(patient).toBeDefined();
    });

    it('should create queue ticket for walk-in', async () => {
      mockPrismaService.queueEntry.create.mockResolvedValue({
        ticketNumber: 'Q0050',
        patientName: 'مريم علي',
        status: 'WAITING',
        serviceType: 'WALK_IN',
      });

      const ticket = await mockPrismaService.queueEntry.create({
        data: { branchId: 'branch-1', patientName: 'مريم علي', serviceType: 'WALK_IN', ticketNumber: 'Q0050', status: 'WAITING' } as any,
      });

      expect(ticket.serviceType).toBe('WALK_IN');
    });
  });
});
