import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { CreateMedicalHistoryDto } from '../dto/medical-history.dto';
import { CreateInsurancePolicyDto } from '../dto/insurance-policy.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get paginated list of patients' })
  @ApiResponse({ status: 200, description: 'Paginated patients list' })
  async findAll(@Query() query: PaginationDto & { gender?: string; status?: string }) {
    const result = await this.patientsService.findAll(query);
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('search')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF')
  @ApiOperation({ summary: 'Search patients by name, phone, or national ID' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string) {
    const patients = await this.patientsService.search(query);
    return { success: true, data: patients };
  }

  @Get('stats/dashboard')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get patient dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Patient dashboard stats' })
  async getDashboardStats() {
    const stats = await this.patientsService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('export/csv')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Export patients data as CSV' })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @Header('Content-Type', 'text/csv')
  async exportCsv(
    @Res() res: Response,
    @Query('gender') gender?: string,
    @Query('status') status?: string,
  ) {
    const patients = await this.patientsService.exportPatients({ format: 'csv', gender, status });

    const headers = ['Patient Number', 'First Name (AR)', 'Last Name (AR)', 'First Name (EN)', 'Last Name (EN)', 'Date of Birth', 'Gender', 'Phone', 'Email', 'National ID', 'Blood Type', 'Active', 'VIP', 'Total Visits', 'Last Visit', 'Created At'];
    const rows = patients.map((p) => [
      p.patientNumber,
      p.firstNameAr,
      p.lastNameAr,
      p.firstNameEn ?? '',
      p.lastNameEn ?? '',
      p.dateOfBirth?.toISOString().split('T')[0] ?? '',
      p.gender,
      p.phone,
      p.email ?? '',
      p.nationalId ?? '',
      p.bloodType ?? '',
      p.isActive ? 'Yes' : 'No',
      p.isVip ? 'Yes' : 'No',
      p.totalVisits,
      p.lastVisitAt?.toISOString() ?? '',
      p.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Disposition', `attachment; filename="patients-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF', 'PATIENT')
  @ApiOperation({ summary: 'Get patient by ID with full profile' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient details with insurance and family' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id') id: string) {
    const patient = await this.patientsService.findOne(id);
    return { success: true, data: patient };
  }

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate phone or national ID' })
  async create(@Body() dto: CreatePatientDto, @Req() req: any) {
    const patient = await this.patientsService.create(dto, req.user?.id);
    return { success: true, data: patient, message: 'Patient created successfully' };
  }

  @Patch(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Update patient information' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: any) {
    const patient = await this.patientsService.update(id, dto, req.user?.id);
    return { success: true, data: patient, message: 'Patient updated successfully' };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft-delete a patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient deleted' })
  async remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get(':id/medical-history')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get patient medical history' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Medical history records' })
  async getMedicalHistory(@Param('id') id: string) {
    const records = await this.patientsService.getMedicalHistory(id);
    return { success: true, data: records };
  }

  @Post(':id/medical-history')
  @Roles('ADMIN', 'DOCTOR', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add medical history record' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Medical history record created' })
  async addMedicalHistory(
    @Param('id') id: string,
    @Body() dto: CreateMedicalHistoryDto,
    @Req() req: any,
  ) {
    const record = await this.patientsService.addMedicalHistory(id, dto, req.user?.id);
    return { success: true, data: record, message: 'Medical history record added' };
  }

  @Patch('medical-history/:recordId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Update a medical history record' })
  @ApiParam({ name: 'recordId', description: 'Medical history record UUID' })
  @ApiResponse({ status: 200, description: 'Record updated' })
  async updateMedicalHistory(
    @Param('recordId') recordId: string,
    @Body() dto: Partial<CreateMedicalHistoryDto>,
  ) {
    const record = await this.patientsService.updateMedicalHistory(recordId, dto);
    return { success: true, data: record, message: 'Medical history record updated' };
  }

  @Delete('medical-history/:recordId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Remove a medical history record' })
  @ApiParam({ name: 'recordId', description: 'Medical history record UUID' })
  @ApiResponse({ status: 200, description: 'Record removed' })
  async removeMedicalHistory(@Param('recordId') recordId: string) {
    return this.patientsService.removeMedicalHistory(recordId);
  }

  @Get(':id/family')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get patient family members' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Family members list' })
  async getFamilyMembers(@Param('id') id: string) {
    const members = await this.patientsService.getFamilyMembers(id);
    return { success: true, data: members };
  }

  @Post(':id/family')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a family member' })
  @ApiParam({ name: 'id', description: 'Parent patient UUID' })
  @ApiResponse({ status: 201, description: 'Family member added' })
  async addFamilyMember(
    @Param('id') id: string,
    @Body() dto: CreatePatientDto & { relationship?: string },
    @Req() req: any,
  ) {
    const member = await this.patientsService.addFamilyMember(id, dto, req.user?.id);
    return { success: true, data: member, message: 'Family member added successfully' };
  }

  @Get(':id/insurance')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF', 'PATIENT')
  @ApiOperation({ summary: 'Get patient insurance policies' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Insurance policies list' })
  async getInsurancePolicies(@Param('id') id: string) {
    const policies = await this.patientsService.getInsurancePolicies(id);
    return { success: true, data: policies };
  }

  @Post(':id/insurance')
  @Roles('ADMIN', 'RECEPTIONIST', 'BILLING_STAFF')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add insurance policy for patient' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 201, description: 'Insurance policy added' })
  async addInsurancePolicy(
    @Param('id') id: string,
    @Body() dto: CreateInsurancePolicyDto,
    @Req() req: any,
  ) {
    const policy = await this.patientsService.addInsurancePolicy(id, dto, req.user?.id);
    return { success: true, data: policy, message: 'Insurance policy added successfully' };
  }

  @Patch('insurance/:policyId')
  @Roles('ADMIN', 'RECEPTIONIST', 'BILLING_STAFF')
  @ApiOperation({ summary: 'Update an insurance policy' })
  @ApiParam({ name: 'policyId', description: 'Insurance policy UUID' })
  @ApiResponse({ status: 200, description: 'Insurance policy updated' })
  async updateInsurancePolicy(
    @Param('policyId') policyId: string,
    @Body() dto: Partial<CreateInsurancePolicyDto>,
    @Req() req: any,
  ) {
    const policy = await this.patientsService.updateInsurancePolicy(policyId, dto, req.user?.id);
    return { success: true, data: policy, message: 'Insurance policy updated' };
  }

  @Delete('insurance/:policyId')
  @Roles('ADMIN', 'BILLING_STAFF')
  @ApiOperation({ summary: 'Remove an insurance policy' })
  @ApiParam({ name: 'policyId', description: 'Insurance policy UUID' })
  @ApiResponse({ status: 200, description: 'Insurance policy removed' })
  async removeInsurancePolicy(@Param('policyId') policyId: string) {
    return this.patientsService.removeInsurancePolicy(policyId);
  }
}
