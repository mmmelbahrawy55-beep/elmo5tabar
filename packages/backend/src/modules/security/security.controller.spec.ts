import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from './security.controller';
import { SecurityMonitorService } from './security-monitor.service';
import { SIEMService } from './siem.service';
import { IncidentResponseService } from './incident-response.service';
import { BackupDRService } from './backup-dr.service';
import { KeyRotationService } from './key-rotation.service';
import { ComplianceChecklistService } from './compliance-checklist';
import { SecurityPoliciesService } from './security-policies.service';
import { WAFConfigService } from './waf/waf.config';

describe('SecurityController', () => {
  let controller: SecurityController;

  const mockMonitor = {
    getSecurityDashboard: jest.fn().mockResolvedValue({ totalAlerts: 15, criticalAlerts: 3 }),
    getSecurityAlerts: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    dismissAlert: jest.fn().mockResolvedValue(true),
    generateSecurityReport: jest.fn().mockResolvedValue({ reportUrl: 'http://example.com/report.pdf' }),
    getSuspiciousActivities: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  };

  const mockSIEM = {
    emit: jest.fn().mockResolvedValue(undefined),
    getRecentEvents: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    getCorrelationRules: jest.fn().mockResolvedValue([{ id: 'rule-1', name: 'Brute Force Detection' }]),
    getCorrelationMatches: jest.fn().mockResolvedValue([{ id: 'match-1', rule: 'rule-1' }]),
    getProviderStatus: jest.fn().mockResolvedValue({ connected: true }),
    ping: jest.fn().mockResolvedValue({ status: 'ok' }),
  };

  const mockIR = {
    createIncident: jest.fn().mockResolvedValue({ id: 'inc-1', severity: 'HIGH' }),
    getIncidents: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getDashboard: jest.fn().mockResolvedValue({ openIncidents: 5, resolvedToday: 2 }),
    getSLAReport: jest.fn().mockResolvedValue({ avgResponseTime: 30 }),
    getIncident: jest.fn().mockResolvedValue({ id: 'inc-1', timeline: [] }),
    updateIncident: jest.fn().mockResolvedValue({ id: 'inc-1', status: 'RESOLVED' }),
    getAllPlaybooks: jest.fn().mockResolvedValue([{ category: 'PHISHING', steps: [] }]),
    getPlaybook: jest.fn().mockResolvedValue({ category: 'PHISHING', steps: [] }),
  };

  const mockBackupDR = {
    performBackup: jest.fn().mockResolvedValue({ id: 'backup-1', status: 'COMPLETED' }),
    getBackupHistory: jest.fn().mockResolvedValue([{ id: 'backup-1', status: 'COMPLETED' }]),
    getBackupStats: jest.fn().mockResolvedValue({ totalBackups: 50, lastBackupAt: new Date() }),
    getBackupConfigs: jest.fn().mockResolvedValue({ frequency: 'daily', retention: 30 }),
    executeDRPlan: jest.fn().mockResolvedValue({ planId: 'plan-1', status: 'EXECUTED' }),
    testDRPlan: jest.fn().mockResolvedValue({ planId: 'plan-1', status: 'TESTED' }),
    getDRPlans: jest.fn().mockResolvedValue([{ id: 'plan-1', name: 'DR Plan A' }]),
    getDRPlanById: jest.fn().mockResolvedValue({ id: 'plan-1', name: 'DR Plan A', steps: [] }),
    getHealth: jest.fn().mockResolvedValue({ healthy: true }),
  };

  const mockKeyRotation = {
    rotateKey: jest.fn().mockResolvedValue({ keyId: 'key-1', version: 2 }),
    rotateAllKeys: jest.fn().mockResolvedValue({ rotated: 5, failed: 0 }),
    rotateKeysForService: jest.fn().mockResolvedValue({ rotated: 2 }),
    getKeyHealth: jest.fn().mockResolvedValue({ healthy: true, keys: [] }),
    getPolicies: jest.fn().mockResolvedValue({ rotationIntervalDays: 90 }),
    getRotationHistory: jest.fn().mockResolvedValue([{ keyId: 'key-1', rotatedAt: new Date() }]),
    markKeyCompromised: jest.fn().mockResolvedValue({ keyId: 'key-1', status: 'COMPROMISED' }),
  };

  const mockCompliance = {
    getAllFrameworkSummaries: jest.fn().mockResolvedValue([{ framework: 'HIPAA', score: 85 }]),
    getOverallComplianceScore: jest.fn().mockResolvedValue({ overall: 87 }),
    getCriticalIssues: jest.fn().mockResolvedValue([{ issue: 'Missing audit logs', severity: 'HIGH' }]),
    getComplianceTrends: jest.fn().mockResolvedValue({ last6Months: [] }),
    getFrameworkCategories: jest.fn().mockResolvedValue([]),
    getFrameworkSummary: jest.fn().mockResolvedValue({ score: 85 }),
    getControlsByFramework: jest.fn().mockResolvedValue([]),
    getAllControls: jest.fn().mockResolvedValue([]),
  };

  const mockPolicies = {
    getPolicies: jest.fn().mockResolvedValue([{ id: 'pol-1', name: 'Password Policy' }]),
    getPolicyCount: jest.fn().mockResolvedValue({ total: 10 }),
    getPolicy: jest.fn().mockResolvedValue({ id: 'pol-1', name: 'Password Policy' }),
    getPoliciesDueForReview: jest.fn().mockResolvedValue([{ id: 'pol-2' }]),
  };

  const mockWAF = {
    getConfig: jest.fn().mockReturnValue({ mode: 'blocking', enabled: true, paranoiaLevel: 2, rules: [], customRules: [] }),
    evaluateRequest: jest.fn().mockReturnValue({ blocked: false, score: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [
        { provide: SecurityMonitorService, useValue: mockMonitor },
        { provide: SIEMService, useValue: mockSIEM },
        { provide: IncidentResponseService, useValue: mockIR },
        { provide: BackupDRService, useValue: mockBackupDR },
        { provide: KeyRotationService, useValue: mockKeyRotation },
        { provide: ComplianceChecklistService, useValue: mockCompliance },
        { provide: SecurityPoliciesService, useValue: mockPolicies },
        { provide: WAFConfigService, useValue: mockWAF },
      ],
    }).compile();

    controller = module.get(SecurityController);
    jest.clearAllMocks();
  });

  it('should GET /security/dashboard', async () => {
    const result = await controller.getDashboard({ period: '24h' } as any);
    expect(result.success).toBe(true);
    expect(result.data.security.totalAlerts).toBe(15);
  });

  it('should GET /security/monitor/alerts', async () => {
    const result = await controller.getAlerts({ severity: 'HIGH' } as any);
    expect(result.success).toBe(true);
  });

  it('should PATCH /security/monitor/alerts/dismiss', async () => {
    const result = await controller.dismissAlert({ alertId: 'alert-1', reason: 'False positive' } as any, 'user-1');
    expect(result.success).toBe(true);
  });

  it('should GET /security/monitor/report', async () => {
    const result = await controller.generateReport({ dateFrom: '2025-01-01', dateTo: '2025-01-31' } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/monitor/suspicious', async () => {
    const result = await controller.getSuspiciousActivities({});
    expect(result.success).toBe(true);
  });

  it('should POST /security/siem/emit', async () => {
    const result = await controller.emitSIEMEvent({ type: 'LOGIN_FAILURE', userId: 'user-1' });
    expect(result.success).toBe(true);
  });

  it('should GET /security/siem/events', async () => {
    const result = await controller.getSIEMEvents({ limit: 50, offset: 0 } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/siem/correlation-rules', async () => {
    const result = await controller.getCorrelationRules();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should GET /security/siem/correlation-matches', async () => {
    const result = await controller.getCorrelationMatches(20);
    expect(result.success).toBe(true);
  });

  it('should GET /security/siem/providers', async () => {
    const result = await controller.getProviderStatus();
    expect(result.success).toBe(true);
  });

  it('should GET /security/siem/ping', async () => {
    const result = await controller.pingSIEMProviders();
    expect(result.success).toBe(true);
  });

  it('should POST /security/incidents', async () => {
    const result = await controller.createIncident({ title: 'Phishing attempt', severity: 'HIGH', category: 'PHISHING' } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/incidents', async () => {
    const result = await controller.getIncidents({});
    expect(result.success).toBe(true);
  });

  it('should GET /security/incidents/dashboard', async () => {
    const result = await controller.getIncidentDashboard();
    expect(result.success).toBe(true);
  });

  it('should GET /security/incidents/sla-report', async () => {
    const result = await controller.getSLARepoort();
    expect(result.success).toBe(true);
  });

  it('should GET /security/incidents/:id', async () => {
    const result = await controller.getIncident('inc-1');
    expect(result.success).toBe(true);
  });

  it('should PATCH /security/incidents/:id', async () => {
    const result = await controller.updateIncident('inc-1', { status: 'RESOLVED' } as any, 'admin');
    expect(result.success).toBe(true);
  });

  it('should GET /security/playbooks', async () => {
    const result = await controller.getPlaybooks();
    expect(result.success).toBe(true);
  });

  it('should GET /security/playbooks/:category', async () => {
    const result = await controller.getPlaybook('PHISHING');
    expect(result.success).toBe(true);
  });

  it('should POST /security/backup', async () => {
    const result = await controller.performBackup({ type: 'FULL', description: 'Weekly backup' } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/backup/history', async () => {
    const result = await controller.getBackupHistory(50);
    expect(result.success).toBe(true);
  });

  it('should GET /security/backup/stats', async () => {
    const result = await controller.getBackupStats();
    expect(result.success).toBe(true);
  });

  it('should GET /security/backup/config', async () => {
    const result = await controller.getBackupConfig();
    expect(result.success).toBe(true);
  });

  it('should POST /security/backup/dr-execute', async () => {
    const result = await controller.executeDRPlan({ planId: 'plan-1' } as any);
    expect(result.success).toBe(true);
  });

  it('should POST /security/backup/dr-test', async () => {
    const result = await controller.testDRPlan({ planId: 'plan-1' } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/backup/dr-plans', async () => {
    const result = await controller.getDRPlans();
    expect(result.success).toBe(true);
  });

  it('should GET /security/backup/dr-plans/:id', async () => {
    const result = await controller.getDRPlan('plan-1');
    expect(result.success).toBe(true);
  });

  it('should POST /security/keys/rotate', async () => {
    const result = await controller.rotateKey({ keyId: 'key-1', reason: 'Scheduled rotation', rotatedBy: 'admin' } as any);
    expect(result.success).toBe(true);
  });

  it('should POST /security/keys/rotate-all', async () => {
    const result = await controller.rotateAllKeys();
    expect(result.success).toBe(true);
  });

  it('should POST /security/keys/rotate-service/:service', async () => {
    const result = await controller.rotateServiceKeys('payment-gateway');
    expect(result.success).toBe(true);
  });

  it('should GET /security/keys', async () => {
    const result = await controller.getKeyHealth();
    expect(result.success).toBe(true);
  });

  it('should GET /security/keys/policies', async () => {
    const result = await controller.getKeyPolicies();
    expect(result.success).toBe(true);
  });

  it('should GET /security/keys/history', async () => {
    const result = await controller.getKeyHistory(50);
    expect(result.success).toBe(true);
  });

  it('should POST /security/keys/compromised/:keyId', async () => {
    const result = await controller.markKeyCompromised('key-1');
    expect(result.success).toBe(true);
  });

  it('should GET /security/compliance', async () => {
    const result = await controller.getComplianceOverview();
    expect(result.success).toBe(true);
  });

  it('should GET /security/compliance/framework/:framework', async () => {
    const result = await controller.getComplianceByFramework('HIPAA');
    expect(result.success).toBe(true);
  });

  it('should GET /security/compliance/controls', async () => {
    const result = await controller.getAllControls({});
    expect(result.success).toBe(true);
  });

  it('should GET /security/policies', async () => {
    const result = await controller.getPolicies();
    expect(result.success).toBe(true);
  });

  it('should GET /security/policies/:id', async () => {
    const result = await controller.getPolicy('pol-1');
    expect(result.success).toBe(true);
  });

  it('should GET /security/policies/review-due', async () => {
    const result = await controller.getPoliciesDueForReview(30);
    expect(result.success).toBe(true);
  });

  it('should POST /security/waf/evaluate', async () => {
    const result = await controller.evaluateWAF({ url: '/api/login', method: 'POST', headers: {}, body: '' } as any);
    expect(result.success).toBe(true);
  });

  it('should GET /security/waf/config', async () => {
    const result = await controller.getWAFConfig();
    expect(result.success).toBe(true);
  });

  it('should GET /security/waf/rules', async () => {
    const result = await controller.getWAFRules();
    expect(result.success).toBe(true);
  });
});
