import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface SIEMConfig {
  provider: 'splunk' | 'elastic' | 'azure-sentinel' | 'qradar' | 'datadog' | 'sumologic';
  endpoint: string;
  token: string;
  enabled: boolean;
  batchSize: number;
  flushIntervalMs: number;
}

export interface SIEMEvent {
  eventId: string;
  timestamp: string;
  category: 'auth' | 'access' | 'compliance' | 'threat' | 'system' | 'data';
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: { ip: string; userAgent?: string; userId?: string; sessionId?: string };
  target?: { type: string; id: string; action: string };
  context: Record<string, any>;
  raw?: Record<string, any>;
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  condition: 'threshold' | 'sequence' | 'absence' | 'geo' | 'anomaly';
  params: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{ type: 'alert' | 'block' | 'notify' | 'escalate'; target?: string }>;
}

interface CorrelationMatch {
  ruleId: string;
  events: SIEMEvent[];
  score: number;
  detectedAt: string;
}

@Injectable()
export class SIEMService {
  private readonly logger = new Logger(SIEMService.name);
  private eventBuffer: SIEMEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private configs: Map<string, SIEMConfig> = new Map();
  private readonly correlationRules: CorrelationRule[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.correlationRules = this.loadCorrelationRules();
    this.initializeProviders();
  }

  onModuleInit(): void {
    this.flushTimer = setInterval(() => this.flushBuffer(), 5000);
    this.logger.log('SIEM service initialized with flush interval 5s');
  }

  onModuleDestroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushBuffer();
  }

  private initializeProviders(): void {
    const providers: Array<{ key: string; provider: SIEMConfig['provider'] }> = [
      { key: 'SIEM_SPLUNK', provider: 'splunk' },
      { key: 'SIEM_ELASTIC', provider: 'elastic' },
      { key: 'SIEM_AZURE', provider: 'azure-sentinel' },
      { key: 'SIEM_QRAQAR', provider: 'qradar' },
      { key: 'SIEM_DATADOG', provider: 'datadog' },
      { key: 'SIEM_SUMOLOGIC', provider: 'sumologic' },
    ];

    for (const { key, provider } of providers) {
      const endpoint = this.configService.get<string>(`${key}_ENDPOINT`);
      const token = this.configService.get<string>(`${key}_TOKEN`);
      if (endpoint && token) {
        this.configs.set(provider, {
          provider,
          endpoint,
          token,
          enabled: true,
          batchSize: 100,
          flushIntervalMs: 5000,
        });
        this.logger.log(`SIEM provider ${provider} configured`);
      }
    }
  }

  private loadCorrelationRules(): CorrelationRule[] {
    return [
      {
        id: 'brute-force-burst',
        name: 'Brute Force Burst Detection',
        description: 'Multiple failed logins from same IP across different accounts',
        condition: 'threshold',
        params: { field: 'type', value: 'login_failed', threshold: 10, window: 300, groupBy: 'source.ip' },
        severity: 'high',
        actions: [{ type: 'alert' }, { type: 'block', target: 'source.ip' }],
      },
      {
        id: 'credential-stuffing',
        name: 'Credential Stuffing Attack',
        description: 'Rapid login attempts with different credentials from distributed IPs',
        condition: 'threshold',
        params: { field: 'type', value: 'login_failed', threshold: 50, window: 60, groupBy: 'target.id' },
        severity: 'critical',
        actions: [{ type: 'alert' }, { type: 'block', target: 'target.id' }, { type: 'notify' }],
      },
      {
        id: 'impossible-travel-chain',
        name: 'Impossible Travel Chain',
        description: 'Multiple logins from geographically impossible locations in sequence',
        condition: 'sequence',
        params: { eventTypes: ['login_success'], maxTimeWindow: 3600, maxDistanceKm: 1000 },
        severity: 'high',
        actions: [{ type: 'alert' }, { type: 'escalate' }],
      },
      {
        id: 'data-exfiltration',
        name: 'Data Exfiltration Attempt',
        description: 'Unusual volume of data access or download by single user',
        condition: 'threshold',
        params: { field: 'type', value: 'data_access', threshold: 100, window: 300, groupBy: 'source.userId' },
        severity: 'critical',
        actions: [{ type: 'alert' }, { type: 'block', target: 'source.userId' }, { type: 'notify' }],
      },
      {
        id: 'off-hours-access',
        name: 'Off-Hours Sensitive Access',
        description: 'Access to sensitive data outside business hours',
        condition: 'anomaly',
        params: { eventTypes: ['data_access', 'phi_access'], businessHours: { start: 6, end: 22 }, timezone: 'Asia/Riyadh' },
        severity: 'medium',
        actions: [{ type: 'alert' }],
      },
      {
        id: 'api-abuse',
        name: 'API Abuse Pattern',
        description: 'Abnormal API request patterns indicating automated attack',
        condition: 'threshold',
        params: { field: 'type', value: 'api_request', threshold: 1000, window: 60, groupBy: 'source.ip' },
        severity: 'high',
        actions: [{ type: 'alert' }, { type: 'block', target: 'source.ip' }],
      },
      {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Multiple failed authorization attempts on privileged endpoints',
        condition: 'threshold',
        params: { field: 'type', value: 'authorization_failed', threshold: 5, window: 300, groupBy: 'source.userId' },
        severity: 'critical',
        actions: [{ type: 'alert' }, { type: 'block', target: 'source.userId' }, { type: 'escalate' }],
      },
      {
        id: 'session-hijack',
        name: 'Session Hijacking Detection',
        description: 'Same session used from different IPs or devices',
        condition: 'sequence',
        params: { eventTypes: ['session_access'], maxTimeWindow: 600, groupBy: 'target.id' },
        severity: 'critical',
        actions: [{ type: 'alert' }, { type: 'block', target: 'target.id' }, { type: 'notify' }],
      },
    ];
  }

  async emit(event: Omit<SIEMEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const siemEvent: SIEMEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    this.eventBuffer.push(siemEvent);

    if (this.eventBuffer.length >= 100) {
      await this.flushBuffer();
    }

    const matches = await this.evaluateCorrelation(siemEvent);
    for (const match of matches) {
      await this.handleCorrelationMatch(match);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const batch = this.eventBuffer.splice(0, 100);

    try {
      await this.persistEvents(batch);

      for (const [, config] of this.configs) {
        if (!config.enabled) continue;
        try {
          await this.shipToProvider(config, batch);
        } catch (error) {
          this.logger.error(`Failed to ship events to ${config.provider}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to flush SIEM events, re-queuing');
      this.eventBuffer.unshift(...batch);
    }
  }

  private async persistEvents(events: SIEMEvent[]): Promise<void> {
    try {
      await (this.prisma as any).authAuditLog.createMany({
        data: events.map((e) => ({
          id: e.eventId,
          userId: e.source.userId || 'system',
          action: e.type,
          entityType: e.target?.type || 'system',
          entityId: e.target?.id,
          metadata: {
            siem: true,
            severity: e.severity,
            category: e.category,
            ipAddress: e.source.ip,
            userAgent: e.source.userAgent,
            context: e.context,
            raw: e.raw,
          },
          ipAddress: e.source.ip,
          userAgent: e.source.userAgent,
          createdAt: new Date(e.timestamp),
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      this.logger.error('Failed to persist SIEM events', error);
      for (const event of events) {
        await this.persistEvent(event);
      }
    }
  }

  private async persistEvent(event: SIEMEvent): Promise<void> {
    try {
      await (this.prisma as any).authAuditLog.create({
        data: {
          id: event.eventId,
          userId: event.source.userId || 'system',
          action: event.type,
          entityType: event.target?.type || 'system',
          entityId: event.target?.id,
          metadata: {
            siem: true,
            severity: event.severity,
            category: event.category,
            ipAddress: event.source.ip,
            userAgent: event.source.userAgent,
            context: event.context,
            raw: event.raw,
          },
          ipAddress: event.source.ip,
          userAgent: event.source.userAgent,
          createdAt: new Date(event.timestamp),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to persist event ${event.eventId}: ${error.message}`);
    }
  }

  private async shipToProvider(config: SIEMConfig, events: SIEMEvent[]): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AlMokhtabar-SIEM-Agent/1.0',
    };

    switch (config.provider) {
      case 'splunk': {
        headers['Authorization'] = `Splunk ${config.token}`;
        const body = events.map((e) => ({
          time: new Date(e.timestamp).getTime() / 1000,
          host: 'almokhtabar-labs',
          source: 'backend-api',
          sourcetype: '_json',
          event: {
            event_id: e.eventId,
            category: e.category,
            type: e.type,
            severity: e.severity,
            source: e.source,
            target: e.target,
            context: e.context,
          },
        }));
        await this.httpPost(`${config.endpoint}/services/collector/event`, body, headers);
        break;
      }
      case 'elastic': {
        headers['Authorization'] = `ApiKey ${config.token}`;
        const body = events
          .map((e) => [
            JSON.stringify({ index: { _index: 'almokhtabar-siem', _id: e.eventId } }),
            JSON.stringify({
              '@timestamp': e.timestamp,
              event: { id: e.eventId, category: e.category, type: e.type, severity: e.severity },
              source: { ip: e.source.ip, user_agent: e.source.userAgent, user: { id: e.source.userId } },
              observer: { vendor: 'AlMokhtabar', product: 'SIEM-Agent' },
              ...(e.target ? { target: e.target } : {}),
              ...e.context,
            }),
          ])
          .flat()
          .join('\n');
        await this.httpPost(`${config.endpoint}/_bulk`, body, { ...headers, 'Content-Type': 'application/x-ndjson' });
        break;
      }
      case 'azure-sentinel': {
        headers['Authorization'] = `Bearer ${config.token}`;
        const body = {
          events: events.map((e) => ({
            EventId: e.eventId,
            Timestamp: e.timestamp,
            Category: e.category,
            Type: e.type,
            Severity: e.severity.toUpperCase(),
            SourceIP: e.source.ip,
            UserAgent: e.source.userAgent,
            UserId: e.source.userId,
            TargetType: e.target?.type,
            TargetId: e.target?.id,
            Action: e.target?.action,
            Context: JSON.stringify(e.context),
          })),
        };
        await this.httpPost(`${config.endpoint}/api/logs`, body, headers);
        break;
      }
      case 'qradar': {
        const body = events
          .map((e) => {
            const cef = [
              `CEF:0|AlMokhtabar|SIEM-Agent|1.0|${e.type}|${e.category}|${this.severityToCEF(e.severity)}`,
              `src=${e.source.ip}`,
              `suser=${e.source.userId || 'unknown'}`,
              `msg=${e.context?.message || e.type}`,
              `request=${e.target?.action || 'unknown'}`,
              `dvc=almokhtabar-api`,
              `rt=${new Date(e.timestamp).getTime()}`,
            ].join(' ');
            return cef;
          })
          .join('\n');
        headers['Authorization'] = `Bearer ${config.token}`;
        await this.httpPost(`${config.endpoint}/api/siem/logs`, body, { ...headers, 'Content-Type': 'text/plain' });
        break;
      }
      case 'datadog': {
        headers['DD-API-KEY'] = config.token;
        const body = events.map((e) => ({
          ddsource: 'almokhtabar',
          ddtags: `category:${e.category},severity:${e.severity},type:${e.type}`,
          hostname: 'almokhtabar-api',
          service: 'backend',
          message: JSON.stringify({
            event_id: e.eventId,
            timestamp: e.timestamp,
            category: e.category,
            type: e.type,
            severity: e.severity,
            source: e.source,
            target: e.target,
            context: e.context,
          }),
        }));
        await this.httpPost(`${config.endpoint}/api/v2/logs`, body, headers);
        break;
      }
      case 'sumologic': {
        const body = events
          .map((e) => JSON.stringify({
            event_id: e.eventId,
            timestamp: e.timestamp,
            category: e.category,
            type: e.type,
            severity: e.severity,
            source: e.source,
            target: e.target,
            context: e.context,
            _collector: 'almokhtabar-siem-agent',
            _source: 'backend-api',
            _sourceCategory: `almokhtabar/security/${e.category}`,
          }))
          .join('\n');
        await this.httpPost(config.endpoint, body, { ...headers, 'Content-Type': 'text/plain' });
        break;
      }
    }
  }

  private async httpPost(url: string, body: any, headers: Record<string, string>): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: typeof body === 'string' ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        this.logger.warn(`SIEM provider returned ${response.status} for ${url.split('/')[2]}`);
      }
    } catch (error) {
      this.logger.error(`SIEM HTTP request failed: ${error.message}`);
    }
  }

  private severityToCEF(severity: string): number {
    const map: Record<string, number> = { low: 1, medium: 5, high: 8, critical: 10 };
    return map[severity] || 3;
  }

  private async evaluateCorrelation(event: SIEMEvent): Promise<CorrelationMatch[]> {
    const matches: CorrelationMatch[] = [];

    for (const rule of this.correlationRules) {
      try {
        const match = await this.evaluateRule(rule, event);
        if (match) matches.push(match);
      } catch (error) {
        this.logger.error(`Correlation rule ${rule.id} evaluation failed: ${error.message}`);
      }
    }

    return matches;
  }

  private async evaluateRule(rule: CorrelationRule, event: SIEMEvent): Promise<CorrelationMatch | null> {
    switch (rule.condition) {
      case 'threshold': {
        const { field, value, threshold, window, groupBy } = rule.params;
        if (event.type !== value && field === 'type') return null;

        const groupKey = groupBy.split('.').reduce((obj: any, key: string) => obj?.[key], event as any);
        if (!groupKey) return null;

        const since = new Date(Date.now() - (window || 300) * 1000);
        const recentEvents = this.eventBuffer.filter(
          (e) => e[field] === value && new Date(e.timestamp) > since && this.getNestedValue(e, groupBy) === groupKey,
        );

        const count = recentEvents.length + 1;
        if (count >= threshold) {
          return {
            ruleId: rule.id,
            events: [event, ...recentEvents.slice(-9)],
            score: Math.min(100, (count / threshold) * 100),
            detectedAt: new Date().toISOString(),
          };
        }
        return null;
      }
      case 'sequence': {
        const { eventTypes, maxTimeWindow, groupBy } = rule.params;
        if (!eventTypes.includes(event.type)) return null;

        const groupKey = groupBy
          ? groupBy.split('.').reduce((obj: any, key: string) => obj?.[key], event as any)
          : null;
        const since = new Date(Date.now() - (maxTimeWindow || 3600) * 1000);
        const priorEvents = this.eventBuffer.filter(
          (e) =>
            eventTypes.includes(e.type) &&
            new Date(e.timestamp) > since &&
            e.eventId !== event.eventId &&
            (!groupKey || this.getNestedValue(e, groupBy) === groupKey),
        );

        if (priorEvents.length >= 2) {
          return {
            ruleId: rule.id,
            events: [event, ...priorEvents.slice(-4)],
            score: 85,
            detectedAt: new Date().toISOString(),
          };
        }
        return null;
      }
      default:
        return null;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async handleCorrelationMatch(match: CorrelationMatch): Promise<void> {
    const rule = this.correlationRules.find((r) => r.id === match.ruleId);
    if (!rule) return;

    this.logger.warn(`Correlation match: ${rule.name} (score: ${match.score})`);

    const existingAlert = await (this.prisma as any).authSecurityAlert.findFirst({
      where: { type: `correlation_${match.ruleId}`, isDismissed: false, createdAt: { gte: new Date(Date.now() - 3600000) } },
    });

    if (existingAlert) {
      await (this.prisma as any).authSecurityAlert.update({
        where: { id: existingAlert.id },
        data: { metadata: { ...existingAlert.metadata, lastMatchAt: match.detectedAt, matchCount: (existingAlert.metadata?.matchCount || 1) + 1 } },
      });
      return;
    }

    for (const action of rule.actions) {
      switch (action.type) {
        case 'alert':
          await this.createCorrelationAlert(rule, match);
          break;
        case 'block':
          await this.applyBlock(action.target, match, rule);
          break;
        case 'notify':
          await this.sendNotification(rule, match);
          break;
        case 'escalate':
          await (this.prisma as any).authSecurityAlert.create({
            data: {
              userId: match.events[0]?.source?.userId || 'system',
              type: `correlation_${match.ruleId}`,
              severity: 'CRITICAL',
              titleEn: `[ESCALATED] ${rule.name}`,
              titleAr: `[مُرفَع] ${rule.name}`,
              descriptionEn: rule.description,
              descriptionAr: '',
              actionRequired: true,
              metadata: { correlationMatch: match, rule },
            },
          });
          break;
      }
    }
  }

  private async createCorrelationAlert(rule: CorrelationRule, match: CorrelationMatch): Promise<void> {
    await (this.prisma as any).authSecurityAlert.create({
      data: {
        userId: match.events[0]?.source?.userId || 'system',
        type: `correlation_${match.ruleId}`,
        severity: rule.severity.toUpperCase(),
        titleEn: rule.name,
        titleAr: this.getArabicTitle(rule.name),
        descriptionEn: `${rule.description} (Score: ${match.score})`,
        descriptionAr: '',
        actionRequired: rule.severity === 'critical' || rule.severity === 'high',
        metadata: { correlationMatch: match, rule },
      },
    });
  }

  private getArabicTitle(enTitle: string): string {
    const titles: Record<string, string> = {
      'Brute Force Burst Detection': 'كشف هجوم القوة الغاشمة',
      'Credential Stuffing Attack': 'هجوم حشو البيانات',
      'Impossible Travel Chain': 'حركة مستحيلة جغرافياً',
      'Data Exfiltration Attempt': 'محاولة سرقة بيانات',
      'Off-Hours Sensitive Access': 'وصول خارج أوقات العمل',
      'API Abuse Pattern': 'نمط إساءة استخدام API',
      'Privilege Escalation Attempt': 'محاولة رفع صلاحيات',
      'Session Hijacking Detection': 'كشف اختطاف جلسة',
    };
    return titles[enTitle] || enTitle;
  }

  private async applyBlock(target: string | undefined, match: CorrelationMatch, rule: CorrelationRule): Promise<void> {
    if (!target) return;

    const [objectType, field] = target.split('.');
    const value = match.events[0]?.[objectType]?.[field];
    if (!value) return;

    const blockDuration = rule.severity === 'critical' ? 86400 : 3600;
    await (this.prisma as any).authRateLimit.upsert({
      where: { identifier_action: { identifier: value, action: `siem_${match.ruleId}` } },
      update: { blockedUntil: new Date(Date.now() + blockDuration * 1000), attemptCount: { increment: 1 } },
      create: {
        identifier: value,
        action: `siem_${match.ruleId}`,
        attemptCount: 1,
        blockedUntil: new Date(Date.now() + blockDuration * 1000),
      },
    });

    this.logger.warn(`SIEM auto-blocked ${target}=${value} for ${blockDuration}s (rule: ${rule.id})`);
  }

  private async sendNotification(rule: CorrelationRule, match: CorrelationMatch): Promise<void> {
    const adminUserIds = await (this.prisma as any).authUser.findMany({
      where: { role: { name: 'SUPER_ADMIN' } },
      select: { id: true },
      take: 5,
    });

    for (const admin of adminUserIds) {
      await (this.prisma as any).authSecurityAlert.create({
        data: {
          userId: admin.id,
          type: `notification_${match.ruleId}`,
          severity: rule.severity.toUpperCase(),
          titleEn: `[NOTIFICATION] ${rule.name}`,
          titleAr: `[إشعار] ${rule.name}`,
          descriptionEn: `Urgent: ${rule.description}. Score: ${match.score}. Events: ${match.events.length}`,
          descriptionAr: '',
          actionRequired: true,
          actionUrl: '/admin/security/incidents',
          metadata: { correlationMatch: match, rule },
        },
      });
    }
  }

  async getCorrelationRules(): Promise<CorrelationRule[]> {
    return this.correlationRules;
  }

  async getProviderStatus(): Promise<Array<{ provider: string; enabled: boolean; configured: boolean }>> {
    const providers = ['splunk', 'elastic', 'azure-sentinel', 'qradar', 'datadog', 'sumologic'];
    return providers.map((p) => ({
      provider: p,
      enabled: this.configs.get(p)?.enabled || false,
      configured: this.configs.has(p),
    }));
  }

  async getRecentEvents(limit = 50, offset = 0): Promise<{ events: SIEMEvent[]; total: number }> {
    const [logs, total] = await Promise.all([
      (this.prisma as any).authAuditLog.findMany({
        where: { metadata: { path: ['siem'], equals: true } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (this.prisma as any).authAuditLog.count({
        where: { metadata: { path: ['siem'], equals: true } },
      }),
    ]);

    return {
      events: logs.map((log: any) => ({
        eventId: log.id,
        timestamp: log.createdAt.toISOString(),
        category: log.metadata?.category || 'system',
        type: log.action,
        severity: log.metadata?.severity || 'low',
        source: { ip: log.ipAddress || '0.0.0.0', userId: log.userId, userAgent: log.userAgent },
        target: log.entityType ? { type: log.entityType, id: log.entityId, action: log.action } : undefined,
        context: log.metadata?.context || {},
      })),
      total,
    };
  }

  async getCorrelationMatches(limit = 20): Promise<CorrelationMatch[]> {
    const alerts = await (this.prisma as any).authSecurityAlert.findMany({
      where: { type: { startsWith: 'correlation_' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts.map((a: any) => ({
      ruleId: a.type.replace('correlation_', ''),
      events: a.metadata?.correlationMatch?.events || [],
      score: a.metadata?.correlationMatch?.score || 0,
      detectedAt: a.createdAt.toISOString(),
    }));
  }

  async ping(): Promise<Record<string, boolean | number>> {
    const status: Record<string, boolean | number> = { bufferSize: this.eventBuffer.length };
    for (const [provider, config] of this.configs) {
      try {
        const response = await fetch(config.endpoint, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        status[provider] = response.ok;
      } catch {
        status[provider] = false;
      }
    }
    return status;
  }
}
