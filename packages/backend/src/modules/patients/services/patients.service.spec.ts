import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(PatientsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const mockPatient = {
    id: 'patient-1',
    patientNumber: 'P-20250101-00000001',
    firstNameAr: 'محمد',
    lastNameAr: 'أحمد',
    phone: '+966501234567',
    email: 'patient@example.com',
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-15'),
    nationalId: '1012345678',
    isActive: true,
    deletedAt: null,
  };

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by gender', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.count.mockResolvedValue(1);
      await service.findAll({ gender: 'MALE' });
      expect(prisma.patient.findMany).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search patients by name or phone', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      const result = await service.search('محمد');
      expect(result).toHaveLength(1);
    });

    it('should throw BadRequestException for short query', async () => {
      await expect(service.search('a')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return patient with relations', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        ...mockPatient,
        user: { id: 'user-1', email: 'patient@example.com' },
        medicalHistory: [],
        insurancePolicies: [],
        familyMembers: [],
        _count: { orders: 10, reports: 5, appointments: 20 },
      });
      const result = await service.findOne('patient-1');
      expect(result.id).toBe('patient-1');
      expect(result._count.orders).toBe(10);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue(mockPatient);
      const result = await service.create({
        firstNameAr: 'محمد',
        lastNameAr: 'أحمد',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        phone: '+966501234567',
        email: 'patient@example.com',
      });
      expect(result).toBeDefined();
    });

    it('should throw ConflictException for duplicate phone', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      await expect(service.create({
        firstNameAr: 'محمد', lastNameAr: 'أحمد',
        dateOfBirth: '1990-01-15', gender: 'MALE',
        phone: '+966501234567',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.patient.update.mockResolvedValue({ ...mockPatient, firstNameAr: 'أحمد' });
      const result = await service.update('patient-1', { firstNameAr: 'أحمد' });
      expect(result.firstNameAr).toBe('أحمد');
    });

    it('should throw ConflictException for duplicate phone', async () => {
      prisma.patient.findFirst
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce({ id: 'patient-2', phone: '+966501234567' });
      await expect(service.update('patient-1', { phone: '+966501234567' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.patient.update.mockResolvedValue({ ...mockPatient, deletedAt: new Date() });
      const result = await service.remove('patient-1');
      expect(result.message).toContain('deleted');
    });

    it('should throw when patient has active orders', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.order.findFirst.mockResolvedValue({ id: 'order-1', status: 'PENDING' });
      await expect(service.remove('patient-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('medical history', () => {
    it('should get medical history', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.medicalHistory.findMany.mockResolvedValue([{ id: 'hist-1', category: 'allergy', title: 'Penicillin' }]);
      const result = await service.getMedicalHistory('patient-1');
      expect(result).toHaveLength(1);
    });

    it('should add medical history entry', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.medicalHistory.create.mockResolvedValue({ id: 'hist-1', category: 'condition', title: 'Diabetes' });
      const result = await service.addMedicalHistory('patient-1', { category: 'condition', title: 'Diabetes', description: 'Type 2' });
      expect(result.id).toBe('hist-1');
    });

    it('should update medical history entry', async () => {
      prisma.medicalHistory.findUnique.mockResolvedValue({ id: 'hist-1' });
      prisma.medicalHistory.update.mockResolvedValue({ id: 'hist-1', title: 'Updated' });
      const result = await service.updateMedicalHistory('hist-1', { title: 'Updated' });
      expect(result).toBeDefined();
    });

    it('should remove medical history entry', async () => {
      prisma.medicalHistory.findUnique.mockResolvedValue({ id: 'hist-1' });
      prisma.medicalHistory.update.mockResolvedValue({ id: 'hist-1', isActive: false });
      const result = await service.removeMedicalHistory('hist-1');
      expect(result.message).toContain('removed');
    });
  });

  describe('family members', () => {
    it('should get family members', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.patient.findMany.mockResolvedValue([{ id: 'family-1', firstNameAr: 'سارة' }]);
      const result = await service.getFamilyMembers('patient-1');
      expect(result).toHaveLength(1);
    });

    it('should add family member', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue({ id: 'family-1', firstNameAr: 'سارة' });
      const result = await service.addFamilyMember('patient-1', { firstNameAr: 'سارة', lastNameAr: 'أحمد', dateOfBirth: '2010-05-15', gender: 'FEMALE', phone: '+966501234568' });
      expect(result).toBeDefined();
    });

    it('should remove family member', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'family-1', parentPatientId: 'patient-1' });
      prisma.patient.update.mockResolvedValue({});
      const result = await service.removeFamilyMember('family-1');
      expect(result.message).toContain('removed');
    });
  });

  describe('insurance policies', () => {
    it('should get insurance policies', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.insurancePolicy.findMany.mockResolvedValue([{ id: 'policy-1', policyNumber: 'POL-123', insuranceCompany: { nameAr: 'شركة التأمين' } }]);
      const result = await service.getInsurancePolicies('patient-1');
      expect(result).toHaveLength(1);
    });

    it('should add insurance policy', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.insuranceCompany.findUnique.mockResolvedValue({ id: 'insco-1', nameAr: 'شركة التأمين' });
      prisma.insurancePolicy.create.mockResolvedValue({ id: 'policy-1' });
      const result = await service.addInsurancePolicy('patient-1', { insuranceCompanyId: 'insco-1', policyNumber: 'POL-123', coveragePercentage: 80, maxCoverage: 100000, startDate: '2024-01-01', endDate: '2025-01-01' });
      expect(result).toBeDefined();
    });

    it('should throw when insurance company not found', async () => {
      prisma.patient.findFirst.mockResolvedValue(mockPatient);
      prisma.insuranceCompany.findUnique.mockResolvedValue(null);
      await expect(service.addInsurancePolicy('patient-1', { insuranceCompanyId: 'unknown', policyNumber: 'POL-123' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('dashboard stats', () => {
    it('should return dashboard statistics', async () => {
      prisma.patient.count
        .mockResolvedValueOnce(1000).mockResolvedValueOnce(800)
        .mockResolvedValueOnce(5).mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20).mockResolvedValueOnce(600)
        .mockResolvedValueOnce(400);
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.groupBy.mockResolvedValue([{ referralSource: 'facebook', _count: 10 }]);
      const result = await service.getDashboardStats();
      expect(result.totalPatients).toBe(1000);
      expect(result.genderDistribution.male).toBe(600);
    });
  });

  describe('export', () => {
    it('should export patients as array', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      const result = await service.exportPatients({ format: 'csv', gender: 'MALE' });
      expect(result).toHaveLength(1);
    });
  });
});
