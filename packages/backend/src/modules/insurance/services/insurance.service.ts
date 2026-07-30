import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateInsuranceCompanyDto } from '../dto/create-insurance-company.dto';
import { CreateInsurancePolicyDto } from '../dto/create-policy.dto';
import { VerifyInsuranceDto } from '../dto/verify-insurance.dto';
import { CreateInsuranceClaimDto } from '../dto/create-claim.dto';

@Injectable()
export class InsuranceService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // ─── COMPANIES ──────────────────────────────────────────

  async getCompanies(pagination: PaginationDto, filters?: { search?: string; isActive?: boolean }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.insuranceCompany.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { policies: true, claims: true, verifications: true } },
        },
      }),
      this.prisma.insuranceCompany.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCompany(id: string) {
    const company = await this.prisma.insuranceCompany.findUnique({
      where: { id },
      include: {
        _count: { select: { policies: true, claims: true, verifications: true } },
        claims: {
          select: { status: true, submittedAmount: true, approvedAmount: true },
          take: 100,
        },
      },
    });
    if (!company) throw new NotFoundException('شركة التأمين غير موجودة');

    const totalClaims = company._count.claims;
    const approvedClaims = company.claims.filter(c => c.status === 'APPROVED').length;
    const totalSubmitted = company.claims.reduce((sum, c) => sum + (c.submittedAmount || 0), 0);
    const totalApproved = company.claims.filter(c => c.status === 'APPROVED')
      .reduce((sum, c) => sum + (c.approvedAmount || 0), 0);

    return {
      ...company,
      stats: {
        totalClaims,
        approvedClaims,
        rejectedClaims: company.claims.filter(c => c.status === 'REJECTED').length,
        approvalRate: totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0,
        totalSubmitted,
        totalApproved,
      },
    };
  }

  async createCompany(dto: CreateInsuranceCompanyDto) {
    const existing = await this.prisma.insuranceCompany.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('كود شركة التأمين موجود مسبقاً');

    return this.prisma.insuranceCompany.create({ data: dto });
  }

  async updateCompany(id: string, dto: Partial<CreateInsuranceCompanyDto>) {
    const company = await this.prisma.insuranceCompany.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('شركة التأمين غير موجودة');

    return this.prisma.insuranceCompany.update({ where: { id }, data: dto });
  }

  async removeCompany(id: string) {
    const company = await this.prisma.insuranceCompany.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('شركة التأمين غير موجودة');

    return this.prisma.insuranceCompany.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── POLICIES ───────────────────────────────────────────

  async getPolicies(pagination: PaginationDto, filters?: { companyId?: string; patientId?: string; isActive?: boolean }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters?.companyId) where.insuranceCompanyId = filters.companyId;
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await Promise.all([
      this.prisma.insurancePolicy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
          insuranceCompany: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        },
      }),
      this.prisma.insurancePolicy.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPolicy(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true, nationalId: true } },
        insuranceCompany: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 5 },
        claims: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!policy) throw new NotFoundException('البوليصة غير موجودة');
    return policy;
  }

  async createPolicy(patientId: string, dto: CreateInsurancePolicyDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('المريض غير موجود');

    const company = await this.prisma.insuranceCompany.findUnique({ where: { id: dto.insuranceCompanyId } });
    if (!company) throw new NotFoundException('شركة التأمين غير موجودة');

    return this.prisma.insurancePolicy.create({
      data: { ...dto, patientId },
      include: { insuranceCompany: true },
    });
  }

  async updatePolicy(id: string, dto: Partial<CreateInsurancePolicyDto>) {
    const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('البوليصة غير موجودة');

    return this.prisma.insurancePolicy.update({
      where: { id },
      data: dto,
      include: { insuranceCompany: true },
    });
  }

  async removePolicy(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException('البوليصة غير موجودة');

    return this.prisma.insurancePolicy.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── VERIFICATION ───────────────────────────────────────

  async verifyInsurance(dto: VerifyInsuranceDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('المريض غير موجود');

    // Simulate insurance API verification
    const coveragePercentage = 80;
    const coveredAmount = dto.amount * (coveragePercentage / 100);
    const verified = Math.random() > 0.2; // 80% success rate simulation

    const verification = await this.prisma.insuranceVerification.create({
      data: {
        verificationNumber: `IV-${Date.now()}`,
        branchId: 'default',
        patientId: dto.patientId,
        policyId: dto.policyId,
        insuranceCompanyId: dto.insuranceCompanyId,
        insuranceNumber: dto.insuranceNumber,
        verificationStatus: verified ? 'VERIFIED' : 'REJECTED',
        coveragePercentage: verified ? coveragePercentage : null,
        coveredAmount: verified ? coveredAmount : null,
        totalAmount: dto.amount,
        approvalCode: verified ? `APV-${Date.now()}` : null,
        rejectionReason: verified ? null : 'البوليصة غير سارية المفعول',
        verifiedAt: verified ? new Date() : null,
        notes: dto.amount ? `مبلغ التحقق: ${dto.amount} ر.س` : undefined,
      },
      include: {
        patient: { select: { firstNameAr: true, lastNameAr: true } },
        insuranceCompany: { select: { nameAr: true } },
      },
    });

    return verification;
  }

  async getVerifications(pagination: PaginationDto, filters?: { status?: string; companyId?: string; branchId?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.verificationStatus = filters.status;
    if (filters?.companyId) where.insuranceCompanyId = filters.companyId;
    if (filters?.branchId) where.branchId = filters.branchId;

    const [data, total] = await Promise.all([
      this.prisma.insuranceVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { select: { firstNameAr: true, lastNameAr: true, phone: true } },
          insuranceCompany: { select: { nameAr: true, code: true } },
        },
      }),
      this.prisma.insuranceVerification.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getVerification(id: string) {
    const verification = await this.prisma.insuranceVerification.findUnique({
      where: { id },
      include: {
        patient: true,
        insuranceCompany: true,
        policy: true,
      },
    });
    if (!verification) throw new NotFoundException('سجل التحقق غير موجود');
    return verification;
  }

  // ─── CLAIMS ─────────────────────────────────────────────

  async getClaims(pagination: PaginationDto, filters?: { status?: string; companyId?: string; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.companyId) where.insuranceCompanyId = filters.companyId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.insuranceClaim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          insuranceCompany: { select: { nameAr: true, code: true } },
          policy: { select: { policyNumber: true, planType: true, coveragePercentage: true } },
        },
      }),
      this.prisma.insuranceClaim.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getClaim(id: string) {
    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id },
      include: {
        insuranceCompany: true,
        policy: true,
      },
    });
    if (!claim) throw new NotFoundException('المطالبة غير موجودة');
    return claim;
  }

  async createClaim(dto: CreateInsuranceClaimDto) {
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(await this.prisma.insuranceClaim.count() + 1).padStart(8, '0')}`;

    return this.prisma.insuranceClaim.create({
      data: {
        claimNumber,
        patientId: dto.patientId,
        policyId: dto.policyId,
        insuranceCompanyId: dto.insuranceCompanyId,
        orderId: dto.orderId,
        invoiceId: dto.invoiceId,
        submittedAmount: dto.submittedAmount,
        diagnosisCode: dto.diagnosisCode,
        notes: dto.notes,
        status: 'DRAFT',
      },
      include: {
        insuranceCompany: { select: { nameAr: true } },
      },
    });
  }

  async updateClaimStatus(id: string, status: string, dto?: { approvedAmount?: number; rejectionReason?: string }) {
    const claim = await this.prisma.insuranceClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('المطالبة غير موجودة');

    const updateData: any = { status };
    if (status === 'APPROVED') {
      updateData.approvedAmount = dto?.approvedAmount || claim.submittedAmount;
      updateData.reviewedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = dto?.rejectionReason;
      updateData.reviewedAt = new Date();
    } else if (status === 'PAID') {
      updateData.paidAt = new Date();
    } else if (status === 'SUBMITTED') {
      updateData.submittedAt = new Date();
    }

    return this.prisma.insuranceClaim.update({
      where: { id },
      data: updateData,
      include: { insuranceCompany: { select: { nameAr: true } } },
    });
  }

  async approveClaim(id: string, approvedAmount: number, notes?: string) {
    return this.updateClaimStatus(id, 'APPROVED', { approvedAmount, rejectionReason: notes });
  }

  async rejectClaim(id: string, reason: string) {
    return this.updateClaimStatus(id, 'REJECTED', { rejectionReason: reason });
  }

  async getClaimStats(branchId?: string, dateFrom?: string, dateTo?: string) {
    const where: any = { deletedAt: null };
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, byStatus, byCompany] = await Promise.all([
      this.prisma.insuranceClaim.count({ where }),
      this.prisma.insuranceClaim.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { submittedAmount: true, approvedAmount: true },
      }),
      this.prisma.insuranceClaim.groupBy({
        by: ['insuranceCompanyId'],
        where: { ...where, status: 'APPROVED' },
        _count: true,
        _sum: { approvedAmount: true },
      }),
    ]);

    const approved = byStatus.find(s => s.status === 'APPROVED');
    const totalSubmitted = byStatus.reduce((sum, s) => sum + (s._sum.submittedAmount || 0), 0);
    const totalApproved = byStatus.reduce((sum, s) => sum + (s._sum.approvedAmount || 0), 0);

    return {
      totalClaims: total,
      totalSubmitted,
      totalApproved,
      approvalRate: total > 0 ? Math.round(((approved?._count || 0) / total) * 100) : 0,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        submittedAmount: s._sum.submittedAmount || 0,
        approvedAmount: s._sum.approvedAmount || 0,
      })),
      byCompany: byCompany.map(c => ({
        companyId: c.insuranceCompanyId,
        count: c._count,
        totalApproved: c._sum.approvedAmount || 0,
      })),
    };
  }
}
