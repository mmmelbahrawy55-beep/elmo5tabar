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
  Res,
  StreamableFile,
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
import { ResultsService } from '../services/results.service';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportItemDto } from '../dto/update-report-item.dto';
import { ReportFiltersDto } from '../dto/report-filters.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get paginated list of reports' })
  @ApiResponse({ status: 200, description: 'Paginated reports list' })
  async findAll(@Query() filters: ReportFiltersDto) {
    return this.resultsService.findAll(filters);
  }

  @Get('search')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Full-text search reports' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resultsService.searchReports(query, {
      branchId,
      status: status as any,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats/overview')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get report statistics overview' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Report statistics' })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.resultsService.getReportStats(dateFrom, dateTo);
  }

  @Get('compare')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Compare historical results for same tests' })
  @ApiQuery({ name: 'patientId', required: true })
  @ApiQuery({ name: 'testIds', required: true, description: 'Comma-separated test IDs' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Comparison data' })
  async compare(
    @Query('patientId') patientId: string,
    @Query('testIds') testIds: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const ids = testIds.split(',').map((id) => id.trim());
    return this.resultsService.compareResults(patientId, ids, dateFrom, dateTo);
  }

  @Get('order/:orderId')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get reports for a specific order' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, description: 'Reports for order' })
  @ApiResponse({ status: 404, description: 'No reports found' })
  async findByOrder(@Param('orderId') orderId: string) {
    return this.resultsService.findByOrder(orderId);
  }

  @Get('patient/:patientId')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get patient report history' })
  @ApiParam({ name: 'patientId' })
  @ApiResponse({ status: 200, description: 'Patient report history' })
  async findByPatient(
    @Param('patientId') patientId: string,
    @Query() filters: ReportFiltersDto,
  ) {
    return this.resultsService.findByPatient(patientId, filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async findOne(@Param('id') id: string) {
    return this.resultsService.findOne(id);
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Download report PDF' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'PDF stream' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const result = await this.resultsService.downloadPdf(id);

    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });

    if (Buffer.isBuffer(result.buffer)) {
      res.end(result.buffer);
    } else {
      res.end(Buffer.from(JSON.stringify(result.buffer)));
    }
  }

  @Post()
  @Roles('ADMIN', 'LAB_TECHNICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new draft report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async create(@Body() dto: CreateReportDto, @Req() req: any) {
    return this.resultsService.create(dto, req.user?.sub);
  }

  @Patch('items/:itemId')
  @Roles('LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Update a report item' })
  @ApiParam({ name: 'itemId' })
  @ApiResponse({ status: 200, description: 'Report item updated' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateReportItemDto,
  ) {
    return this.resultsService.updateItem(itemId, dto);
  }

  @Post(':id/approve')
  @Roles('DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Report approved' })
  @ApiResponse({ status: 400, description: 'Cannot approve report' })
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.resultsService.approve(id, req.user?.sub);
  }

  @Post(':id/release')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release an approved report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Report released' })
  @ApiResponse({ status: 400, description: 'Cannot release report' })
  async release(@Param('id') id: string) {
    return this.resultsService.release(id);
  }

  @Post(':id/reject')
  @Roles('DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject/cancel a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Report rejected' })
  async reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.resultsService.reject(id, body.reason);
  }

  @Post(':id/amend')
  @Roles('DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Amend an approved report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Amended report created' })
  @ApiResponse({ status: 400, description: 'Cannot amend report' })
  async amend(
    @Param('id') id: string,
    @Body() dto: Partial<CreateReportDto>,
    @Req() req: any,
  ) {
    return this.resultsService.amend(id, dto, req.user?.sub);
  }

  @Post(':id/generate-pdf')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate PDF for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'PDF generated' })
  async generatePdf(@Param('id') id: string) {
    return this.resultsService.generatePdf(id);
  }
}
