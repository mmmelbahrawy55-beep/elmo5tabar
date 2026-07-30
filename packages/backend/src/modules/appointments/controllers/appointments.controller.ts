import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { AppointmentFiltersDto } from '../dto/appointment-filters.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get paginated list of appointments' })
  @ApiResponse({ status: 200, description: 'Paginated appointments list' })
  async findAll(@Query() filters: AppointmentFiltersDto) {
    return this.appointmentsService.findAll(filters);
  }

  @Get('slots/available')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'date', required: true, example: '2026-07-28' })
  @ApiResponse({ status: 200, description: 'Available time slots' })
  async getAvailableSlots(
    @Query('branchId') branchId: string,
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(branchId, doctorId, date);
  }

  @Get('calendar/view')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get calendar view of appointments' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiResponse({ status: 200, description: 'Calendar view data' })
  async getCalendar(
    @Query('branchId') branchId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.appointmentsService.getCalendar(branchId, dateFrom, dateTo);
  }

  @Get('stats/overview')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get appointment statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Appointment statistics' })
  async getStats(
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.appointmentsService.getStats(branchId, dateFrom, dateTo);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST', 'PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 409, description: 'Slot conflict' })
  async create(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateAppointmentDto>, @Req() req: any) {
    return this.appointmentsService.update(id, dto, req.user?.id);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'RECEPTIONIST', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel appointment' })
  async cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto, @Req() req: any) {
    return this.appointmentsService.cancel(id, dto.reason, req.user?.id);
  }

  @Post(':id/reschedule')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiResponse({ status: 409, description: 'Slot conflict' })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Req() req: any,
  ) {
    return this.appointmentsService.reschedule(id, dto, req.user?.id);
  }

  @Post(':id/check-in')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in an appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment checked in' })
  async checkIn(@Param('id') id: string) {
    return this.appointmentsService.checkIn(id);
  }

  @Post(':id/complete')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark appointment as completed' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment completed' })
  async complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  @Post(':id/no-show')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  async markNoShow(@Param('id') id: string) {
    return this.appointmentsService.markNoShow(id);
  }
}
