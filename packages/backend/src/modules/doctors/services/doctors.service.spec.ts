import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(DoctorsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const mockDoctor = {
    id: 'doctor-1',
    userId: 'user-1',
    licenseNumber: 'LIC-123',
    specialtyAr: 'طب عام',
    specialtyEn: 'General Medicine',
    acceptingPatients: true,
    consultationFee: 200,
    consultationDuration: 15,
    rating: 4.5,
    user: { id: 'user-1', email: 'dr@example.com', profile: { firstNameAr: 'د. أحمد', lastNameAr: 'علي' } },
  };

  describe('findAll', () => {
    it('should return paginated doctors', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([mockDoctor]);
      prisma.doctorProfile.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by specialty', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([mockDoctor]);
      prisma.doctorProfile.count.mockResolvedValue(1);
      await service.findAll({ specialty: 'طب' });
      expect(prisma.doctorProfile.findMany).toHaveBeenCalled();
    });

    it('should filter by department', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([mockDoctor]);
      prisma.doctorProfile.count.mockResolvedValue(1);
      await service.findAll({ departmentId: 'dept-1' });
      expect(prisma.doctorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ departmentId: 'dept-1' }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should return doctor by ID', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.count.mockResolvedValue(50);
      const result = await service.findOne('doctor-1');
      expect(result.id).toBe('doctor-1');
      expect(result.uniquePatients).toBe(50);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a doctor profile', async () => {
      prisma.doctorProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      prisma.doctorProfile.create.mockResolvedValue(mockDoctor);
      const result = await service.create({
        userId: 'user-1',
        licenseNumber: 'LIC-123',
        specialtyAr: 'طب عام',
        specialtyEn: 'General Medicine',
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if user already has a profile', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      await expect(service.create({ userId: 'user-1', licenseNumber: 'LIC-123', specialtyAr: 'test', specialtyEn: 'test' }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if license number exists', async () => {
      prisma.doctorProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDoctor);
      await expect(service.create({ userId: 'user-2', licenseNumber: 'LIC-123', specialtyAr: 'test', specialtyEn: 'test' }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.doctorProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create({ userId: 'unknown', licenseNumber: 'LIC-999', specialtyAr: 'test', specialtyEn: 'test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update doctor profile', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctorProfile.update.mockResolvedValue({ ...mockDoctor, specialtyAr: 'قلب' });
      const result = await service.update('doctor-1', { specialtyAr: 'قلب' });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException on duplicate license number', async () => {
      prisma.doctorProfile.findUnique
        .mockResolvedValueOnce(mockDoctor)
        .mockResolvedValueOnce({ id: 'doctor-2', licenseNumber: 'LIC-456' });
      await expect(service.update('doctor-1', { licenseNumber: 'LIC-456' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove doctor profile', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.findFirst.mockResolvedValue(null);
      prisma.doctorProfile.delete.mockResolvedValue(mockDoctor);
      const result = await service.remove('doctor-1');
      expect(result.message).toContain('removed');
    });

    it('should throw BadRequestException if doctor has active appointments', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.findFirst.mockResolvedValue({ id: 'apt-1', status: 'SCHEDULED' });
      await expect(service.remove('doctor-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSchedule', () => {
    it('should return doctor schedule', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctorSchedule.findMany.mockResolvedValue([
        { doctorId: 'doctor-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', branch: { id: 'b-1', nameAr: 'الرياض', nameEn: 'Riyadh', code: 'RIY' } },
      ]);
      const schedule = await service.getSchedule('doctor-1', 'b-1');
      expect(schedule).toHaveLength(1);
    });
  });

  describe('updateSchedule', () => {
    it('should upsert schedule slots', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctorSchedule.findMany.mockResolvedValue([]);
      const slots = [{ branchId: 'b-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }];
      const result = await service.updateSchedule('doctor-1', slots);
      expect(result).toBeDefined();
    });
  });

  describe('getAvailability', () => {
    it('should return availability slots for a doctor on a given date', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctorSchedule.findMany.mockResolvedValue([
        { dayOfWeek: new Date('2025-01-15').getDay(), startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatients: 20, isAvailable: true, branchId: 'b-1', breakStart: null, breakEnd: null, branch: { id: 'b-1', nameAr: 'الرياض' } },
      ]);
      prisma.appointment.findMany.mockResolvedValue([]);
      const result = await service.getAvailability('doctor-1', '2025-01-15');
      expect(result.availability).toBeDefined();
      expect(result.availability.length).toBeGreaterThan(0);
    });
  });

  describe('getDoctorStats', () => {
    it('should return doctor statistics', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(180);
      prisma.order.count.mockResolvedValue(150);
      prisma.order.aggregate.mockResolvedValue({ _sum: { total: 50000 } });
      const stats = await service.getDoctorStats('doctor-1');
      expect(stats.totalAppointments).toBe(200);
      expect(stats.completionRate).toBe(90);
    });
  });

  describe('searchBySpecialty', () => {
    it('should find doctors by specialty', async () => {
      prisma.doctorProfile.findMany.mockResolvedValue([mockDoctor]);
      const doctors = await service.searchBySpecialty('قلب');
      expect(doctors).toHaveLength(1);
    });
  });

  describe('toggleAcceptingPatients', () => {
    it('should toggle accepting patients flag', async () => {
      prisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctorProfile.update.mockResolvedValue({ ...mockDoctor, acceptingPatients: false });
      const result = await service.toggleAcceptingPatients('doctor-1');
      expect(result.acceptingPatients).toBe(false);
    });
  });
});
