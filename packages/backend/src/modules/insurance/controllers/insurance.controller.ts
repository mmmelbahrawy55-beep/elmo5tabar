import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { InsuranceService } from '../services/insurance.service';
import { CreateInsuranceCompanyDto } from '../dto/create-insurance-company.dto';
import { CreateInsurancePolicyDto } from '../dto/create-policy.dto';
import { VerifyInsuranceDto } from '../dto/verify-insurance.dto';
import { CreateInsuranceClaimDto } from '../dto/create-claim.dto';

@ApiTags('Insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  // ─── COMPANIES ──────────────────────────────────────────

  @Get('companies')
  @Roles('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'قائمة شركات التأمين' })
  getCompanies(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return this.insuranceService.getCompanies(pagination, { search });
  }

  @Get('companies/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'تفاصيل شركة التأمين' })
  @ApiParam({ name: 'id' })
  getCompany(@Param('id') id: string) {
    return this.insuranceService.getCompany(id);
  }

  @Post('companies')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'إضافة شركة تأمين جديدة' })
  createCompany(@Body() dto: CreateInsuranceCompanyDto) {
    return this.insuranceService.createCompany(dto);
  }

  @Patch('companies/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'تعديل شركة التأمين' })
  @ApiParam({ name: 'id' })
  updateCompany(@Param('id') id: string, @Body() dto: Partial<CreateInsuranceCompanyDto>) {
    return this.insuranceService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'حذف شركة التأمين' })
  @ApiParam({ name: 'id' })
  removeCompany(@Param('id') id: string) {
    return this.insuranceService.removeCompany(id);
  }

  // ─── POLICIES ───────────────────────────────────────────

  @Get('policies')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF')
  @ApiOperation({ summary: 'قائمة بوليصات التأمين' })
  getPolicies(
    @Query() pagination: PaginationDto,
    @Query('companyId') companyId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.insuranceService.getPolicies(pagination, { companyId, patientId });
  }

  @Get('policies/:id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'تفاصيل البوليصة' })
  @ApiParam({ name: 'id' })
  getPolicy(@Param('id') id: string) {
    return this.insuranceService.getPolicy(id);
  }

  @Post('policies/patient/:patientId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'إضافة بوليصة تأمين للمريض' })
  @ApiParam({ name: 'patientId' })
  createPolicy(@Param('patientId') patientId: string, @Body() dto: CreateInsurancePolicyDto) {
    return this.insuranceService.createPolicy(patientId, dto);
  }

  @Patch('policies/:id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'تعديل البوليصة' })
  @ApiParam({ name: 'id' })
  updatePolicy(@Param('id') id: string, @Body() dto: Partial<CreateInsurancePolicyDto>) {
    return this.insuranceService.updatePolicy(id, dto);
  }

  @Delete('policies/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'حذف البوليصة' })
  @ApiParam({ name: 'id' })
  removePolicy(@Param('id') id: string) {
    return this.insuranceService.removePolicy(id);
  }

  // ─── VERIFICATION ───────────────────────────────────────

  @Post('verify')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'التحقق من تغطية التأمين' })
  verifyInsurance(@Body() dto: VerifyInsuranceDto) {
    return this.insuranceService.verifyInsurance(dto);
  }

  @Get('verifications')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'سجلات التحقق من التأمين' })
  getVerifications(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.insuranceService.getVerifications(pagination, { status, companyId });
  }

  @Get('verifications/:id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'تفاصيل التحقق' })
  @ApiParam({ name: 'id' })
  getVerification(@Param('id') id: string) {
    return this.insuranceService.getVerification(id);
  }

  // ─── CLAIMS ─────────────────────────────────────────────

  @Get('claims')
  @Roles('ADMIN', 'BILLING_STAFF')
  @ApiOperation({ summary: 'قائمة مطالبات التأمين' })
  getClaims(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.insuranceService.getClaims(pagination, { status, companyId });
  }

  @Get('claims/:id')
  @Roles('ADMIN', 'BILLING_STAFF')
  @ApiOperation({ summary: 'تفاصيل المطالبة' })
  @ApiParam({ name: 'id' })
  getClaim(@Param('id') id: string) {
    return this.insuranceService.getClaim(id);
  }

  @Post('claims')
  @Roles('ADMIN', 'BILLING_STAFF')
  @ApiOperation({ summary: 'إنشاء مطالبة تأمين جديدة' })
  createClaim(@Body() dto: CreateInsuranceClaimDto) {
    return this.insuranceService.createClaim(dto);
  }

  @Patch('claims/:id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'تحديث حالة المطالبة' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'status' })
  updateClaimStatus(@Param('id') id: string, @Query('status') status: string, @Body() body?: { approvedAmount?: number; rejectionReason?: string }) {
    return this.insuranceService.updateClaimStatus(id, status, body);
  }

  @Post('claims/:id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'الموافقة على المطالبة' })
  @ApiParam({ name: 'id' })
  approveClaim(@Param('id') id: string, @Body() body: { approvedAmount: number; notes?: string }) {
    return this.insuranceService.approveClaim(id, body.approvedAmount, body.notes);
  }

  @Post('claims/:id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'رفض المطالبة' })
  @ApiParam({ name: 'id' })
  rejectClaim(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.insuranceService.rejectClaim(id, body.reason);
  }

  @Get('claims/stats/overview')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'إحصائيات مطالبات التأمين' })
  getClaimStats(
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.insuranceService.getClaimStats(branchId, dateFrom, dateTo);
  }
}
