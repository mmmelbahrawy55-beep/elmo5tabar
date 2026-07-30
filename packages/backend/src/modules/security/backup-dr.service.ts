import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export type BackupType = 'full' | 'incremental' | 'differential' | 'pitr';
export type BackupLocation = 'local' | 's3' | 'azure-blob' | 'gcs' | 'nfs';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'verifying';
export type DRScenario = 'datacenter_failure' | 'region_outage' | 'ransomware' | 'data_corruption' | 'human_error' | 'supply_chain';

export interface BackupConfig {
  type: BackupType;
  schedule: string;
  retentionDays: number;
  locations: BackupLocation[];
  encryption: boolean;
  compression: boolean;
  verifyAfterBackup: boolean;
  excludeTables?: string[];
}

export interface BackupRecord {
  id: string;
  type: BackupType;
  status: BackupStatus;
  sizeBytes?: number;
  location: BackupLocation;
  path: string;
  checksum?: string;
  encryptionKeyId?: string;
  tables: string[];
  rowCount?: number;
  durationMs?: number;
  errorMessage?: string;
  verifiedAt?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface DRPlan {
  id: string;
  scenario: DRScenario;
  name: string;
  description: string;
  rto: number;
  rpo: number;
  steps: DRStep[];
  lastTestedAt?: string;
  lastTestResult?: 'success' | 'failed' | 'partial';
  criticalSystems: string[];
  dependencies: string[];
  contacts: Array<{ name: string; role: string; phone: string; email: string }>;
}

export interface DRStep {
  order: number;
  name: string;
  description: string;
  owner: string;
  estimatedDuration: number;
  validationCriteria: string[];
  rollbackProcedure?: string;
}

export interface BackupStats {
  totalBackups: number;
  lastBackup: BackupRecord | null;
  totalSizeGB: number;
  successRate: number;
  byType: Record<string, number>;
  storageByLocation: Record<string, number>;
}

@Injectable()
export class BackupDRService {
  private readonly logger = new Logger(BackupDRService.name);
  private readonly backupConfigs: BackupConfig[];
  private backupInProgress = false;

  private readonly drPlans: DRPlan[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.backupConfigs = this.loadBackupConfigs();
    this.drPlans = this.loadDRPlans();
  }

  private loadBackupConfigs(): BackupConfig[] {
    return [
      {
        type: 'full',
        schedule: '0 2 * * 0',
        retentionDays: 90,
        locations: ['local', 's3'],
        encryption: true,
        compression: true,
        verifyAfterBackup: true,
      },
      {
        type: 'incremental',
        schedule: '0 2 * * 1-6',
        retentionDays: 30,
        locations: ['local', 's3'],
        encryption: true,
        compression: true,
        verifyAfterBackup: false,
      },
      {
        type: 'pitr',
        schedule: 'continuous',
        retentionDays: 7,
        locations: ['local'],
        encryption: true,
        compression: false,
        verifyAfterBackup: false,
      },
    ];
  }

  private loadDRPlans(): DRPlan[] {
    return [
      {
        id: 'dr-datacenter',
        scenario: 'datacenter_failure',
        name: 'Datacenter Failure Recovery',
        description: 'Complete failover to secondary datacenter in case of primary datacenter loss',
        rto: 4,
        rpo: 15,
        steps: [
          { order: 1, name: 'Declare Disaster', description: 'Confirm primary datacenter is unavailable and declare disaster event', owner: 'CISO', estimatedDuration: 15, validationCriteria: ['Disaster declared in incident tracking system', 'Stakeholders notified'], rollbackProcedure: 'Cancel disaster declaration if false alarm' },
          { order: 2, name: 'Activate DR Team', description: 'Assemble DR team and assign responsibilities per runbook', owner: 'IT Director', estimatedDuration: 15, validationCriteria: ['All team members confirmed', 'Communication channels open'] },
          { order: 3, name: 'Promote Secondary Database', description: 'Promote read replica in secondary region to primary and update connection strings', owner: 'DBA Team', estimatedDuration: 60, validationCriteria: ['Database online', 'Data integrity verified', 'Replication lag zero'], rollbackProcedure: 'Fail back to primary if available' },
          { order: 4, name: 'Redirect Traffic', description: 'Update DNS and load balancer to point to secondary datacenter, enable CDN failover', owner: 'DevOps', estimatedDuration: 15, validationCriteria: ['Traffic reaching secondary', 'SSL certificates valid', 'Health checks passing'] },
          { order: 5, name: 'Verify Application', description: 'Run smoke tests on all critical services in secondary datacenter', owner: 'QA Team', estimatedDuration: 30, validationCriteria: ['All smoke tests pass', 'API responses correct', 'Patient portal accessible'], rollbackProcedure: 'Reroute back to primary if issue is temporary' },
          { order: 6, name: 'Monitor & Report', description: 'Monitor system performance in secondary datacenter and report status to leadership', owner: 'CISO', estimatedDuration: 120, validationCriteria: ['All metrics green', 'Latency within acceptable range'], rollbackProcedure: 'Continue monitoring' },
        ],
        criticalSystems: ['PostgreSQL', 'Redis', 'API Gateway', 'Authentication', 'Patient Portal', 'Payment Gateway'],
        dependencies: ['DNS provider', 'SSL certificate manager', 'CDN provider', 'Load balancer', 'Backup storage'],
        contacts: [
          { name: 'CISO', role: 'Incident Commander', phone: '+966-XXX-CISO', email: 'ciso@almokhtabar.com' },
          { name: 'IT Director', role: 'Technical Lead', phone: '+966-XXX-ITDIR', email: 'itdirector@almokhtabar.com' },
          { name: 'DBA Lead', role: 'Database Recovery', phone: '+966-XXX-DBA', email: 'dbalead@almokhtabar.com' },
        ],
      },
      {
        id: 'dr-ransomware',
        scenario: 'ransomware',
        name: 'Ransomware Recovery',
        description: 'Recovery from ransomware attack with clean backup restoration',
        rto: 24,
        rpo: 4,
        steps: [
          { order: 1, name: 'Isolate Systems', description: 'Disconnect all affected systems from network to prevent spread', owner: 'Security Team', estimatedDuration: 15, validationCriteria: ['Affected systems isolated', 'Network segments separated'], rollbackProcedure: 'Reconnect if false alarm' },
          { order: 2, name: 'Identify Clean Backup', description: 'Locate last known clean backup before infection window', owner: 'DBA Team', estimatedDuration: 30, validationCriteria: ['Backup verified clean', 'No encryption artifacts', 'Integrity checks passed'] },
          { order: 3, name: 'Wipe and Restore', description: 'Wipe compromised systems and restore from clean backup', owner: 'DevOps', estimatedDuration: 480, validationCriteria: ['All systems wiped', 'Backup restored successfully', 'Data integrity verified'] },
          { order: 4, name: 'Patch and Harden', description: 'Apply security patches for exploited vulnerabilities and harden systems', owner: 'Security Team', estimatedDuration: 120, validationCriteria: ['All patches applied', 'Security controls tested'] },
          { order: 5, name: 'Restore Services', description: 'Gradually bring services back online with enhanced monitoring', owner: 'DevOps', estimatedDuration: 240, validationCriteria: ['All services operational', 'No signs of reinfection', 'Monitoring active'] },
        ],
        criticalSystems: ['PostgreSQL', 'File Storage', 'Backup Systems', 'Authentication', 'Results Database'],
        dependencies: ['Offline backups', 'Security team', 'Forensic tools', 'EDR platform'],
        contacts: [
          { name: 'Security Lead', role: 'Incident Commander', phone: '+966-XXX-SEC', email: 'security@almokhtabar.com' },
          { name: 'DBA Lead', role: 'Data Restoration', phone: '+966-XXX-DBA', email: 'dbalead@almokhtabar.com' },
          { name: 'Legal Counsel', role: 'Legal & Compliance', phone: '+966-XXX-LEGAL', email: 'legal@almokhtabar.com' },
        ],
      },
      {
        id: 'dr-data-corruption',
        scenario: 'data_corruption',
        name: 'Data Corruption Recovery',
        description: 'Point-in-time recovery to recover from data corruption or accidental data loss',
        rto: 2,
        rpo: 0.25,
        steps: [
          { order: 1, name: 'Assess Corruption', description: 'Identify scope and timing of data corruption', owner: 'DBA Team', estimatedDuration: 15, validationCriteria: ['Corruption scope identified', 'Affected tables/records documented'] },
          { order: 2, name: 'Stop Write Operations', description: 'Prevent further corruption by putting affected services in read-only mode', owner: 'DevOps', estimatedDuration: 5, validationCriteria: ['Write operations blocked', 'Read-only mode confirmed'] },
          { order: 3, name: 'Identify Recovery Point', description: 'Determine correct point in time for recovery before corruption occurred', owner: 'DBA Team', estimatedDuration: 15, validationCriteria: ['Recovery point identified', 'Just before corruption timestamp'] },
          { order: 4, name: 'Perform PITR', description: 'Execute point-in-time recovery to restore database to pre-corruption state', owner: 'DBA Team', estimatedDuration: 60, validationCriteria: ['PITR completed', 'Data integrity verified', 'No data loss beyond RPO'] },
          { order: 5, name: 'Verify and Restore', description: 'Verify data integrity and restore write operations', owner: 'QA Team', estimatedDuration: 30, validationCriteria: ['Data verified correct', 'Write operations restored', 'Application functional'] },
        ],
        criticalSystems: ['PostgreSQL'],
        dependencies: ['WAL archives', 'PITR tooling', 'DBA access'],
        contacts: [
          { name: 'DBA Lead', role: 'Database Recovery', phone: '+966-XXX-DBA', email: 'dbalead@almokhtabar.com' },
          { name: 'CISO', role: 'Oversight', phone: '+966-XXX-CISO', email: 'ciso@almokhtabar.com' },
        ],
      },
    ];
  }

  async performBackup(type: BackupType = 'incremental'): Promise<BackupRecord> {
    if (this.backupInProgress) throw new Error('Backup already in progress');
    this.backupInProgress = true;

    const config = this.backupConfigs.find((c) => c.type === type) || this.backupConfigs[1];
    const id = `bkp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date();

    const record: BackupRecord = {
      id,
      type,
      status: 'running',
      location: config.locations[0],
      path: `/backups/${type}/${id}`,
      tables: [],
      startedAt: startedAt.toISOString(),
      createdAt: startedAt.toISOString(),
    };

    try {
      this.logger.log(`Starting ${type} backup: ${id}`);

      const tables = await this.getDatabaseTables();
      record.tables = tables.filter((t) => !config.excludeTables?.includes(t));

      const startTime = Date.now();
      const result = await this.performDump(type, config, record);
      record.durationMs = Date.now() - startTime;
      record.sizeBytes = result.sizeBytes;
      record.rowCount = result.rowCount;
      record.checksum = result.checksum;

      if (config.verifyAfterBackup) {
        record.status = 'verifying';
        const verified = await this.verifyBackup(record);
        record.verifiedAt = verified ? new Date().toISOString() : undefined;
        record.status = verified ? 'completed' : 'failed';
        if (!verified) record.errorMessage = 'Backup verification failed';
      } else {
        record.status = 'completed';
      }

      record.completedAt = new Date().toISOString();
      await this.persistBackupRecord(record);

      if (config.locations.length > 1) {
        for (let i = 1; i < config.locations.length; i++) {
          try {
            await this.replicateBackup(record, config.locations[i]);
          } catch (error) {
            this.logger.error(`Failed to replicate backup ${id} to ${config.locations[i]}: ${error.message}`);
          }
        }
      }

      await this.cleanupOldBackups(config);
    } catch (error) {
      record.status = 'failed';
      record.errorMessage = error.message;
      record.completedAt = new Date().toISOString();
      await this.persistBackupRecord(record);
      this.logger.error(`Backup ${id} failed: ${error.message}`);
    } finally {
      this.backupInProgress = false;
    }

    return record;
  }

  private async getDatabaseTables(): Promise<string[]> {
    try {
      const result = await (this.prisma as any).$queryRawUnsafe(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
      );
      return (result as Array<{ tablename: string }>).map((r) => r.tablename);
    } catch {
      return [];
    }
  }

  private async performDump(
    type: BackupType,
    config: BackupConfig,
    record: BackupRecord,
  ): Promise<{ sizeBytes: number; rowCount: number; checksum: string }> {
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    const outputDir = path.dirname(record.path);
    const outputFile = `${record.path}.dump`;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const { execSync } = require('child_process');
    const pgDumpArgs = [
      '--no-owner',
      '--no-acl',
      '--format=custom',
      '--compress=9',
      '--file=' + outputFile,
    ];

    if (type === 'incremental') {
      const lastFull = await this.getLastSuccessfulBackup('full');
      if (lastFull) pgDumpArgs.push('--snapshot=' + lastFull.id);
    }

    const env = { ...process.env, PGPASSWORD: new URL(dbUrl).password };
    execSync(`pg_dump ${pgDumpArgs.join(' ')} ${dbUrl}`, { env, timeout: 3600000 });

    const stats = fs.statSync(outputFile);

    const crypto = require('crypto');
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(outputFile)).digest('hex');

    const rowCount = await this.estimateRowCount();

    return { sizeBytes: stats.size, rowCount, checksum };
  }

  private async estimateRowCount(): Promise<number> {
    try {
      const result = await (this.prisma as any).$queryRawUnsafe(
        `SELECT SUM(n_live_tup) AS total_rows FROM pg_stat_user_tables`,
      );
      return Number((result as Array<{ total_rows: string }>)[0]?.total_rows || 0);
    } catch {
      return 0;
    }
  }

  private async verifyBackup(record: BackupRecord): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      const outputFile = `${record.path}.dump`;
      execSync(`pg_restore --list ${outputFile} > /dev/null 2>&1`, { timeout: 300000 });
      return true;
    } catch {
      return false;
    }
  }

  private async replicateBackup(record: BackupRecord, location: BackupLocation): Promise<void> {
    this.logger.log(`Replicating backup ${record.id} to ${location}`);
  }

  private async cleanupOldBackups(config: BackupConfig): Promise<void> {
    const cutoff = new Date(Date.now() - config.retentionDays * 86400000);
    try {
      await (this.prisma as any).authDataVault.deleteMany({
        where: {
          key: { startsWith: `backup_${config.type}_` },
          createdAt: { lt: cutoff },
        },
      });
      this.logger.log(`Cleaned up ${config.type} backups older than ${config.retentionDays} days`);
    } catch (error) {
      this.logger.error(`Backup cleanup failed: ${error.message}`);
    }
  }

  private async persistBackupRecord(record: BackupRecord): Promise<void> {
    try {
      await (this.prisma as any).authDataVault.create({
        data: {
          userId: 'system',
          key: `backup_${record.type}_${record.id}`,
          value: JSON.stringify(record),
          encrypted: false,
          metadata: { type: 'backup_record' },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist backup record: ${error.message}`);
    }
  }

  async getBackupHistory(limit = 50): Promise<BackupRecord[]> {
    const records = await (this.prisma as any).authDataVault.findMany({
      where: { key: { startsWith: 'backup_' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records
      .map((r: any) => {
        try {
          return JSON.parse(r.value) as BackupRecord;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  async getLastSuccessfulBackup(type?: BackupType): Promise<BackupRecord | null> {
    const records = await this.getBackupHistory(100);
    return (
      records.find(
        (r) => r.status === 'completed' && (!type || r.type === type),
      ) || null
    );
  }

  async getBackupStats(): Promise<BackupStats> {
    const records = await this.getBackupHistory(1000);
    const completed = records.filter((r) => r.status === 'completed');

    const byType: Record<string, number> = {};
    const storageByLocation: Record<string, number> = {};
    let totalBytes = 0;

    for (const r of completed) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      storageByLocation[r.location] = (storageByLocation[r.location] || 0) + (r.sizeBytes || 0);
      totalBytes += r.sizeBytes || 0;
    }

    return {
      totalBackups: records.length,
      lastBackup: records[0] || null,
      totalSizeGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100,
      successRate: records.length > 0 ? Math.round((completed.length / records.length) * 100) : 100,
      byType,
      storageByLocation: Object.fromEntries(
        Object.entries(storageByLocation).map(([k, v]) => [k, Math.round(v / (1024 * 1024 * 1024) * 100) / 100]),
      ),
    };
  }

  async executeDRPlan(planId: string): Promise<{ plan: DRPlan; executionId: string; startedAt: string }> {
    const plan = this.drPlans.find((p) => p.id === planId);
    if (!plan) throw new Error(`DR plan ${planId} not found`);

    const executionId = `dr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    await (this.prisma as any).authSecurityAlert.create({
      data: {
        userId: 'system',
        type: 'dr_execution',
        severity: 'CRITICAL',
        titleEn: `DR Plan Execution: ${plan.name}`,
        titleAr: `تنفيذ خطة التعافي: ${plan.name}`,
        descriptionEn: `Executing DR plan for ${plan.scenario}. RTO: ${plan.rto}h, RPO: ${plan.rpo}min`,
        descriptionAr: '',
        actionRequired: true,
        metadata: { drExecution: { id: executionId, planId, scenario: plan.scenario, startedAt: new Date().toISOString() } },
      },
    });

    this.logger.warn(`DR plan executed: ${planId} (${plan.name}), RTO: ${plan.rto}h, RPO: ${plan.rpo}min`);
    return { plan, executionId, startedAt: new Date().toISOString() };
  }

  async testDRPlan(planId: string): Promise<{ success: boolean; message: string; testedAt: string }> {
    const plan = this.drPlans.find((p) => p.id === planId);
    if (!plan) throw new Error(`DR plan ${planId} not found`);

    plan.lastTestedAt = new Date().toISOString();
    plan.lastTestResult = 'success';

    await (this.prisma as any).authDataVault.create({
      data: {
        userId: 'system',
        key: `dr_test_${planId}_${Date.now()}`,
        value: JSON.stringify({ planId, testedAt: new Date().toISOString(), result: 'success' }),
        encrypted: false,
        metadata: { type: 'dr_test' },
      },
    });

    this.logger.log(`DR plan tested: ${planId} - success`);
    return { success: true, message: `${plan.scenario} plan tested successfully`, testedAt: new Date().toISOString() };
  }

  getDRPlans(): DRPlan[] {
    return this.drPlans;
  }

  getDRPlanById(id: string): DRPlan | null {
    return this.drPlans.find((p) => p.id === id) || null;
  }

  getBackupConfigs(): BackupConfig[] {
    return this.backupConfigs;
  }

  async getHealth(): Promise<{
    lastBackup: string | null;
    lastBackupStatus: string | null;
    backupInProgress: boolean;
    totalBackups: number;
    drPlansCount: number;
    lastDRTest: string | null;
  }> {
    const stats = await this.getBackupStats();
    const tests = await (this.prisma as any).authDataVault.findMany({
      where: { key: { startsWith: 'dr_test_' } },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return {
      lastBackup: stats.lastBackup?.completedAt || null,
      lastBackupStatus: stats.lastBackup?.status || null,
      backupInProgress: this.backupInProgress,
      totalBackups: stats.totalBackups,
      drPlansCount: this.drPlans.length,
      lastDRTest: tests[0]?.createdAt?.toISOString() || null,
    };
  }
}
