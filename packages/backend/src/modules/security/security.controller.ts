import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityMonitorService } from './security-monitor.service';
import { SIEMService } from './siem.service';
import { IncidentResponseService } from './incident-response.service';
import { BackupDRService } from './backup-dr.service';
import { KeyRotationService } from './key-rotation.service';
import { ComplianceChecklistService } from './compliance-checklist';
import { SecurityPoliciesService } from './security-policies.service';
import { WAFConfigService } from './waf/waf.config';
import {
  SecurityAlertQueryDto, DismissAlertDto, SecurityReportDto,
  IncidentCreateDto, IncidentUpdateDto, BackupRequestDto,
  DRExecuteDto, KeyRotationRequestDto, SIEMEventQueryDto,
  ComplianceFrameworkQueryDto, WAFEvaluateDto, SecurityDashboardQueryDto,
} from './dto/security.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('security')
export class SecurityController {
  constructor(
    private readonly monitor: SecurityMonitorService,
    private readonly siem: SIEMService,
    private readonly ir: IncidentResponseService,
    private readonly backupDr: BackupDRService,
    private readonly keyRotation: KeyRotationService,
    private readonly compliance: ComplianceChecklistService,
    private readonly policies: SecurityPoliciesService,
    private readonly waf: WAFConfigService,
  ) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get security dashboard metrics' })
  async getDashboard(@Query() query: SecurityDashboardQueryDto): Promise<any> {
    const [securityDashboard, incidentDashboard, backupHealth, keyHealth, complianceScore, wafConfig] = await Promise.all([
      this.monitor.getSecurityDashboard(query.period || '24h'),
      this.ir.getDashboard(),
      this.backupDr.getHealth(),
      this.keyRotation.getKeyHealth(),
      this.compliance.getOverallComplianceScore(),
      Promise.resolve(this.waf.getConfig()),
    ]);
    return {
      success: true,
      data: {
        security: securityDashboard,
        incidents: incidentDashboard,
        backups: backupHealth,
        keys: keyHealth,
        compliance: complianceScore,
        waf: { mode: wafConfig.mode, rulesEnabled: wafConfig.enabled, paranoiaLevel: wafConfig.paranoiaLevel },
      },
    };
  }

  @Get('monitor/alerts')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get security alerts' })
  async getAlerts(@Query() query: SecurityAlertQueryDto) {
    const result = await this.monitor.getSecurityAlerts(query.userId || '', query);
    return { success: true, ...result };
  }

  @Patch('monitor/alerts/dismiss')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Dismiss security alert' })
  async dismissAlert(@Body() dto: DismissAlertDto, @Query('userId') userId: string) {
    const result = await this.monitor.dismissAlert(dto.alertId, userId);
    return { success: true, data: { dismissed: result } };
  }

  @Get('monitor/report')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Generate security report' })
  async generateReport(@Query() query: SecurityReportDto) {
    const report = await this.monitor.generateSecurityReport(query.dateFrom, query.dateTo);
    return { success: true, data: report };
  }

  @Get('monitor/suspicious')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get suspicious activities' })
  async getSuspiciousActivities(@Query() query: any): Promise<any> {
    const result = await this.monitor.getSuspiciousActivities(query);
    return { success: true, ...result };
  }

  @Post('siem/emit')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Emit SIEM event' })
  async emitSIEMEvent(@Body() event: any) {
    await this.siem.emit(event);
    return { success: true, data: { emitted: true } };
  }

  @Get('siem/events')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get recent SIEM events' })
  async getSIEMEvents(@Query() query: SIEMEventQueryDto) {
    const result = await this.siem.getRecentEvents(query.limit || 50, query.offset || 0);
    return { success: true, ...result };
  }

  @Get('siem/correlation-rules')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get SIEM correlation rules' })
  async getCorrelationRules() {
    const rules = await this.siem.getCorrelationRules();
    return { success: true, data: rules };
  }

  @Get('siem/correlation-matches')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get SIEM correlation matches' })
  async getCorrelationMatches(@Query('limit') limit?: number): Promise<any> {
    const matches = await this.siem.getCorrelationMatches(limit || 20);
    return { success: true, data: matches };
  }

  @Get('siem/providers')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get SIEM provider status' })
  async getProviderStatus() {
    const status = await this.siem.getProviderStatus();
    return { success: true, data: status };
  }

  @Get('siem/ping')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Ping SIEM providers' })
  async pingSIEMProviders() {
    const status = await this.siem.ping();
    return { success: true, data: status };
  }

  @Post('incidents')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Create security incident' })
  async createIncident(@Body() dto: IncidentCreateDto) {
    const incident = await this.ir.createIncident(dto);
    return { success: true, data: incident };
  }

  @Get('incidents')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all incidents' })
  async getIncidents(@Query() query: any) {
    const result = await this.ir.getIncidents(query);
    return { success: true, ...result };
  }

  @Get('incidents/dashboard')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get incident dashboard' })
  async getIncidentDashboard() {
    const dashboard = await this.ir.getDashboard();
    return { success: true, data: dashboard };
  }

  @Get('incidents/sla-report')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get incident SLA report' })
  async getSLARepoort() {
    const report = await this.ir.getSLAReport();
    return { success: true, data: report };
  }

  @Get('incidents/:id')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get incident details' })
  async getIncident(@Param('id') id: string) {
    const incident = await this.ir.getIncident(id);
    return { success: true, data: incident };
  }

  @Patch('incidents/:id')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Update incident' })
  async updateIncident(@Param('id') id: string, @Body() dto: IncidentUpdateDto, @Query('actor') actor: string) {
    const update: any = { ...dto };
    const incident = await this.ir.updateIncident(id, update, actor || 'system');
    return { success: true, data: incident };
  }

  @Get('playbooks')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get all incident playbooks' })
  async getPlaybooks() {
    const playbooks = await this.ir.getAllPlaybooks();
    return { success: true, data: playbooks };
  }

  @Get('playbooks/:category')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get playbook by category' })
  async getPlaybook(@Param('category') category: string) {
    const playbook = await this.ir.getPlaybook(category);
    return { success: true, data: playbook };
  }

  @Post('backup')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Perform backup' })
  async performBackup(@Body() dto: BackupRequestDto) {
    const backup = await this.backupDr.performBackup(dto.type);
    return { success: true, data: backup };
  }

  @Get('backup/history')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get backup history' })
  async getBackupHistory(@Query('limit') limit?: number) {
    const history = await this.backupDr.getBackupHistory(limit || 50);
    return { success: true, data: history };
  }

  @Get('backup/stats')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get backup statistics' })
  async getBackupStats() {
    const stats = await this.backupDr.getBackupStats();
    return { success: true, data: stats };
  }

  @Get('backup/config')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get backup configuration' })
  async getBackupConfig() {
    const config = this.backupDr.getBackupConfigs();
    return { success: true, data: config };
  }

  @Post('backup/dr-execute')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Execute DR plan' })
  async executeDRPlan(@Body() dto: DRExecuteDto) {
    const result = await this.backupDr.executeDRPlan(dto.planId);
    return { success: true, data: result };
  }

  @Post('backup/dr-test')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Test DR plan' })
  async testDRPlan(@Body() dto: DRExecuteDto) {
    const result = await this.backupDr.testDRPlan(dto.planId);
    return { success: true, data: result };
  }

  @Get('backup/dr-plans')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get DR plans' })
  async getDRPlans() {
    const plans = this.backupDr.getDRPlans();
    return { success: true, data: plans };
  }

  @Get('backup/dr-plans/:id')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get DR plan details' })
  async getDRPlan(@Param('id') id: string) {
    const plan = this.backupDr.getDRPlanById(id);
    return { success: true, data: plan };
  }

  @Post('keys/rotate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rotate encryption key' })
  async rotateKey(@Body() dto: KeyRotationRequestDto) {
    const key = await this.keyRotation.rotateKey(dto.keyId);
    return { success: true, data: key };
  }

  @Post('keys/rotate-all')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rotate all encryption keys' })
  async rotateAllKeys() {
    const result = await this.keyRotation.rotateAllKeys();
    return { success: true, data: result };
  }

  @Post('keys/rotate-service/:service')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rotate keys for service' })
  async rotateServiceKeys(@Param('service') service: string) {
    const keys = await this.keyRotation.rotateKeysForService(service);
    return { success: true, data: keys };
  }

  @Get('keys')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get key health status' })
  async getKeyHealth() {
    const health = await this.keyRotation.getKeyHealth();
    return { success: true, data: health };
  }

  @Get('keys/policies')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get key rotation policies' })
  async getKeyPolicies() {
    const policies = await this.keyRotation.getPolicies();
    return { success: true, data: policies };
  }

  @Get('keys/history')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get key rotation history' })
  async getKeyHistory(@Query('limit') limit?: number) {
    const history = await this.keyRotation.getRotationHistory(limit || 50);
    return { success: true, data: history };
  }

  @Post('keys/compromised/:keyId')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Mark key as compromised' })
  async markKeyCompromised(@Param('keyId') keyId: string) {
    const key = await this.keyRotation.markKeyCompromised(keyId);
    return { success: true, data: key };
  }

  @Get('compliance')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get compliance overview' })
  async getComplianceOverview() {
    const [summaries, overall, criticalIssues, trends] = await Promise.all([
      Promise.resolve(this.compliance.getAllFrameworkSummaries()),
      Promise.resolve(this.compliance.getOverallComplianceScore()),
      Promise.resolve(this.compliance.getCriticalIssues()),
      Promise.resolve(this.compliance.getComplianceTrends()),
    ]);
    return { success: true, data: { frameworks: summaries, overall, criticalIssues, trends } };
  }

  @Get('compliance/framework/:framework')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get compliance by framework' })
  async getComplianceByFramework(@Param('framework') framework: string) {
    const categories = this.compliance.getFrameworkCategories(framework as any);
    const summary = this.compliance.getFrameworkSummary(framework as any);
    return { success: true, data: { summary, categories } };
  }

  @Get('compliance/controls')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get all compliance controls' })
  async getAllControls(@Query() query: ComplianceFrameworkQueryDto) {
    const controls = query.framework
      ? this.compliance.getControlsByFramework(query.framework as any)
      : this.compliance.getAllControls();
    return { success: true, data: controls };
  }

  @Get('policies')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get all security policies' })
  async getPolicies() {
    const policies = this.policies.getPolicies();
    const stats = this.policies.getPolicyCount();
    return { success: true, data: { policies, stats } };
  }

  @Get('policies/:id')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get policy by ID' })
  async getPolicy(@Param('id') id: string) {
    const policy = this.policies.getPolicy(id);
    return { success: true, data: policy };
  }

  @Get('policies/review-due')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get policies due for review' })
  async getPoliciesDueForReview(@Query('days') days?: number) {
    const policies = this.policies.getPoliciesDueForReview(days || 30);
    return { success: true, data: policies };
  }

  @Post('waf/evaluate')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Evaluate request against WAF rules' })
  async evaluateWAF(@Body() dto: WAFEvaluateDto) {
    const result = this.waf.evaluateRequest(dto as any);
    return { success: true, data: result };
  }

  @Get('waf/config')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get WAF configuration' })
  async getWAFConfig() {
    const config = this.waf.getConfig();
    return { success: true, data: config };
  }

  @Get('waf/rules')
  @Roles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Get WAF rules' })
  async getWAFRules() {
    const config = this.waf.getConfig();
    return { success: true, data: { owasp: config.rules, custom: config.customRules } };
  }
}
