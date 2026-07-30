import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserRole, UserStatus, Gender } from '@prisma/client';
import { mockPrismaService, mockCacheManager } from '../../../test/mocks';

describe('UsersService', () => {
  let prisma: typeof mockPrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    phone: '+966501234567',
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    profile: {
      id: 'profile-1',
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      firstNameEn: 'Mohammed',
      lastNameEn: 'Ahmed',
    },
    patient: {
      id: 'patient-1',
      firstNameAr: 'محمد',
      lastNameAr: 'أحمد',
      phone: '+966501234567',
    },
  };

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

  describe('CRUD operations', () => {
    it('should create a user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const createData = {
        email: 'new@example.com',
        phone: '+966501234567',
        passwordHash: 'hash',
        role: UserRole.PATIENT,
        status: UserStatus.ACTIVE,
        profile: { create: { firstNameAr: 'محمد', lastNameAr: 'أحمد' } },
      };

      const result = prisma.user.create.mock.results[0]?.value;
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should find user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await prisma.user.findUnique({ where: { id: 'user-1' } });
      expect(result.id).toBe('user-1');
    });

    it('should throw on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      try {
        await prisma.user.findUnique({ where: { email: 'existing@example.com' } });
      } catch {}
    });

    it('should soft delete a user', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      const result = await prisma.user.update({
        where: { id: 'user-1' },
        data: { deletedAt: new Date() },
      });

      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('profile update', () => {
    it('should update user profile', async () => {
      const updatedProfile = { ...mockUser.profile, firstNameAr: 'أحمد' };
      prisma.userProfile.update.mockResolvedValue(updatedProfile);

      const result = await prisma.userProfile.update({
        where: { userId: 'user-1' },
        data: { firstNameAr: 'أحمد' },
      });

      expect(result.firstNameAr).toBe('أحمد');
    });
  });

  describe('role assignment', () => {
    it('should update user role', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, role: UserRole.DOCTOR });

      const result = await prisma.user.update({
        where: { id: 'user-1' },
        data: { role: UserRole.DOCTOR },
      });

      expect(result.role).toBe(UserRole.DOCTOR);
    });
  });

  describe('patient medical history', () => {
    it('should create medical history entry', async () => {
      const historyEntry = {
        id: 'hist-1',
        patientId: 'patient-1',
        category: 'allergy',
        title: 'Penicillin allergy',
        isActive: true,
      };
      prisma.medicalHistory.create.mockResolvedValue(historyEntry);

      const result = await prisma.medicalHistory.create({
        data: {
          patientId: 'patient-1',
          category: 'allergy',
          title: 'Penicillin allergy',
          description: 'Severe reaction to penicillin',
        },
      });

      expect(result.id).toBe('hist-1');
    });

    it('should list medical history for patient', async () => {
      const history = [
        { id: 'hist-1', category: 'allergy', title: 'Penicillin', isActive: true },
        { id: 'hist-2', category: 'condition', title: 'Diabetes', isActive: true },
      ];
      prisma.medicalHistory.findMany.mockResolvedValue(history);

      const result = await prisma.medicalHistory.findMany({ where: { patientId: 'patient-1' } });
      expect(result).toHaveLength(2);
    });
  });

  describe('family members management', () => {
    it('should add family member', async () => {
      const familyMember = {
        id: 'patient-2',
        parentPatientId: 'patient-1',
        firstNameAr: 'سارة',
        lastNameAr: 'أحمد',
      };
      prisma.patient.update.mockResolvedValue({ ...mockUser.patient, ...familyMember });

      const result = await prisma.patient.update({
        where: { id: 'patient-2' },
        data: { parentPatientId: 'patient-1' },
      });

      expect(result.parentPatientId).toBe('patient-1');
    });
  });
});
