import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { CreateMedicalHistoryDto } from '../dto/medical-history.dto';
import { CreateInsurancePolicyDto } from '../dto/insurance-policy.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(dto: PaginationDto & { gender?: string; status?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', gender, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    };

    if (gender) where.gender = gender as any;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'vip') where.isVip = true;

    if (search) {
      where.OR = [
        { firstNameAr: { contains: search, mode: 'insensitive' } },
        { lastNameAr: { contains: search, mode: 'insensitive' } },
        { firstNameEn: { contains: search, mode: 'insensitive' } },
        { lastNameEn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { orders: true, reports: true, appointments: true } },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(query: string) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstNameAr: { contains: query, mode: 'insensitive' } },
          { lastNameAr: { contains: query, mode: 'insensitive' } },
          { firstNameEn: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { nationalId: { contains: query } },
          { patientNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        patientNumber: true,
        firstNameAr: true,
        lastNameAr: true,
        firstNameEn: true,
        lastNameEn: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return patients;
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, email: true, phone: true, status: true, lastLoginAt: true },
        },
        medicalHistory: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        insurancePolicies: {
          where: { isActive: true },
          include: { insuranceCompany: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
          orderBy: { createdAt: 'desc' },
        },
        familyMembers: {
          select: {
            id: true,
            patientNumber: true,
            firstNameAr: true,
            lastNameAr: true,
            firstNameEn: true,
            lastNameEn: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        _count: { select: { orders: true, reports: true, appointments: true } },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async create(dto: CreatePatientDto, userId?: string) {
    const existingPhone = await this.prisma.patient.findFirst({
      where: { phone: dto.phone, deletedAt: null },
    });
    if (existingPhone) {
      throw new ConflictException('A patient with this phone number already exists');
    }

    if (dto.nationalId) {
      const existingNationalId = await this.prisma.patient.findFirst({
        where: { nationalId: dto.nationalId, deletedAt: null },
      });
      if (existingNationalId) {
        throw new ConflictException('A patient with this national ID already exists');
      }
    }

    const patientNumber = await this.generatePatientNumber();

    const patient = await this.prisma.patient.create({
      data: {
        patientNumber,
        firstNameAr: dto.firstNameAr,
        lastNameAr: dto.lastNameAr,
        firstNameEn: dto.firstNameEn,
        lastNameEn: dto.lastNameEn,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender as any,
        phone: dto.phone,
        email: dto.email,
        nationalId: dto.nationalId,
        bloodType: dto.bloodType as any,
        allergies: dto.allergies,
        chronicDiseases: dto.chronicDiseases,
        guardianName: dto.guardianName,
        guardianPhone: dto.guardianPhone,
        referralSource: dto.referralSource,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.cache.invalidatePattern('patients:*');

    this.logger.log(`Patient created: ${patient.id} (${patientNumber})`);
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId?: string) {
    const existing = await this.findOne(id);

    if (dto.phone && dto.phone !== existing.phone) {
      const duplicatePhone = await this.prisma.patient.findFirst({
        where: { phone: dto.phone, deletedAt: null, id: { not: id } },
      });
      if (duplicatePhone) {
        throw new ConflictException('A patient with this phone number already exists');
      }
    }

    if (dto.nationalId && dto.nationalId !== existing.nationalId) {
      const duplicateNationalId = await this.prisma.patient.findFirst({
        where: { nationalId: dto.nationalId, deletedAt: null, id: { not: id } },
      });
      if (duplicateNationalId) {
        throw new ConflictException('A patient with this national ID already exists');
      }
    }

    const updateData: Prisma.PatientUpdateInput = {};
    if (dto.firstNameAr) updateData.firstNameAr = dto.firstNameAr;
    if (dto.lastNameAr) updateData.lastNameAr = dto.lastNameAr;
    if (dto.firstNameEn !== undefined) updateData.firstNameEn = dto.firstNameEn;
    if (dto.lastNameEn !== undefined) updateData.lastNameEn = dto.lastNameEn;
    if (dto.dateOfBirth) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) updateData.gender = dto.gender as any;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.nationalId !== undefined) updateData.nationalId = dto.nationalId;
    if (dto.bloodType !== undefined) updateData.bloodType = dto.bloodType as any;
    if (dto.allergies !== undefined) updateData.allergies = dto.allergies;
    if (dto.chronicDiseases !== undefined) updateData.chronicDiseases = dto.chronicDiseases;
    if (dto.guardianName !== undefined) updateData.guardianName = dto.guardianName;
    if (dto.guardianPhone !== undefined) updateData.guardianPhone = dto.guardianPhone;
    if (dto.referralSource !== undefined) updateData.referralSource = dto.referralSource;
    updateData.updatedBy = userId;

    const updated = await this.prisma.patient.update({
      where: { id },
      data: updateData,
    });

    await this.cache.invalidatePattern('patients:*');

    return updated;
  }

  async remove(id: string) {
    const patient = await this.findOne(id);

    const hasActiveOrders = await this.prisma.order.findFirst({
      where: {
        patientId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] },
      },
    });

    if (hasActiveOrders) {
      throw new BadRequestException('Cannot delete patient with active orders');
    }

    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.cache.invalidatePattern('patients:*');

    this.logger.log(`Patient soft-deleted: ${id}`);
    return { message: 'Patient deleted successfully' };
  }

  async getMedicalHistory(patientId: string) {
    await this.findOne(patientId);

    return this.prisma.medicalHistory.findMany({
      where: { patientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMedicalHistory(patientId: string, dto: CreateMedicalHistoryDto, userId?: string) {
    await this.findOne(patientId);

    const record = await this.prisma.medicalHistory.create({
      data: {
        patientId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        onsetDate: dto.onsetDate ? new Date(dto.onsetDate) : undefined,
        resolvedDate: dto.resolvedDate ? new Date(dto.resolvedDate) : undefined,
        isChronic: dto.isChronic ?? false,
        notes: dto.notes,
        recordedById: userId,
      },
    });

    this.logger.log(`Medical history added for patient ${patientId}: ${record.id}`);
    return record;
  }

  async updateMedicalHistory(recordId: string, dto: Partial<CreateMedicalHistoryDto>) {
    const existing = await this.prisma.medicalHistory.findUnique({ where: { id: recordId } });
    if (!existing) {
      throw new NotFoundException(`Medical history record with ID ${recordId} not found`);
    }

    const updateData: Prisma.MedicalHistoryUpdateInput = {};
    if (dto.category) updateData.category = dto.category;
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.onsetDate) updateData.onsetDate = new Date(dto.onsetDate);
    if (dto.resolvedDate !== undefined) updateData.resolvedDate = dto.resolvedDate ? new Date(dto.resolvedDate) : null;
    if (dto.isChronic !== undefined) updateData.isChronic = dto.isChronic;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.medicalHistory.update({
      where: { id: recordId },
      data: updateData,
    });
  }

  async removeMedicalHistory(recordId: string) {
    const existing = await this.prisma.medicalHistory.findUnique({ where: { id: recordId } });
    if (!existing) {
      throw new NotFoundException(`Medical history record with ID ${recordId} not found`);
    }

    await this.prisma.medicalHistory.update({
      where: { id: recordId },
      data: { isActive: false },
    });

    return { message: 'Medical history record removed successfully' };
  }

  async getFamilyMembers(patientId: string) {
    await this.findOne(patientId);

    return this.prisma.patient.findMany({
      where: { parentPatientId: patientId, deletedAt: null },
      select: {
        id: true,
        patientNumber: true,
        firstNameAr: true,
        lastNameAr: true,
        firstNameEn: true,
        lastNameEn: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFamilyMember(
    patientId: string,
    dto: CreatePatientDto & { relationship?: string },
    userId?: string,
  ) {
    await this.findOne(patientId);

    const patientNumber = await this.generatePatientNumber();

    const member = await this.prisma.patient.create({
      data: {
        patientNumber,
        parentPatientId: patientId,
        firstNameAr: dto.firstNameAr,
        lastNameAr: dto.lastNameAr,
        firstNameEn: dto.firstNameEn,
        lastNameEn: dto.lastNameEn,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender as any,
        phone: dto.phone,
        email: dto.email,
        nationalId: dto.nationalId,
        bloodType: dto.bloodType as any,
        allergies: dto.allergies,
        chronicDiseases: dto.chronicDiseases,
        guardianName: dto.guardianName,
        guardianPhone: dto.guardianPhone,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(`Family member added for patient ${patientId}: ${member.id}`);
    return member;
  }

  async removeFamilyMember(memberId: string) {
    const member = await this.prisma.patient.findUnique({ where: { id: memberId } });
    if (!member || !member.parentPatientId) {
      throw new NotFoundException('Family member not found');
    }

    await this.prisma.patient.update({
      where: { id: memberId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Family member removed successfully' };
  }

  async getInsurancePolicies(patientId: string) {
    await this.findOne(patientId);

    return this.prisma.insurancePolicy.findMany({
      where: { patientId, deletedAt: null },
      include: {
        insuranceCompany: {
          select: { id: true, nameAr: true, nameEn: true, code: true, contactPhone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addInsurancePolicy(patientId: string, dto: CreateInsurancePolicyDto, userId?: string) {
    await this.findOne(patientId);

    const company = await this.prisma.insuranceCompany.findUnique({
      where: { id: dto.insuranceCompanyId },
    });
    if (!company) {
      throw new NotFoundException('Insurance company not found');
    }

    const policy = await this.prisma.insurancePolicy.create({
      data: {
        patientId,
        insuranceCompanyId: dto.insuranceCompanyId,
        policyNumber: dto.policyNumber,
        cardNumber: dto.cardNumber,
        planType: dto.planType,
        coveragePercentage: dto.coveragePercentage,
        maxCoverage: dto.maxCoverage,
        deductible: dto.deductible,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isPrimary: dto.isPrimary ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        insuranceCompany: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
    });

    this.logger.log(`Insurance policy added for patient ${patientId}: ${policy.id}`);
    return policy;
  }

  async updateInsurancePolicy(policyId: string, dto: Partial<CreateInsurancePolicyDto>, userId?: string) {
    const existing = await this.prisma.insurancePolicy.findUnique({ where: { id: policyId } });
    if (!existing) {
      throw new NotFoundException(`Insurance policy with ID ${policyId} not found`);
    }

    const updateData: Prisma.InsurancePolicyUpdateInput = {};
    if (dto.insuranceCompanyId) updateData.insuranceCompany = { connect: { id: dto.insuranceCompanyId } };
    if (dto.policyNumber) updateData.policyNumber = dto.policyNumber;
    if (dto.cardNumber !== undefined) updateData.cardNumber = dto.cardNumber;
    if (dto.planType !== undefined) updateData.planType = dto.planType;
    if (dto.coveragePercentage !== undefined) updateData.coveragePercentage = dto.coveragePercentage;
    if (dto.maxCoverage !== undefined) updateData.maxCoverage = dto.maxCoverage;
    if (dto.deductible !== undefined) updateData.deductible = dto.deductible;
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.isPrimary !== undefined) updateData.isPrimary = dto.isPrimary;
    updateData.updatedBy = userId;

    return this.prisma.insurancePolicy.update({
      where: { id: policyId },
      data: updateData,
      include: {
        insuranceCompany: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
    });
  }

  async removeInsurancePolicy(policyId: string) {
    const existing = await this.prisma.insurancePolicy.findUnique({ where: { id: policyId } });
    if (!existing) {
      throw new NotFoundException(`Insurance policy with ID ${policyId} not found`);
    }

    await this.prisma.insurancePolicy.update({
      where: { id: policyId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Insurance policy removed successfully' };
  }

  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      activePatients,
      newPatientsToday,
      newPatientsMonth,
      vipPatients,
      maleCount,
      femaleCount,
      recentPatients,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { deletedAt: null } }),
      this.prisma.patient.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.patient.count({ where: { createdAt: { gte: startOfDay }, deletedAt: null } }),
      this.prisma.patient.count({ where: { createdAt: { gte: startOfMonth }, deletedAt: null } }),
      this.prisma.patient.count({ where: { isVip: true, deletedAt: null } }),
      this.prisma.patient.count({ where: { gender: 'MALE', deletedAt: null } }),
      this.prisma.patient.count({ where: { gender: 'FEMALE', deletedAt: null } }),
      this.prisma.patient.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          patientNumber: true,
          firstNameAr: true,
          lastNameAr: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    const referralStats = await this.prisma.patient.groupBy({
      by: ['referralSource'],
      where: { deletedAt: null, referralSource: { not: null } },
      _count: true,
    });

    return {
      totalPatients,
      activePatients,
      newPatientsToday,
      newPatientsMonth,
      vipPatients,
      genderDistribution: { male: maleCount, female: femaleCount },
      referralStats,
      recentPatients,
    };
  }

  async exportPatients(filters: { format?: string; gender?: string; status?: string }) {
    const where: Prisma.PatientWhereInput = { deletedAt: null };

    if (filters.gender) where.gender = filters.gender as any;
    if (filters.status === 'active') where.isActive = true;
    if (filters.status === 'inactive') where.isActive = false;

    const patients = await this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        patientNumber: true,
        firstNameAr: true,
        lastNameAr: true,
        firstNameEn: true,
        lastNameEn: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        email: true,
        nationalId: true,
        bloodType: true,
        isActive: true,
        isVip: true,
        totalVisits: true,
        lastVisitAt: true,
        createdAt: true,
      },
    });

    return patients;
  }

  private async generatePatientNumber(): Promise<string> {
    const now = new Date();
    const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

    const countToday = await this.prisma.patient.count({
      where: {
        patientNumber: { startsWith: `P-${datePart}` },
      },
    });

    const sequence = (countToday + 1).toString().padStart(8, '0');
    return `P-${datePart}-${sequence}`;
  }
}
