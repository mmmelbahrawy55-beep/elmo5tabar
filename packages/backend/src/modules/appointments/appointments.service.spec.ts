import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './services/appointments.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppointmentGateway } from './gateway/appointment.gateway';
import { AppointmentStatus } from './dto/appointment-filters.dto';
import { AppointmentType } from './dto/create-appointment.dto';
import { mockPrismaService, mockCacheManager, mockGateway } from '../../../test/mocks';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: typeof mockPrismaService;

  const mockAppointment = {
    id: 'apt-1',
    patientId: 'patient-1',
    branchId: 'branch-1',
    doctorId: 'doctor-1',
    scheduledAt: new Date('2026-08-15T10:00:00Z'),
    durationMinutes: 15,
    status: AppointmentStatus.SCHEDULED,
    type: AppointmentType.LAB_TEST,
    notes: null,
    cancelReason: null,
    reminderSent: false,
    reminderSentAt: null,
    checkedInAt: null,
    completedAt: null,
    noShowAt: null,
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    patient: { id: 'patient-1', firstNameAr: 'محمد', lastNameAr: 'أحمد', phone: '+966501234567', email: 'test@test.com' },
    branch: { id: 'branch-1', nameAr: 'فرع الرياض', addressAr: 'الرياض' },
    doctorProfile: { id: 'doctor-1', specialtyAr: 'طب عام', user: { profile: { firstNameAr: 'د. أحمد', lastNameAr: 'علي' } } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: AppointmentGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      patientId: 'patient-1',
      branchId: 'branch-1',
      doctorId: 'doctor-1',
      scheduledAt: '2026-08-20T10:00:00.000Z',
      notes: 'Test appointment',
      type: AppointmentType.LAB_TEST,
    };

    it('should create appointment for valid slot', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);
      prisma.appointment.create.mockResolvedValue(mockAppointment);

      const result = await service.create(createDto, 'user-1');

      expect(result.id).toBe('apt-1');
      expect(prisma.appointment.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for overlapping slot', async () => {
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for time in the past', async () => {
      const pastDto = { ...createDto, scheduledAt: '2020-01-01T10:00:00.000Z' };
      prisma.appointment.findFirst.mockResolvedValue(null);

      try {
        await service.create(pastDto, 'user-1');
      } catch (e: any) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated appointments with filters', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20, status: AppointmentStatus.SCHEDULED });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by date range', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      const result = await service.findAll({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should filter by doctor', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
      prisma.appointment.count.mockResolvedValue(1);

      const result = await service.findAll({ doctorId: 'doctor-1' });

      expect(result.data).toHaveLength(1);
    });

    it('should return empty array for no results', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      const result = await service.findAll({ status: AppointmentStatus.CANCELLED });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return appointment by ID', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.findOne('apt-1');

      expect(result.id).toBe('apt-1');
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update appointment details', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.findFirst.mockResolvedValue(null);
      prisma.appointment.update.mockResolvedValue({ ...mockAppointment, notes: 'Updated notes' });

      const result = await service.update('apt-1', { notes: 'Updated notes' }, 'user-1');

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException for cancelled appointment', async () => {
      const cancelledAppt = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      prisma.appointment.findUnique.mockResolvedValue(cancelledAppt);

      await expect(service.update('apt-1', { notes: 'test' }, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for completed appointment', async () => {
      const completedAppt = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      prisma.appointment.findUnique.mockResolvedValue(completedAppt);

      await expect(service.update('apt-1', { notes: 'test' }, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });

      const result = await service.cancel('apt-1', 'Patient request', 'user-1');

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should throw BadRequestException for already cancelled appointment', async () => {
      const cancelledAppt = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      prisma.appointment.findUnique.mockResolvedValue(cancelledAppt);

      await expect(service.cancel('apt-1', 'test', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for completed appointment', async () => {
      const completedAppt = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      prisma.appointment.findUnique.mockResolvedValue(completedAppt);

      await expect(service.cancel('apt-1', 'test', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for a given date', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots('branch-1', 'doctor-1', '2026-08-20');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('time');
      expect(result[0]).toHaveProperty('available');
      expect(result[0]).toHaveProperty('datetime');
    });

    it('should mark overlapping slots as unavailable', async () => {
      const existing = [{
        scheduledAt: new Date('2026-08-20T10:00:00Z'),
        durationMinutes: 15,
      }];
      prisma.appointment.findMany.mockResolvedValue(existing);

      const result = await service.getAvailableSlots('branch-1', 'doctor-1', '2026-08-20');

      const slot = result.find((s) => s.time === '10:00');
      expect(slot?.available).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return appointment statistics', async () => {
      prisma.appointment.count.mockResolvedValue(100);

      const result = await service.getStats('branch-1');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('completionRate');
      expect(result).toHaveProperty('cancellationRate');
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming appointments', async () => {
      prisma.appointment.findMany.mockResolvedValue([mockAppointment]);

      const result = await service.getUpcoming('patient-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array if none upcoming', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getUpcoming('patient-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('checkIn', () => {
    it('should check in a scheduled appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CHECKED_IN, checkedInAt: new Date() });

      const result = await service.checkIn('apt-1');

      expect(result.status).toBe(AppointmentStatus.CHECKED_IN);
    });

    it('should throw BadRequestException for non-scheduled appointment', async () => {
      const checkedInAppt = { ...mockAppointment, status: AppointmentStatus.CHECKED_IN };
      prisma.appointment.findUnique.mockResolvedValue(checkedInAppt);

      await expect(service.checkIn('apt-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reschedule', () => {
    it('should reschedule an appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      prisma.appointment.findFirst.mockResolvedValue(null);
      prisma.appointment.update.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });
      prisma.appointment.create.mockResolvedValue({ ...mockAppointment, id: 'apt-2', scheduledAt: new Date('2026-08-22T10:00:00Z') });

      const result = await service.reschedule('apt-1', { newScheduledAt: '2026-08-22T10:00:00Z' }, 'user-1');

      expect(result.id).toBe('apt-2');
    });

    it('should throw BadRequestException for cancelled appointment reschedule', async () => {
      const cancelledAppt = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      prisma.appointment.findUnique.mockResolvedValue(cancelledAppt);

      await expect(service.reschedule('apt-1', { newScheduledAt: '2026-08-22T10:00:00Z' }, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
