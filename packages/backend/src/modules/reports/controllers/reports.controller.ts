import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles, CurrentUser } from '../../../common/decorators/roles.decorator';
import { ReportsService } from '../services/reports.service';
import { GenerateReportDto, SaveReportDto, ReportType } from '../dto/generate-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async generate(@Body() dto: GenerateReportDto) {
    return this.reportsService.generateReport(dto);
  }

  @Get('export/pdf')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export report as PDF' })
  @ApiQuery({ name: 'type', enum: ReportType, required: true })
  @ApiQuery({ name: 'dateFrom', type: String, required: true })
  @ApiQuery({ name: 'dateTo', type: String, required: true })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'departmentId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'PDF file' })
  async exportPdf(
    @Res() res: Response,
    @Query('type') type: ReportType,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const report = await this.reportsService.generateReport({
      type,
      dateFrom,
      dateTo,
      branchId,
      departmentId,
    });

    const html = await this.reportsService.exportToPdf(report);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="report-${type}-${dateFrom}.html"`);
    res.send(html);
  }

  @Get('export/excel')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export report as CSV/Excel' })
  @ApiQuery({ name: 'type', enum: ReportType, required: true })
  @ApiQuery({ name: 'dateFrom', type: String, required: true })
  @ApiQuery({ name: 'dateTo', type: String, required: true })
  @ApiQuery({ name: 'branchId', type: String, required: false })
  @ApiQuery({ name: 'departmentId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'CSV file' })
  async exportExcel(
    @Res() res: Response,
    @Query('type') type: ReportType,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const report = await this.reportsService.generateReport({
      type,
      dateFrom,
      dateTo,
      branchId,
      departmentId,
    });

    const csv = await this.reportsService.exportToExcel(report);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report-${type}-${dateFrom}.csv"`);
    res.send(csv);
  }

  @Post('save')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a report configuration' })
  @ApiResponse({ status: 201, description: 'Report configuration saved' })
  async saveReport(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveReportDto,
  ) {
    return this.reportsService.saveReport(userId, dto);
  }

  @Get('saved')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List saved report configurations' })
  @ApiResponse({ status: 200, description: 'List of saved reports' })
  async getSavedReports(@CurrentUser('id') userId: string) {
    return this.reportsService.getSavedReports(userId);
  }
}
