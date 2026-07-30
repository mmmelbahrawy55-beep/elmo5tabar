import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'detected' | 'triaging' | 'containing' | 'remediating' | 'resolved' | 'closed' | 'false_positive';
export type ContainmentStrategy = 'isolate_user' | 'block_ip' | 'revoke_session' | 'disable_account' | 'quarantine_device' | 'rate_limit' | 'disable_api_key';
export type RemediationAction = 'password_reset' | 'mfa_enforce' | 'key_rotation' | 'permission_review' | 'patch_deploy' | 'config_change' | 'data_restore' | 'revoke_tokens';

export interface IncidentCreate {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: string;
  sourceIp?: string;
  userId?: string;
  affectedResources?: string[];
  indicators?: string[];
  detectedBy: 'automated' | 'manual' | 'external';
  evidence?: Record<string, any>;
}

export interface IncidentUpdate {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignee?: string;
  notes?: string;
  containmentStrategy?: ContainmentStrategy;
  remediationActions?: RemediationAction[];
}

export interface IncidentTimelineEntry {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  category: 'detection' | 'triage' | 'containment' | 'remediation' | 'communication' | 'resolution';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: string;
  sourceIp?: string;
  userId?: string;
  assignee?: string;
  affectedResources: string[];
  indicators: string[];
  detectedBy: string;
  evidence: Record<string, any>;
  containmentStrategy?: ContainmentStrategy;
  remediationActions: RemediationAction[];
  timeline: IncidentTimelineEntry[];
  slaDeadline?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);

  private readonly slaHours: Record<IncidentSeverity, number> = {
    low: 72,
    medium: 24,
    high: 4,
    critical: 1,
  };

  private playbooks: Record<string, IncidentPlaybook> = {};

  constructor(private readonly prisma: PrismaService) {
    this.initializePlaybooks();
  }

  private initializePlaybooks(): void {
    this.playbooks = {
      brute_force: {
        id: 'pb_brute_force',
        name: 'بروتوكول هجوم القوة الغاشمة',
        nameEn: 'Brute Force Attack Protocol',
        severity: 'high',
        triage: [
          'Identify source IP addresses from failed login attempts',
          'Check if attack targets specific user accounts',
          'Review login history for credential stuffing patterns',
          'Assess if VPN/Tor exit nodes are involved',
        ],
        containment: [
          'Temporarily block offending IP addresses in WAF',
          'Enable CAPTCHA on login endpoints',
          'Force MFA challenge for affected accounts',
          'Increase rate limiting for login endpoint',
        ],
        remediation: [
          'Force password reset for compromised accounts',
          'Review and rotate API keys if exposed',
          'Analyze logs for data access after successful brute force',
          'Update firewall rules to block attacker IP range',
        ],
        recovery: [
          'Verify no unauthorized data access occurred',
          'Notify affected users and recommend password change',
          'Document IOCs for threat intelligence feed',
          'Update rate limiting thresholds if needed',
        ],
      },
      data_breach: {
        id: 'pb_data_breach',
        name: 'بروتوكول اختراق البيانات',
        nameEn: 'Data Breach Protocol',
        severity: 'critical',
        triage: [
          'Identify compromised systems and data stores',
          'Determine scope of exposed data (PHI, PII, financial)',
          'Check for data exfiltration indicators',
          'Preserve forensic evidence (logs, memory, disk images)',
        ],
        containment: [
          'Isolate affected systems from network',
          'Revoke active sessions and API tokens',
          'Enable read-only mode if database compromised',
          'Engage incident response team',
        ],
        remediation: [
          'Rotate all database credentials and encryption keys',
          'Patch exploited vulnerabilities',
          'Restore from clean backup if data integrity compromised',
          'Implement additional access controls',
        ],
        recovery: [
          'Conduct forensic analysis and root cause determination',
          'Notify affected patients/partners per regulatory requirements',
          'File breach report with authorities (NCSC, NPHIES, CCHI)',
          'Implement lessons learned and security improvements',
          'Rebuild compromised systems from scratch if necessary',
        ],
      },
      insider_threat: {
        id: 'pb_insider_threat',
        name: 'بروتوكول التهديد الداخلي',
        nameEn: 'Insider Threat Protocol',
        severity: 'high',
        triage: [
          'Identify user account involved in suspicious activity',
          'Review recent access logs and data downloads',
          'Check for unusual patterns (off-hours, mass access, exports)',
          'Interview user manager if appropriate',
        ],
        containment: [
          'Suspend user account immediately',
          'Revoke all active sessions and API tokens',
          'Enable additional monitoring on user activity',
          'Restrict network access to sensitive systems',
        ],
        remediation: [
          'Conduct formal investigation with HR',
          'Review all data accessed by user in last 90 days',
          'Rotate credentials if user had admin access',
          'Implement DLP controls to prevent future incidents',
        ],
        recovery: [
          'Determine if data was exfiltrated',
          'Assess business impact and notify affected parties',
          'Update insider threat detection rules',
          'Consider legal action if malicious intent confirmed',
          'Implement separation of duties for sensitive operations',
        ],
      },
      ransomware: {
        id: 'pb_ransomware',
        name: 'بروتوكول هجوم الفدية',
        nameEn: 'Ransomware Attack Protocol',
        severity: 'critical',
        triage: [
          'Identify affected systems and encryption scope',
          'Isolate incident from network immediately',
          'Determine ransomware variant from ransom note/artifacts',
          'Preserve evidence before system recovery',
        ],
        containment: [
          'Disconnect all affected systems from network',
          'Shut down network shares and mapped drives',
          'Block C2 communication at firewall level',
          'Prevent encryption spread by disabling SMB/RDP',
        ],
        remediation: [
          'Do NOT pay ransom (consult legal team)',
          'Restore from offline backups validated clean',
          'Patch vulnerability used for initial access',
          'Clean reinfect with EDR tools',
        ],
        recovery: [
          'Verify backup integrity and data completeness',
          'Rebuild systems from scratch after forensic analysis',
          'Strengthen backup strategy (3-2-1 rule, offline backups)',
          'Conduct tabletop exercise for ransomware response',
          'Report to authorities and insurance provider',
        ],
      },
      unauthorized_access: {
        id: 'pb_unauthorized_access',
        name: 'بروتوكول الوصول غير المصرح به',
        nameEn: 'Unauthorized Access Protocol',
        severity: 'high',
        triage: [
          'Identify entry point and access vector',
          'Determine privilege level achieved',
          'Check if lateral movement occurred',
          'Review authentication logs for origin',
        ],
        containment: [
          'Revoke compromised credentials',
          'Block originating IP at WAF level',
          'Force password reset for all potentially affected accounts',
          'Enable MFA if not already enforced',
        ],
        remediation: [
          'Patch vulnerability used for access',
          'Review access control lists and permissions',
          'Implement additional authentication controls',
          'Audit all system changes made during access window',
        ],
        recovery: [
          'Conduct full access audit of affected systems',
          'Notify regulatory bodies if PHI/PII accessed',
          'Update IDS/IPS rules to detect similar patterns',
          'Document incident for security awareness training',
        ],
      },
    };
  }

  private async getNextSequence(): Promise<string> {
    const lastIncident = await (this.prisma as any).authSecurityAlert.findFirst({
      where: { type: 'incident' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const num = lastIncident ? parseInt(lastIncident.id.slice(-4), 10) + 1 : 1;
    return `INC-${String(num).padStart(4, '0')}`;
  }

  async createIncident(data: IncidentCreate): Promise<Incident> {
    const id = await this.getNextSequence();
    const now = new Date();
    const slaDate = new Date(now.getTime() + this.slaHours[data.severity] * 3600000);

    const incident: Incident = {
      id,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'detected',
      category: data.category,
      sourceIp: data.sourceIp,
      userId: data.userId,
      affectedResources: data.affectedResources || [],
      indicators: data.indicators || [],
      detectedBy: data.detectedBy,
      evidence: data.evidence || {},
      remediationActions: [],
      timeline: [
        {
          timestamp: now.toISOString(),
          action: 'incident_detected',
          actor: data.detectedBy,
          details: `Incident detected via ${data.detectedBy}: ${data.title}`,
          category: 'detection',
        },
      ],
      slaDeadline: slaDate.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await (this.prisma as any).authSecurityAlert.create({
      data: {
        userId: data.userId || 'system',
        type: 'incident',
        severity: data.severity.toUpperCase() as any,
        titleEn: data.title,
        titleAr: this.getArabicCategory(data.category) ? `[${this.getArabicCategory(data.category)}] ${data.title}` : data.title,
        descriptionEn: data.description,
        descriptionAr: '',
        ipAddress: data.sourceIp,
        actionRequired: true,
        actionUrl: `/admin/security/incidents/${id}`,
        metadata: { incident, isIncident: true, playbook: this.getPlaybookForCategory(data.category) },
      },
    });

    this.logger.warn(`Incident created: ${id} (${data.severity}) - ${data.title}`);
    return incident;
  }

  async updateIncident(id: string, update: IncidentUpdate, actor: string): Promise<Incident | null> {
    const alert = await (this.prisma as any).authSecurityAlert.findFirst({
      where: { type: 'incident', metadata: { path: ['incident', 'id'], equals: id } },
    });

    if (!alert) return null;

    const incident: Incident = alert.metadata.incident;
    const now = new Date();

    if (update.status) {
      incident.status = update.status;
      incident.timeline.push({
        timestamp: now.toISOString(),
        action: `status_${update.status}`,
        actor,
        details: `Status changed to ${update.status}`,
        category: update.status === 'containing' ? 'containment' : update.status === 'remediating' ? 'remediation' : update.status === 'resolved' || update.status === 'closed' ? 'resolution' : 'triage',
      });

      if (update.status === 'resolved') incident.resolvedAt = now.toISOString();
      if (update.status === 'closed') incident.closedAt = now.toISOString();
    }

    if (update.severity) incident.severity = update.severity;
    if (update.assignee) incident.assignee = update.assignee;
    if (update.containmentStrategy) incident.containmentStrategy = update.containmentStrategy;
    if (update.remediationActions) incident.remediationActions = [...new Set([...incident.remediationActions, ...update.remediationActions])];

    if (update.notes) {
      incident.timeline.push({
        timestamp: now.toISOString(),
        action: 'note_added',
        actor,
        details: update.notes,
        category: 'triage',
      });
    }

    incident.updatedAt = now.toISOString();

    await (this.prisma as any).authSecurityAlert.update({
      where: { id: alert.id },
      data: { metadata: { ...alert.metadata, incident } },
    });

    return incident;
  }

  async getIncident(id: string): Promise<Incident | null> {
    const alert = await (this.prisma as any).authSecurityAlert.findFirst({
      where: { type: 'incident', metadata: { path: ['incident', 'id'], equals: id } },
    });
    return alert?.metadata?.incident || null;
  }

  async getIncidents(filters?: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    category?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { type: 'incident' };

    if (filters?.status) where['metadata'] = { path: ['incident'], array_contains: [{ status: filters.status }] };

    const [alerts, total] = await Promise.all([
      (this.prisma as any).authSecurityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).authSecurityAlert.count({ where }),
    ]);

    let incidents = alerts.map((a: any) => a.metadata.incident).filter(Boolean);

    if (filters?.severity) incidents = incidents.filter((i: Incident) => i.severity === filters.severity);
    if (filters?.category) incidents = incidents.filter((i: Incident) => i.category === filters.category);

    return { incidents, total, page, limit };
  }

  async getDashboard(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    slaCompliance: number;
    averageResolutionTime: number;
    recentIncidents: Incident[];
  }> {
    const alerts = await (this.prisma as any).authSecurityAlert.findMany({
      where: { type: 'incident' },
      orderBy: { createdAt: 'desc' },
    });

    const incidents: Incident[] = alerts.map((a: any) => a.metadata.incident).filter(Boolean);

    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let resolvedOnTime = 0;
    let totalResolved = 0;
    let totalResolutionTime = 0;

    for (const inc of incidents) {
      byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
      bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;

      if (inc.status === 'resolved' || inc.status === 'closed') {
        totalResolved++;
        if (inc.resolvedAt && inc.slaDeadline) {
          if (new Date(inc.resolvedAt) <= new Date(inc.slaDeadline)) resolvedOnTime++;
        }
        if (inc.createdAt && inc.resolvedAt) {
          totalResolutionTime += (new Date(inc.resolvedAt).getTime() - new Date(inc.createdAt).getTime()) / 3600000;
        }
      }
    }

    return {
      total: incidents.length,
      byStatus,
      bySeverity,
      slaCompliance: totalResolved > 0 ? Math.round((resolvedOnTime / totalResolved) * 100) : 100,
      averageResolutionTime: totalResolved > 0 ? Math.round((totalResolutionTime / totalResolved) * 10) / 10 : 0,
      recentIncidents: incidents.slice(0, 10),
    };
  }

  async getPlaybook(category: string): Promise<IncidentPlaybook | null> {
    return this.playbooks[category] || null;
  }

  getPlaybookForCategory(category: string): IncidentPlaybook | null {
    return this.playbooks[category] || null;
  }

  async getAllPlaybooks(): Promise<Record<string, IncidentPlaybook>> {
    return this.playbooks;
  }

  async addTimelineEntry(
    id: string,
    entry: Omit<IncidentTimelineEntry, 'timestamp'>,
  ): Promise<Incident | null> {
    const alert = await (this.prisma as any).authSecurityAlert.findFirst({
      where: { type: 'incident', metadata: { path: ['incident', 'id'], equals: id } },
    });

    if (!alert) return null;

    const incident: Incident = alert.metadata.incident;
    incident.timeline.push({ ...entry, timestamp: new Date().toISOString() });
    incident.updatedAt = new Date().toISOString();

    await (this.prisma as any).authSecurityAlert.update({
      where: { id: alert.id },
      data: { metadata: { ...alert.metadata, incident } },
    });

    return incident;
  }

  async getSLAReport(): Promise<{
    total: number;
    withinSLA: number;
    breached: number;
    compliance: number;
    averageResponseTime: number;
  }> {
    const alerts = await (this.prisma as any).authSecurityAlert.findMany({
      where: { type: 'incident' },
    });

    const incidents: Incident[] = alerts.map((a: any) => a.metadata.incident).filter(Boolean);
    let withinSLA = 0;
    let breached = 0;
    let totalResponseTime = 0;
    let respondedCount = 0;

    for (const inc of incidents) {
      if (inc.resolvedAt && inc.slaDeadline) {
        if (new Date(inc.resolvedAt) <= new Date(inc.slaDeadline)) {
          withinSLA++;
        } else {
          breached++;
        }
      }
      const triageEntry = inc.timeline.find((t) => t.category === 'triage');
      if (triageEntry && inc.createdAt) {
        totalResponseTime += (new Date(triageEntry.timestamp).getTime() - new Date(inc.createdAt).getTime()) / 60000;
        respondedCount++;
      }
    }

    const resolved = withinSLA + breached;
    return {
      total: incidents.length,
      withinSLA,
      breached,
      compliance: resolved > 0 ? Math.round((withinSLA / resolved) * 100) : 100,
      averageResponseTime: respondedCount > 0 ? Math.round((totalResponseTime / respondedCount) * 10) / 10 : 0,
    };
  }

  private getArabicCategory(category: string): string {
    const map: Record<string, string> = {
      brute_force: 'هجوم القوة الغاشمة',
      data_breach: 'اختراق بيانات',
      insider_threat: 'تهديد داخلي',
      ransomware: 'هجوم فدية',
      unauthorized_access: 'وصول غير مصرح به',
      phishing: 'تصيد احتيالي',
      ddos: 'هجوم حجب الخدمة',
      malware: 'برمجيات خبيثة',
    };
    return map[category] || category;
  }
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  nameEn: string;
  severity: IncidentSeverity;
  triage: string[];
  containment: string[];
  remediation: string[];
  recovery: string[];
}
