import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get executive summary with today, monthly, pending counts and trends' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch UUID' })
  @ApiResponse({ status: 200, description: 'Executive summary data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN or SUPER_ADMIN role' })
  async getExecutiveSummary(@Query('branchId') branchId?: string) {
    const data = await this.dashboardService.getExecutiveSummary(branchId);
    return { success: true, data };
  }

  @Get('revenue-chart')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get revenue chart data grouped by day, week, or month' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'], description: 'Grouping granularity' })
  @ApiResponse({ status: 200, description: 'Revenue chart labels and data series' })
  @ApiResponse({ status: 400, description: 'Invalid date parameters' })
  async getRevenueChart(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('granularity') granularity?: 'day' | 'week' | 'month',
  ) {
    const data = await this.dashboardService.getRevenueChart(dateFrom, dateTo, granularity);
    return { success: true, data };
  }

  @Get('order-stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get order counts grouped by status' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch UUID' })
  @ApiResponse({ status: 200, description: 'Order status breakdown' })
  async getOrderStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.dashboardService.getOrderStats(dateFrom, dateTo, branchId);
    return { success: true, data };
  }

  @Get('top-tests')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get top N most ordered lab tests with revenue' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Top tests with order counts and revenue' })
  async getTopTests(
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.dashboardService.getTopTests(
      limit ? Number(limit) : 10,
      dateFrom,
      dateTo,
    );
    return { success: true, data };
  }

  @Get('top-doctors')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get top doctors by order count with average rating' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Top doctors with order counts and ratings' })
  async getTopDoctors(
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.dashboardService.getTopDoctors(
      limit ? Number(limit) : 10,
      dateFrom,
      dateTo,
    );
    return { success: true, data };
  }

  @Get('branch-performance')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get branch performance comparison with orders, revenue, patients, and wait times' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Branch performance metrics' })
  async getBranchPerformance(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const data = await this.dashboardService.getBranchPerformance(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('department-performance')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get department performance with tests run, revenue, and reports released' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Department performance metrics' })
  async getDepartmentPerformance(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const data = await this.dashboardService.getDepartmentPerformance(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('appointment-stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get appointment statistics including hourly distribution' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch UUID' })
  @ApiResponse({ status: 200, description: 'Appointment stats with hourly breakdown' })
  async getAppointmentStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.dashboardService.getAppointmentStats(dateFrom, dateTo, branchId);
    return { success: true, data };
  }

  @Get('patient-stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get patient demographics: new vs returning, gender, age group, nationality' })
  @ApiQuery({ name: 'dateFrom', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: true, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Patient demographic statistics' })
  async getPatientStats(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const data = await this.dashboardService.getPatientStats(dateFrom, dateTo);
    return { success: true, data };
  }

  @Get('inventory-alerts')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get inventory alerts: low stock, expired, below reorder point' })
  @ApiResponse({ status: 200, description: 'Inventory alert items' })
  async getInventoryAlerts() {
    const data = await this.dashboardService.getInventoryAlerts();
    return { success: true, data };
  }

  @Get('recent-activity')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get recent activity feed: orders, reports, payments, appointments' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per category (default 20)' })
  @ApiResponse({ status: 200, description: 'Recent activity sorted by timestamp' })
  async getRecentActivity(@Query('limit') limit?: number) {
    const data = await this.dashboardService.getRecentActivity(
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  @Get('system-health')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get system health: database status, uptime, memory, error count' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getSystemHealth() {
    const data = await this.dashboardService.getSystemHealth();
    return { success: true, data };
  }
}
