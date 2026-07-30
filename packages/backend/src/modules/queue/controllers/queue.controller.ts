import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
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
import { QueueService } from '../services/queue.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('tickets')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new queue ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@Body() dto: CreateTicketDto) {
    return this.queueService.createTicket(dto);
  }

  @Get('tickets')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get queue entries with filters' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'date', required: false, example: '2026-07-28' })
  @ApiResponse({ status: 200, description: 'Paginated queue entries' })
  async getTickets(
    @Query('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
  ) {
    return this.queueService.getQueueEntries(branchId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      date,
    });
  }

  @Get('tickets/:id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get queue ticket by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getTicket(@Param('id') id: string) {
    return (this.queueService as any).prisma.queueEntry.findUnique({
      where: { id },
    });
  }

  @Post('tickets/:id/call')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Call next ticket to a service point' })
  @ApiParam({ name: 'id', description: 'Service point ID' })
  @ApiResponse({ status: 200, description: 'Next ticket called' })
  @ApiResponse({ status: 400, description: 'No tickets waiting' })
  async callNext(@Param('id') servicePointId: string) {
    return this.queueService.callNext(servicePointId);
  }

  @Post('tickets/:id/serve')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start serving a ticket' })
  @ApiParam({ name: 'id', description: 'Queue entry ID' })
  @ApiQuery({ name: 'servicePointId', required: true })
  @ApiResponse({ status: 200, description: 'Ticket serving started' })
  async startServing(
    @Param('id') id: string,
  ) {
    return this.queueService.startServing(id);
  }

  @Post('tickets/:id/complete')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete serving a ticket' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket completed' })
  async completeServing(@Param('id') id: string, @Body() body?: { notes?: string }) {
    return this.queueService.completeServing(id, body?.notes);
  }

  @Post('tickets/:id/cancel')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a queue ticket' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket cancelled' })
  async cancelTicket(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.queueService.cancelTicket(id, body.reason);
  }

  @Post('tickets/:id/no-show')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark ticket as no-show' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket marked as no-show' })
  async noShow(@Param('id') id: string) {
    return this.queueService.noShow(id);
  }

  @Post('tickets/:id/transfer')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer ticket to another branch' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Ticket transferred' })
  async transferTicket(
    @Param('id') id: string,
    @Body() body: { toBranchId: string; reason?: string },
  ) {
    return this.queueService.transferTicket(id, body.toBranchId, body.reason);
  }

  @Get('status/:branchId')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get real-time queue status for a branch' })
  @ApiParam({ name: 'branchId' })
  @ApiResponse({ status: 200, description: 'Queue status' })
  async getQueueStatus(@Param('branchId') branchId: string) {
    return this.queueService.getQueueStatus(branchId);
  }

  @Get('history/:branchId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get queue history for a branch' })
  @ApiParam({ name: 'branchId' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiResponse({ status: 200, description: 'Queue history with summary' })
  async getQueueHistory(
    @Param('branchId') branchId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.queueService.getQueueHistory(branchId, dateFrom, dateTo);
  }

  @Get('service-points/:branchId')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get all service points for a branch' })
  @ApiParam({ name: 'branchId' })
  @ApiResponse({ status: 200, description: 'Service points list' })
  async getServicePoints(@Param('branchId') branchId: string) {
    return this.queueService.getServicePoints(branchId);
  }

  @Put('service-points/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a service point' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Service point updated' })
  async updateServicePoint(
    @Param('id') id: string,
    @Body() body: { name?: string; type?: string; isActive?: boolean },
  ) {
    return this.queueService.updateServicePoint(id, body);
  }

  @Get('dashboard/:branchId')
  @Roles('ADMIN', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get real-time dashboard stats for a branch' })
  @ApiParam({ name: 'branchId' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getDashboardStats(@Param('branchId') branchId: string) {
    return this.queueService.getDashboardStats(branchId);
  }
}
