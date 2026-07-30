import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DoctorsService } from '../services/doctors.service';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorScheduleDto } from '../dto/schedule.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get paginated list of doctors' })
  @ApiResponse({ status: 200, description: 'Paginated doctors list' })
  async findAll(@Query() query: PaginationDto & { specialty?: string; departmentId?: string; branchId?: string }) {
    const result = await this.doctorsService.findAll(query);
    return { success: true, ...result, pagination: result.meta };
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get doctor details with profile, stats, and schedule' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiResponse({ status: 200, description: 'Doctor details' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorsService.findOne(id);
    return { success: true, data: doctor };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new doctor profile' })
  @ApiResponse({ status: 201, description: 'Doctor profile created' })
  @ApiResponse({ status: 409, description: 'Duplicate license number or user already has profile' })
  async create(@Body() dto: CreateDoctorDto, @Req() req: any) {
    const doctor = await this.doctorsService.create(dto, req.user?.id);
    return { success: true, data: doctor, message: 'Doctor profile created successfully' };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update doctor profile' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiResponse({ status: 200, description: 'Doctor updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateDoctorDto>, @Req() req: any) {
    const doctor = await this.doctorsService.update(id, dto, req.user?.id);
    return { success: true, data: doctor, message: 'Doctor profile updated' };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove doctor profile' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiResponse({ status: 200, description: 'Doctor removed' })
  async remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Get(':id/schedule')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get doctor schedule' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch' })
  @ApiResponse({ status: 200, description: 'Doctor schedule' })
  async getSchedule(@Param('id') id: string, @Query('branchId') branchId?: string) {
    const schedule = await this.doctorsService.getSchedule(id, branchId);
    return { success: true, data: schedule };
  }

  @Put(':id/schedule')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Update doctor weekly schedule' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  async updateSchedule(@Param('id') id: string, @Body() dto: UpdateDoctorScheduleDto) {
    const schedule = await this.doctorsService.updateSchedule(id, dto.schedule);
    return { success: true, data: schedule, message: 'Schedule updated successfully' };
  }

  @Get(':id/availability')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)', example: '2026-07-28' })
  @ApiResponse({ status: 200, description: 'Available time slots per branch' })
  async getAvailability(@Param('id') id: string, @Query('date') date: string) {
    const availability = await this.doctorsService.getAvailability(id, date);
    return { success: true, data: availability };
  }

  @Get(':id/stats')
  @Roles('ADMIN', 'DOCTOR', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get doctor performance statistics' })
  @ApiParam({ name: 'id', description: 'Doctor profile UUID' })
  @ApiResponse({ status: 200, description: 'Doctor statistics' })
  async getStats(@Param('id') id: string) {
    const stats = await this.doctorsService.getDoctorStats(id);
    return { success: true, data: stats };
  }
}
