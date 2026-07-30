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
  HttpCode,
  HttpStatus,
  Res,
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
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { DigitalSignatureService } from '../services/digital-signature.service';
import { VerificationService } from '../services/verification.service';
import { HistoricalComparisonService } from '../services/historical-comparison.service';
import { TimelineService } from '../services/timeline.service';
import { AuditTrailService } from '../services/audit-trail.service';
import { EncryptionService } from '../services/encryption.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { success } from '../../../common/utils/response.utils';
import { Logger } from '@nestjs/common';

@ApiTags('Advanced Results')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('results/advanced')
export class AdvancedResultsController {
  private readonly logger = new Logger(AdvancedResultsController.name);

  constructor(
    private readonly resultsService: ResultsService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly digitalSignature: DigitalSignatureService,
    private readonly verification: VerificationService,
    private readonly historicalComparison: HistoricalComparisonService,
    private readonly timeline: TimelineService,
    private readonly auditTrail: AuditTrailService,
    private readonly encryption: EncryptionService,
  ) {}

  // ==================== COMPARISON ====================

  @Get('comparison/patient/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Compare patient results over time' })
  @ApiParam({ name: 'patientId' })
  @ApiQuery({ name: 'testIds', required: true })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Comparison data' })
  async comparePatientResults(
    @Param('patientId') patientId: string,
    @Query('testIds') testIds: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      const ids = testIds.split(',').map((id: string) => id.trim());
      const result = await this.historicalComparison.compareResults(patientId, ids, dateFrom, dateTo);
      return success(result, 'Comparison data retrieved');
    } catch (error) {
      this.logger.error('comparePatientResults failed', error);
      throw error;
    }
  }

  @Get('comparison/tests/:patientId/:labTestId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get single test trends for a patient' })
  @ApiParam({ name: 'patientId' })
  @ApiParam({ name: 'labTestId' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Test trend data' })
  async getTestTrends(
    @Param('patientId') patientId: string,
    @Param('labTestId') labTestId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.historicalComparison.getResultsByLabTest(patientId, labTestId, limit ? parseInt(limit, 10) : 10);
      return success(result, 'Test trends retrieved');
    } catch (error) {
      this.logger.error('getTestTrends failed', error);
      throw error;
    }
  }

  @Post('comparison/delta')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare two reports side by side' })
  @ApiResponse({ status: 200, description: 'Delta comparison' })
  async compareDelta(@Body() body: { reportId1: string; reportId2: string }) {
    try {
      const result = await this.historicalComparison.getDeltaComparison(body.reportId1, body.reportId2);
      return success(result, 'Delta comparison retrieved');
    } catch (error) {
      this.logger.error('compareDelta failed', error);
      throw error;
    }
  }

  @Get('comparison/chart/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get chart data for comparison' })
  @ApiParam({ name: 'patientId' })
  @ApiQuery({ name: 'testIds', required: true })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Chart data' })
  async getComparisonChartData(
    @Param('patientId') patientId: string,
    @Query('testIds') testIds: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      const ids = testIds.split(',').map((id: string) => id.trim());
      const result = await this.historicalComparison.getComparisonChartData(patientId, ids, dateFrom, dateTo);
      return success(result, 'Chart data retrieved');
    } catch (error) {
      this.logger.error('getComparisonChartData failed', error);
      throw error;
    }
  }

  @Get('comparison/export/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Export comparison as CSV' })
  @ApiParam({ name: 'patientId' })
  @ApiQuery({ name: 'testIds', required: true })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'CSV export' })
  async exportComparisonCsv(
    @Param('patientId') patientId: string,
    @Query('testIds') testIds: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res() res?: Response,
  ) {
    try {
      const ids = testIds.split(',').map((id: string) => id.trim());
      const result = await this.historicalComparison.exportComparisonAsCsv(patientId, ids, dateFrom, dateTo);
      if (res) {
        res.set({ 'Content-Type': result.mimeType, 'Content-Disposition': 'attachment; filename=\"' + result.filename + '\"' });
        res.end(result.csv);
        return;
      }
      return success(result, 'CSV exported');
    } catch (error) {
      this.logger.error('exportComparisonCsv failed', error);
      throw error;
    }
  }

  @Get('comparison/summary/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get patient results summary' })
  @ApiParam({ name: 'patientId' })
  @ApiResponse({ status: 200, description: 'Patient summary' })
  async getPatientSummary(@Param('patientId') patientId: string) {
    try {
      const result = await this.historicalComparison.getPatientSummary(patientId);
      return success(result, 'Patient summary retrieved');
    } catch (error) {
      this.logger.error('getPatientSummary failed', error);
      throw error;
    }
  }

  // ==================== TIMELINE ====================

  @Get('timeline/patient/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get patient timeline' })
  @ApiParam({ name: 'patientId' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Patient timeline' })
  async getPatientTimeline(
    @Param('patientId') patientId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      const result = await this.timeline.getPatientTimeline(patientId, { dateFrom, dateTo });
      return success(result, 'Timeline retrieved');
    } catch (error) {
      this.logger.error('getPatientTimeline failed', error);
      throw error;
    }
  }

  @Get('timeline/report/:reportId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get report timeline' })
  @ApiParam({ name: 'reportId' })
  @ApiResponse({ status: 200, description: 'Report timeline' })
  async getReportTimeline(@Param('reportId') reportId: string) {
    try {
      const result = await this.timeline.getReportTimeline(reportId);
      return success(result, 'Report timeline retrieved');
    } catch (error) {
      this.logger.error('getReportTimeline failed', error);
      throw error;
    }
  }

  @Get('timeline/daily/:patientId/:date')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get daily timeline for a patient' })
  @ApiParam({ name: 'patientId' })
  @ApiParam({ name: 'date' })
  @ApiResponse({ status: 200, description: 'Daily timeline' })
  async getDailyTimeline(@Param('patientId') patientId: string, @Param('date') date: string) {
    try {
      const result = await this.timeline.getDailyTimeline(patientId, date);
      return success(result, 'Daily timeline retrieved');
    } catch (error) {
      this.logger.error('getDailyTimeline failed', error);
      throw error;
    }
  }

  @Get('timeline/stats/:patientId')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get timeline statistics for a patient' })
  @ApiParam({ name: 'patientId' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Timeline stats' })
  async getTimelineStats(
    @Param('patientId') patientId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      const result = await this.timeline.getTimelineStats(patientId, dateFrom, dateTo);
      return success(result, 'Timeline stats retrieved');
    } catch (error) {
      this.logger.error('getTimelineStats failed', error);
      throw error;
    }
  }

  // ==================== AUDIT TRAIL ====================

  @Get('audit/report/:reportId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit trail for a report' })
  @ApiParam({ name: 'reportId' })
  @ApiResponse({ status: 200, description: 'Report audit trail' })
  async getReportAuditTrail(@Param('reportId') reportId: string) {
    try {
      const result = await this.auditTrail.getReportAuditTrail(reportId);
      return success(result, 'Audit trail retrieved');
    } catch (error) {
      this.logger.error('getReportAuditTrail failed', error);
      throw error;
    }
  }

  @Get('audit/patient/:patientId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit trail for a patient' })
  @ApiParam({ name: 'patientId' })
  @ApiResponse({ status: 200, description: 'Patient audit trail' })
  async getPatientAuditTrail(@Param('patientId') patientId: string) {
    try {
      const result = await this.auditTrail.getPatientAuditTrail(patientId);
      return success(result, 'Patient audit trail retrieved');
    } catch (error) {
      this.logger.error('getPatientAuditTrail failed', error);
      throw error;
    }
  }

  @Get('audit/suspicious')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get suspicious activity' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Suspicious activity' })
  async getSuspiciousActivity(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const result = await this.auditTrail.getSuspiciousActivity(dateFrom, dateTo);
      return success(result, 'Suspicious activity retrieved');
    } catch (error) {
      this.logger.error('getSuspiciousActivity failed', error);
      throw error;
    }
  }

  @Get('audit/stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  async getAuditStats(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const result = await this.auditTrail.getAuditStats(dateFrom, dateTo);
      return success(result, 'Audit statistics retrieved');
    } catch (error) {
      this.logger.error('getAuditStats failed', error);
      throw error;
    }
  }

  @Get('audit/export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export audit log' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiResponse({ status: 200, description: 'Audit log export' })
  async exportAuditLog(
    @Query('format') format?: 'csv' | 'json',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('action') action?: string,
    @Res() res?: Response,
  ) {
    try {
      const result = await this.auditTrail.exportAuditLog({ dateFrom, dateTo, action }, format || 'json');
      if (res) {
        res.set({ 'Content-Type': result.mimeType, 'Content-Disposition': 'attachment; filename=\"' + result.filename + '\"' });
        res.end(result.data);
        return;
      }
      return success(result, 'Audit log exported');
    } catch (error) {
      this.logger.error('exportAuditLog failed', error);
      throw error;
    }
  }

  @Get('audit/user/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit trail for a user' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'User audit trail' })
  async getUserAuditTrail(@Param('userId') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.auditTrail.getUserAudit(userId, { page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 50 });
      return success(result.data, 'User audit trail retrieved', result.meta);
    } catch (error) {
      this.logger.error('getUserAuditTrail failed', error);
      throw error;
    }
  }

  @Get('audit/compliance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get compliance report' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Compliance report' })
  async getComplianceReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const result = await this.auditTrail.getComplianceReport(dateFrom, dateTo);
      return success(result, 'Compliance report generated');
    } catch (error) {
      this.logger.error('getComplianceReport failed', error);
      throw error;
    }
  }

  // ==================== PDF GENERATION ====================

  @Post(':id/pdf/generate')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate professional PDF for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'PDF generated' })
  async generatePdf(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const buffer = await this.pdfGenerator.generateReportPdf(report);
      return success({ reportNumber: report.reportNumber, size: buffer.length, generatedAt: new Date().toISOString() }, 'PDF generated');
    } catch (error) {
      this.logger.error('generatePdf failed', error);
      throw error;
    }
  }

  @Post(':id/pdf/sign')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign a PDF digitally' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'PDF signed' })
  async signPdf(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const reportData = report.reportNumber + ':' + report.patientId + ':' + report.status;
      const sig = await this.digitalSignature.signReport(id, reportData);
      const pdfBuffer = await this.pdfGenerator.generateReportPdf(report);
      const signedPdf = await this.pdfGenerator.embedDigitalSignature(pdfBuffer, sig.signature, sig.algorithm);
      return success({ signature: sig.signature, algorithm: sig.algorithm, signedSize: signedPdf.length }, 'PDF signed digitally');
    } catch (error) {
      this.logger.error('signPdf failed', error);
      throw error;
    }
  }

  @Post('comparison/generate-pdf')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate comparison PDF' })
  @ApiResponse({ status: 200, description: 'Comparison PDF generated' })
  async generateComparisonPdf(@Body() body: { patientId: string; testIds: string[]; dateFrom?: string; dateTo?: string }) {
    try {
      const comparisonData = await this.historicalComparison.compareResults(body.patientId, body.testIds, body.dateFrom, body.dateTo);
      const buffer = await this.pdfGenerator.generateComparisonPdf(
        { id: body.patientId }, [], comparisonData.results as Record<string, any[]>,
      );
      return success({ size: buffer.length, generatedAt: new Date().toISOString() }, 'Comparison PDF generated');
    } catch (error) {
      this.logger.error('generateComparisonPdf failed', error);
      throw error;
    }
  }

  @Post('batch/generate-pdf')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate batch PDF for multiple reports' })
  @ApiResponse({ status: 200, description: 'Batch PDF generated' })
  async generateBatchPdf(@Body() body: { reportIds: string[] }) {
    try {
      const reports = await Promise.all(body.reportIds.map((id) => this.resultsService.findOne(id)));
      const buffer = await this.pdfGenerator.generateBatchPdf(reports);
      return success({ reportCount: reports.length, size: buffer.length, generatedAt: new Date().toISOString() }, 'Batch PDF generated');
    } catch (error) {
      this.logger.error('generateBatchPdf failed', error);
      throw error;
    }
  }

  // ==================== VERIFICATION ====================

  @Get(':id/verification/qrcode')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get QR code for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'QR code' })
  async getQrCode(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const qrData = this.verification.generateQrData({
        id: report.id, reportNumber: report.reportNumber, patientId: report.patientId, createdAt: report.createdAt, status: report.status,
      });
      const qrCode = await this.verification.generateQrCode(qrData);
      return success({ qrCode, reportNumber: report.reportNumber }, 'QR code generated');
    } catch (error) {
      this.logger.error('getQrCode failed', error);
      throw error;
    }
  }

  @Get(':id/verification/barcode')
  @Roles('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get barcode for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Barcode' })
  async getBarcode(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const barcode = await this.verification.generateBarcode(report.reportNumber);
      return success({ barcode, reportNumber: report.reportNumber }, 'Barcode generated');
    } catch (error) {
      this.logger.error('getBarcode failed', error);
      throw error;
    }
  }

  @Post(':id/verification/token')
  @Roles('ADMIN', 'DOCTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create verification token for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Verification token created' })
  async createVerificationToken(@Param('id') id: string) {
    try {
      const result = await this.verification.generateVerificationToken(id);
      return success(result, 'Verification token created');
    } catch (error) {
      this.logger.error('createVerificationToken failed', error);
      throw error;
    }
  }

  @Get('verification/verify/:token')
  @ApiOperation({ summary: 'Verify a report via token' })
  @ApiParam({ name: 'token' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyReport(@Param('token') token: string) {
    try {
      const result = await this.verification.verifyReport(token);
      return success(result, result.message);
    } catch (error) {
      this.logger.error('verifyReport failed', error);
      throw error;
    }
  }

  @Get(':id/verification/url')
  @Roles('ADMIN', 'DOCTOR')
  @ApiOperation({ summary: 'Get verification URL for a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Verification URL' })
  async getVerificationUrl(@Param('id') id: string) {
    try {
      const vt = await this.verification.generateVerificationToken(id);
      return success({ token: vt.token, url: vt.url, reportId: id }, 'Verification URL generated');
    } catch (error) {
      this.logger.error('getVerificationUrl failed', error);
      throw error;
    }
  }

  // ==================== ENCRYPTION ====================

  @Post(':id/encrypt')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encrypt result data' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Data encrypted' })
  async encryptResult(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const encrypted = await this.encryption.encrypt(JSON.stringify(report));
      return success(encrypted, 'Data encrypted');
    } catch (error) {
      this.logger.error('encryptResult failed', error);
      throw error;
    }
  }

  @Post(':id/decrypt')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decrypt result data' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Data decrypted' })
  async decryptResult(@Param('id') id: string, @Body() body: { encrypted: string; iv: string; tag: string; keyId?: string }) {
    try {
      const decrypted = await this.encryption.decrypt(body.encrypted, body.iv, body.tag, body.keyId);
      return success({ data: JSON.parse(decrypted) }, 'Data decrypted');
    } catch (error) {
      this.logger.error('decryptResult failed', error);
      throw error;
    }
  }

  @Post('encryption/rotate-keys')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate encryption keys' })
  @ApiResponse({ status: 200, description: 'Keys rotated' })
  async rotateEncryptionKeys() {
    try {
      const result = await this.encryption.rotateKeys();
      return success(result, 'Encryption keys rotated');
    } catch (error) {
      this.logger.error('rotateEncryptionKeys failed', error);
      throw error;
    }
  }

  @Post(':id/anonymize')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anonymize patient data in a report' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Data anonymized' })
  async anonymizeResult(@Param('id') id: string) {
    try {
      const report = await this.resultsService.findOne(id);
      const anonymized = report.patient ? this.encryption.anonymizePatientData(report.patient) : {};
      return success(anonymized, 'Data anonymized');
    } catch (error) {
      this.logger.error('anonymizeResult failed', error);
      throw error;
    }
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard/overview')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Complete dashboard overview' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard overview' })
  async getDashboardOverview(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const stats = await this.resultsService.getReportStats(dateFrom, dateTo);
      const auditStats = await this.auditTrail.getAuditStats(dateFrom, dateTo);
      return success({ reportStats: stats, auditStats }, 'Dashboard overview');
    } catch (error) {
      this.logger.error('getDashboardOverview failed', error);
      throw error;
    }
  }

  @Get('dashboard/daily-trends')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Daily result generation trends' })
  @ApiQuery({ name: 'days', required: false })
  @ApiResponse({ status: 200, description: 'Daily trends' })
  async getDailyTrends(@Query('days') days?: string) {
    try {
      const numDays = days ? parseInt(days, 10) : 30;
      const since = new Date();
      since.setDate(since.getDate() - numDays);
      const stats = await this.resultsService.getReportStats(since.toISOString());
      return success(stats, 'Daily trends retrieved');
    } catch (error) {
      this.logger.error('getDailyTrends failed', error);
      throw error;
    }
  }

  @Get('dashboard/turnaround')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Turnaround time analytics' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Turnaround analytics' })
  async getTurnaroundAnalytics(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const reports = await this.resultsService.findAll({ dateFrom, dateTo, limit: 1000 } as any);
      const turnaroundTimes: number[] = [];
      for (const r of (reports as any).data || []) {
        if (r.createdAt && r.releasedAt) {
          turnaroundTimes.push(Math.round((new Date(r.releasedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60)));
        }
      }
      const stats = turnaroundTimes.length > 0
        ? { avg: Math.round(turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length), min: Math.min(...turnaroundTimes), max: Math.max(...turnaroundTimes), count: turnaroundTimes.length }
        : { avg: 0, min: 0, max: 0, count: 0 };
      return success(stats, 'Turnaround analytics');
    } catch (error) {
      this.logger.error('getTurnaroundAnalytics failed', error);
      throw error;
    }
  }

  @Get('dashboard/abnormal-rate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Abnormal result rate' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Abnormal rate' })
  async getAbnormalRate(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const where: any = {};
      if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
      const totalItems = await (this.resultsService as any).prisma?.reportItem?.count({ where: { report: where } }) ?? 0;
      const abnormalItems = await (this.resultsService as any).prisma?.reportItem?.count({ where: { ...where, isAbnormal: true } }) ?? 0;
      return success({ totalItems, abnormalItems, abnormalRate: totalItems > 0 ? Math.round((abnormalItems / totalItems) * 10000) / 100 : 0 }, 'Abnormal rate');
    } catch (error) {
      this.logger.error('getAbnormalRate failed', error);
      throw error;
    }
  }

  @Get('dashboard/critical-by-department')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Critical alerts by department' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Critical alerts by department' })
  async getCriticalByDepartment(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const stats = await this.auditTrail.getAuditStats(dateFrom, dateTo);
      return success(stats.actionsByType || {}, 'Critical alerts by department');
    } catch (error) {
      this.logger.error('getCriticalByDepartment failed', error);
      throw error;
    }
  }

  @Get('dashboard/doctor-performance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Doctor review performance' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Doctor performance' })
  async getDoctorPerformance(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const where: any = {};
      if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
      where.approvedById = { not: null };
      const reports = await this.resultsService.findAll({ ...where, limit: 1000 } as any);
      const doctorCounts: Record<string, number> = {};
      for (const r of (reports as any).data || []) {
        if (r.approvedById) doctorCounts[r.approvedById] = (doctorCounts[r.approvedById] || 0) + 1;
      }
      return success(doctorCounts, 'Doctor performance');
    } catch (error) {
      this.logger.error('getDoctorPerformance failed', error);
      throw error;
    }
  }

  @Get('dashboard/category-breakdown')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Results by test category' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Category breakdown' })
  async getCategoryBreakdown(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    try {
      const where: any = {};
      if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
      const items = await (this.resultsService as any).prisma?.reportItem?.findMany({
        where: { report: where },
        include: { labTest: { include: { category: true } } },
        take: 1000,
      }) ?? [];
      const categories: Record<string, number> = {};
      for (const item of items) {
        const cat = item.labTest?.category?.nameAr || item.labTest?.category?.nameEn || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
      }
      return success({ categories, totalItems: items.length }, 'Category breakdown');
    } catch (error) {
      this.logger.error('getCategoryBreakdown failed', error);
      throw error;
    }
  }
}
