import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager } from '../../../../test/mocks';

describe('InsuranceService', () => {
  let service: InsuranceService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsuranceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get(InsuranceService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  // ─── COMPANIES ──────────────────────────────────────────

  describe('companies', () => {
    it('should list companies with pagination', async () => {
      prisma.insuranceCompany.findMany.mockResolvedValue([{ id: 'ins-1', nameAr: 'شركة التأمين', code: 'INS01', _count: { policies: 10, claims: 5, verifications: 20 } }]);
      prisma.insuranceCompany.count.mockResolvedValue(1);
      const result = await service.getCompanies({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
    });

    it('should search companies by name', async () => {
      prisma.insuranceCompany.findMany.mockResolvedValue([]);
      prisma.insuranceCompany.count.mockResolvedValue(0);
      await service.getCompanies({ search: 'التأمين' });
      expect(prisma.insuranceCompany.findMany).toHaveBeenCalled();
    });

    it('should get single company with stats', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue({
        id: 'ins-1',
        nameAr: 'شركة التأمين',
        code: 'INS01',
        _count: { policies: 10, claims: 5, verifications: 20 },
        claims: [
          { status: 'APPROVED', submittedAmount: 10000, approvedAmount: 8000 },
          { status: 'APPROVED', submittedAmount: 5000, approvedAmount: 4000 },
          { status: 'REJECTED', submittedAmount: 3000, approvedAmount: null },
        ],
      });
      const result = await service.getCompany('ins-1');
      expect(result.stats.approvalRate).toBe(67);
    });

    it('should throw when company not found', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue(null);
      await expect(service.getCompany('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should create a company', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue(null);
      prisma.insuranceCompany.create.mockResolvedValue({ id: 'ins-1', nameAr: 'شركة جديدة', code: 'NEW01' });
      const result = await service.createCompany({ nameAr: 'شركة جديدة', nameEn: 'New Company', code: 'NEW01' });
      expect(result).toBeDefined();
    });

    it('should throw on duplicate company code', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue({ id: 'ins-1', code: 'INS01' });
      await expect(service.createCompany({ nameAr: 'Test', nameEn: 'Test', code: 'INS01' })).rejects.toThrow(ConflictException);
    });

    it('should update a company', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue({ id: 'ins-1' });
      prisma.insuranceCompany.update.mockResolvedValue({ id: 'ins-1', nameAr: 'محدث' });
      const result = await service.updateCompany('ins-1', { nameAr: 'محدث' });
      expect(result).toBeDefined();
    });

    it('should soft delete a company', async () => {
      prisma.insuranceCompany.findUnique.mockResolvedValue({ id: 'ins-1' });
      prisma.insuranceCompany.update.mockResolvedValue({ id: 'ins-1', deletedAt: new Date() });
      const result = await service.removeCompany('ins-1');
      expect(result.deletedAt).toBeDefined();
    });
  });

  // ─── POLICIES ───────────────────────────────────────────

  describe('policies', () => {
    it('should list policies with filters', async () => {
      prisma.insurancePolicy.findMany.mockResolvedValue([{ id: 'pol-1', policyNumber: 'POL-001', patient: { firstNameAr: 'محمد' }, insuranceCompany: { nameAr: 'شركة' } }]);
      prisma.insurancePolicy.count.mockResolvedValue(1);
      const result = await service.getPolicies({ page: 1, limit: 20 }, { companyId: 'ins-1', patientId: 'pat-1' });
      expect(result.data).toHaveLength(1);
    });

    it('should get single policy', async () => {
      prisma.insurancePolicy.findUnique.mockResolvedValue({ id: 'pol-1', policyNumber: 'POL-001', patient: {}, insuranceCompany: {}, verifications: [], claims: [] });
      const result = await service.getPolicy('pol-1');
      expect(result.id).toBe('pol-1');
    });

    it('should create policy', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'pat-1' });
      prisma.insuranceCompany.findUnique.mockResolvedValue({ id: 'ins-1' });
      prisma.insurancePolicy.create.mockResolvedValue({ id: 'pol-1', insuranceCompany: {} });
      const result = await service.createPolicy('pat-1', { insuranceCompanyId: 'ins-1', policyNumber: 'POL-001', coveragePercentage: 80, startDate: '2024-01-01', endDate: '2025-01-01' });
      expect(result).toBeDefined();
    });
  });

  // ─── VERIFICATION ───────────────────────────────────────

  describe('verifications', () => {
    it('should verify insurance', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'pat-1' });
      prisma.insuranceVerification.create.mockResolvedValue({ id: 'ver-1', verificationStatus: 'VERIFIED', coveragePercentage: 80, coveredAmount: 800, approvalCode: 'APV-123', patient: {}, insuranceCompany: {} });
      const result = await service.verifyInsurance({ patientId: 'pat-1', policyId: 'pol-1', insuranceCompanyId: 'ins-1', insuranceNumber: 'POL-001', amount: 1000 });
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('should list verifications', async () => {
      prisma.insuranceVerification.findMany.mockResolvedValue([{ id: 'ver-1', verificationStatus: 'VERIFIED', patient: {}, insuranceCompany: {} }]);
      prisma.insuranceVerification.count.mockResolvedValue(1);
      const result = await service.getVerifications({ page: 1, limit: 20 }, { status: 'VERIFIED' });
      expect(result.data).toHaveLength(1);
    });

    it('should get single verification', async () => {
      prisma.insuranceVerification.findUnique.mockResolvedValue({ id: 'ver-1', verificationStatus: 'VERIFIED', patient: {}, insuranceCompany: {}, policy: {} });
      const result = await service.getVerification('ver-1');
      expect(result.id).toBe('ver-1');
    });
  });

  // ─── CLAIMS ─────────────────────────────────────────────

  describe('claims', () => {
    it('should list claims with filters', async () => {
      prisma.insuranceClaim.findMany.mockResolvedValue([{ id: 'clm-1', claimNumber: 'CLM-001', insuranceCompany: { nameAr: 'شركة' }, policy: {} }]);
      prisma.insuranceClaim.count.mockResolvedValue(1);
      const result = await service.getClaims({ page: 1, limit: 20 }, { status: 'DRAFT' });
      expect(result.data).toHaveLength(1);
    });

    it('should create a claim', async () => {
      prisma.insuranceClaim.count.mockResolvedValue(0);
      prisma.insuranceClaim.create.mockResolvedValue({ id: 'clm-1', claimNumber: 'CLM-2025-00000001', insuranceCompany: { nameAr: 'شركة' } });
      const result = await service.createClaim({ patientId: 'pat-1', policyId: 'pol-1', insuranceCompanyId: 'ins-1', submittedAmount: 5000 });
      expect(result.claimNumber).toContain('CLM-2025');
    });

    it('should update claim status to APPROVED', async () => {
      prisma.insuranceClaim.findUnique.mockResolvedValue({ id: 'clm-1', submittedAmount: 5000 });
      prisma.insuranceClaim.update.mockResolvedValue({ id: 'clm-1', status: 'APPROVED', approvedAmount: 4000 });
      const result = await service.updateClaimStatus('clm-1', 'APPROVED', { approvedAmount: 4000 });
      expect(result.status).toBe('APPROVED');
    });

    it('should approve claim', async () => {
      prisma.insuranceClaim.findUnique.mockResolvedValue({ id: 'clm-1', submittedAmount: 5000 });
      prisma.insuranceClaim.update.mockResolvedValue({ id: 'clm-1', status: 'APPROVED', insuranceCompany: { nameAr: 'شركة' } });
      const result = await service.approveClaim('clm-1', 4000);
      expect(result.status).toBe('APPROVED');
    });

    it('should reject claim', async () => {
      prisma.insuranceClaim.findUnique.mockResolvedValue({ id: 'clm-1', submittedAmount: 5000 });
      prisma.insuranceClaim.update.mockResolvedValue({ id: 'clm-1', status: 'REJECTED', insuranceCompany: { nameAr: 'شركة' } });
      const result = await service.rejectClaim('clm-1', 'Invalid documentation');
      expect(result.status).toBe('REJECTED');
    });

    it('should get claim stats', async () => {
      prisma.insuranceClaim.count.mockResolvedValue(100);
      prisma.insuranceClaim.groupBy
        .mockResolvedValueOnce([
          { status: 'APPROVED', _count: 40, _sum: { submittedAmount: 200000, approvedAmount: 160000 } },
          { status: 'PENDING', _count: 60, _sum: { submittedAmount: 300000, approvedAmount: null } },
        ])
        .mockResolvedValueOnce([{ insuranceCompanyId: 'ins-1', _count: 30, _sum: { approvedAmount: 120000 } }]);
      const stats = await service.getClaimStats();
      expect(stats.totalClaims).toBe(100);
      expect(stats.approvalRate).toBe(40);
    });
  });
});
