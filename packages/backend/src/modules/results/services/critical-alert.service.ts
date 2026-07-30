import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { NotificationGateway } from '../../notifications/notification.gateway';
import { ConfigService } from '@nestjs/config';

interface CriticalThresholds {
  criticalLow: number | null;
  criticalHigh: number | null;
  panicLow: number | null;
  panicHigh: number | null;
}

interface AlertFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  patientId?: string;
  doctorId?: string;
}

interface ResolvedBy {
  id: string;
  name: string;
  role: string;
}

interface Resolution {
  notes: string;
  action?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

interface AlertStats {
  total: number;
  resolved: number;
  pending: number;
  escalated: number;
  acknowledged: number;
  criticalCount: number;
  moderateCount: number;
  lowCount: number;
  avgResponseTimeMinutes: number;
  mostCommonCriticalTests: { testId: string; testName: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byDate: { date: string; count: number }[];
}

@Injectable()
export class CriticalAlertService {
  private readonly logger = new Logger(CriticalAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly config: ConfigService,
  ) {}

  async checkCriticalValues(reportId: string): Promise<any[]> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        items: {
          include: { labTest: true },
        },
        patient: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const criticalAlerts: any[] = [];

    for (const item of report.items) {
      if (item.numericValue == null || !item.labTest) continue;

      const evaluation = this.evaluateItem(item, item.labTest);
      if (evaluation.isCritical) {
        const existingAlert = await (this.prisma as any).criticalAlert.findFirst({
          where: { reportItemId: item.id, status: { in: ['PENDING', 'ACKNOWLEDGED'] } },
        });

        if (!existingAlert) {
          const alert = await this.createAlert(item, report, report.patient);
          criticalAlerts.push(alert);
        }
      }
    }

    if (criticalAlerts.length > 0) {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { isCritical: true },
      });

      for (const alert of criticalAlerts) {
        await this.notifyCriticalValue(alert);
      }

      this.logger.warn(`Critical alerts generated for report ${report.reportNumber}: ${criticalAlerts.length} item(s)`);
    }

    return criticalAlerts;
  }

  evaluateItem(item: any, labTest: any): { isCritical: boolean; severity: string; deviation: number; message: string } {
    if (item.numericValue == null) {
      return { isCritical: false, severity: 'NONE', deviation: 0, message: 'No numeric value available' };
    }

    const thresholds = this.getCriticalThresholds(labTest);
    const value = item.numericValue;

    if (thresholds.panicLow != null && value < thresholds.panicLow) {
      const deviation = ((thresholds.panicLow - value) / Math.abs(thresholds.panicLow)) * 100;
      return {
        isCritical: true,
        severity: 'CRITICAL',
        deviation: Math.round(deviation * 100) / 100,
        message: `Value ${value} is critically below panic threshold ${thresholds.panicLow}`,
      };
    }

    if (thresholds.panicHigh != null && value > thresholds.panicHigh) {
      const deviation = ((value - thresholds.panicHigh) / Math.abs(thresholds.panicHigh)) * 100;
      return {
        isCritical: true,
        severity: 'CRITICAL',
        deviation: Math.round(deviation * 100) / 100,
        message: `Value ${value} is critically above panic threshold ${thresholds.panicHigh}`,
      };
    }

    if (thresholds.criticalLow != null && value < thresholds.criticalLow) {
      const deviation = ((thresholds.criticalLow - value) / Math.abs(thresholds.criticalLow)) * 100;
      return {
        isCritical: true,
        severity: 'HIGH',
        deviation: Math.round(deviation * 100) / 100,
        message: `Value ${value} is below critical low threshold ${thresholds.criticalLow}`,
      };
    }

    if (thresholds.criticalHigh != null && value > thresholds.criticalHigh) {
      const deviation = ((value - thresholds.criticalHigh) / Math.abs(thresholds.criticalHigh)) * 100;
      return {
        isCritical: true,
        severity: 'HIGH',
        deviation: Math.round(deviation * 100) / 100,
        message: `Value ${value} is above critical high threshold ${thresholds.criticalHigh}`,
      };
    }

    if (item.referenceRangeLow != null && item.referenceRangeHigh != null) {
      const rangeSpan = item.referenceRangeHigh - item.referenceRangeLow;
      const twiceRangeLow = item.referenceRangeLow - rangeSpan;
      const twiceRangeHigh = item.referenceRangeHigh + rangeSpan;

      if (value < twiceRangeLow || value > twiceRangeHigh) {
        const deviation = value < item.referenceRangeLow
          ? ((item.referenceRangeLow - value) / rangeSpan) * 100
          : ((value - item.referenceRangeHigh) / rangeSpan) * 100;
        return {
          isCritical: true,
          severity: 'MODERATE',
          deviation: Math.round(deviation * 100) / 100,
          message: `Value ${value} is beyond 2x reference range [${item.referenceRangeLow}-${item.referenceRangeHigh}]`,
        };
      }
    }

    return { isCritical: false, severity: 'NONE', deviation: 0, message: 'Value is within acceptable limits' };
  }

  getCriticalThresholds(labTest: any): CriticalThresholds {
    const defaultThresholds: CriticalThresholds = {
      criticalLow: null,
      criticalHigh: null,
      panicLow: null,
      panicHigh: null,
    };

    if (!labTest.referenceRange) return defaultThresholds;

    let range: any = labTest.referenceRange;
    if (typeof range === 'string') {
      try {
        range = JSON.parse(range);
      } catch {
        return defaultThresholds;
      }
    }

    if (range.criticalLow != null) defaultThresholds.criticalLow = Number(range.criticalLow);
    if (range.criticalHigh != null) defaultThresholds.criticalHigh = Number(range.criticalHigh);
    if (range.panicLow != null) defaultThresholds.panicLow = Number(range.panicLow);
    if (range.panicHigh != null) defaultThresholds.panicHigh = Number(range.panicHigh);

    if (range.male?.criticalLow != null) defaultThresholds.criticalLow = Number(range.male.criticalLow);
    if (range.male?.criticalHigh != null) defaultThresholds.criticalHigh = Number(range.male.criticalHigh);
    if (range.female?.criticalLow != null) defaultThresholds.criticalLow = Number(range.female.criticalLow);
    if (range.female?.criticalHigh != null) defaultThresholds.criticalHigh = Number(range.female.criticalHigh);

    if (range.male?.panicLow != null) defaultThresholds.panicLow = Number(range.male.panicLow);
    if (range.male?.panicHigh != null) defaultThresholds.panicHigh = Number(range.male.panicHigh);
    if (range.female?.panicLow != null) defaultThresholds.panicLow = Number(range.female.panicLow);
    if (range.female?.panicHigh != null) defaultThresholds.panicHigh = Number(range.female.panicHigh);

    if (defaultThresholds.criticalLow == null && defaultThresholds.panicLow == null) {
      const refLow = range.low != null ? Number(range.low) : null;
      const refHigh = range.high != null ? Number(range.high) : null;
      if (refLow != null && refHigh != null) {
        const rangeSpan = refHigh - refLow;
        defaultThresholds.criticalLow = refLow - rangeSpan * 1.5;
        defaultThresholds.criticalHigh = refHigh + rangeSpan * 1.5;
        defaultThresholds.panicLow = refLow - rangeSpan * 3;
        defaultThresholds.panicHigh = refHigh + rangeSpan * 3;
      }
    }

    return defaultThresholds;
  }

  async createAlert(item: any, report: any, patient: any): Promise<any> {
    const evaluation = this.evaluateItem(item, item.labTest);
    const thresholds = this.getCriticalThresholds(item.labTest);

    const alertData = {
      reportId: report.id,
      reportItemId: item.id,
      patientId: patient.id,
      labTestId: item.labTestId,
      testNameAr: item.labTest?.nameAr || '',
      testNameEn: item.labTest?.nameEn || '',
      value: item.value,
      numericValue: item.numericValue,
      unit: item.unit || item.labTest?.units || '',
      referenceRangeLow: item.referenceRangeLow ?? thresholds.criticalLow,
      referenceRangeHigh: item.referenceRangeHigh ?? thresholds.criticalHigh,
      severity: evaluation.severity,
      deviation: evaluation.deviation,
      message: evaluation.message,
      status: 'PENDING',
      patientNameAr: patient.firstNameAr && patient.lastNameAr
        ? `${patient.firstNameAr} ${patient.lastNameAr}`
        : '',
      patientNameEn: patient.firstNameEn && patient.lastNameEn
        ? `${patient.firstNameEn} ${patient.lastNameEn}`
        : '',
      reportNumber: report.reportNumber,
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedById: null,
      resolvedAt: null,
      resolvedById: null,
      resolutionNotes: null,
      resolutionAction: null,
      escalatedAt: null,
      escalatedToId: null,
    };

    const alert = await (this.prisma as any).criticalAlert.create({ data: alertData });
    this.logger.warn(`Critical alert created: ${alert.id} (severity: ${evaluation.severity})`);
    return alert;
  }

  async notifyCriticalValue(alert: any): Promise<void> {
    try {
      const notificationData = {
        type: 'CRITICAL_ALERT',
        severity: alert.severity,
        titleAr: `تنبيهCritical: ${alert.testNameAr}`,
        titleEn: `Critical Alert: ${alert.testNameEn}`,
        bodyAr: `قيمة ${alert.testNameAr} هي ${alert.value} ${alert.unit} - ${alert.message}`,
        bodyEn: `${alert.testNameEn} value is ${alert.value} ${alert.unit} - ${alert.message}`,
        data: {
          alertId: alert.id,
          reportId: alert.reportId,
          patientId: alert.patientId,
          severity: alert.severity,
          testName: alert.testNameEn,
          value: alert.value,
        },
        timestamp: new Date().toISOString(),
      };

      this.notificationGateway.broadcastToAdmins('criticalAlert', notificationData);

      this.notificationGateway.broadcastToStaff('criticalAlert', notificationData);

      this.logger.log(`Critical alert ${alert.id} broadcasted via WebSocket`);
    } catch (error) {
      this.logger.error(`Failed to send real-time alert for ${alert.id}`, error);
    }

    try {
      const escalationDelay = this.config.get<number>('CRITICAL_ESCALATION_MINUTES', 30);
      const escalatedAt = new Date(Date.now() + escalationDelay * 60 * 1000);

      const scheduledEscalation = (this.prisma as any).scheduledTask;
      await scheduledEscalation?.create({
        data: {
          type: 'ESCALATE_CRITICAL_ALERT',
          referenceId: alert.id,
          scheduledAt: escalatedAt,
          status: 'PENDING',
          metadata: { alertId: alert.id, severity: alert.severity },
        },
      }).catch(() => {
        this.logger.warn('Scheduled task table not available, escalation will not be auto-scheduled');
      });
    } catch (error) {
      this.logger.warn('Could not schedule escalation task', error);
    }
  }

  async getActiveAlerts(filters: AlertFilters): Promise<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 20,
      status = 'PENDING',
      severity,
      patientId,
      doctorId,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { status };

    if (severity) where.severity = severity;
    if (patientId) where.patientId = patientId;

    const [alerts, total] = await Promise.all([
      (this.prisma as any).criticalAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          resolvedBy: { select: { id: true, firstNameEn: true, lastNameEn: true } },
          acknowledgedBy: { select: { id: true, firstNameEn: true, lastNameEn: true } },
          escalatedTo: { select: { id: true, firstNameEn: true, lastNameEn: true } },
        },
      }),
      (this.prisma as any).criticalAlert.count({ where }),
    ]);

    return {
      data: alerts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async resolveAlert(alertId: string, userId: string, resolution: Resolution): Promise<any> {
    const alert = await (this.prisma as any).criticalAlert.findUnique({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Critical alert with ID ${alertId} not found`);
    }

    if (alert.status === 'RESOLVED') {
      throw new BadRequestException('Alert is already resolved');
    }

    const resolved = await (this.prisma as any).criticalAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedById: userId,
        resolvedAt: new Date(),
        resolutionNotes: resolution.notes,
        resolutionAction: resolution.action || null,
      },
    });

    this.logger.log(`Critical alert ${alertId} resolved by user ${userId}`);

    if (resolution.followUpRequired) {
      await this.createFollowUpTask(alert, resolution);
    }

    return resolved;
  }

  private async createFollowUpTask(alert: any, resolution: Resolution): Promise<void> {
    try {
      const followUpDate = resolution.followUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await (this.prisma as any).followUpTask?.create({
        data: {
          referenceType: 'CRITICAL_ALERT',
          referenceId: alert.id,
          patientId: alert.patientId,
          description: `Follow-up for critical alert: ${alert.testNameEn}`,
          dueDate: followUpDate,
          status: 'PENDING',
          notes: resolution.notes,
          createdAt: new Date(),
        },
      }).catch(() => this.logger.warn('Follow-up task table not available'));
    } catch (error) {
      this.logger.warn('Could not create follow-up task', error);
    }
  }

  async getAlertHistory(patientId: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
    const where: any = { patientId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const alerts = await (this.prisma as any).criticalAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        resolvedBy: { select: { id: true, firstNameEn: true, lastNameEn: true } },
        acknowledgedBy: { select: { id: true, firstNameEn: true, lastNameEn: true } },
      },
    });

    return alerts;
  }

  async getAlertStats(dateFrom?: string, dateTo?: string): Promise<AlertStats> {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, resolved, pending, escalated, acknowledged, bySeverity, criticalAlerts, alertList] = await Promise.all([
      (this.prisma as any).criticalAlert.count({ where }),
      (this.prisma as any).criticalAlert.count({ where: { ...where, status: 'RESOLVED' } }),
      (this.prisma as any).criticalAlert.count({ where: { ...where, status: 'PENDING' } }),
      (this.prisma as any).criticalAlert.count({ where: { ...where, status: 'ESCALATED' } }),
      (this.prisma as any).criticalAlert.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      (this.prisma as any).criticalAlert.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      (this.prisma as any).criticalAlert.findMany({
        where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      (this.prisma as any).criticalAlert.groupBy({
        by: ['labTestId', 'testNameEn'],
        where,
        _count: true,
        orderBy: { _count: { labTestId: 'desc' } },
        take: 10,
      }),
    ]);

    let avgResponseTimeMinutes = 0;
    if (criticalAlerts.length > 0) {
      const totalMs = criticalAlerts.reduce((sum: number, a: any) => {
        const created = new Date(a.createdAt).getTime();
        const resolved = new Date(a.resolvedAt).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResponseTimeMinutes = Math.round(totalMs / criticalAlerts.length / 60000 * 100) / 100;
    }

    const mostCommonCriticalTests = alertList.map((a: any) => ({
      testId: a.labTestId,
      testName: a.testNameEn,
      count: a._count,
    }));

    const bySeverityFormatted = bySeverity.map((s: any) => ({
      severity: s.severity,
      count: s._count,
    }));

    const byDateRaw = await (this.prisma as any).criticalAlert.findMany({
      where,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dateCountMap = new Map<string, number>();
    for (const a of byDateRaw) {
      const dateKey = new Date(a.createdAt).toISOString().split('T')[0];
      dateCountMap.set(dateKey, (dateCountMap.get(dateKey) || 0) + 1);
    }
    const byDate = Array.from(dateCountMap.entries()).map(([date, count]) => ({ date, count }));

    return {
      total,
      resolved,
      pending,
      escalated,
      acknowledged,
      criticalCount: bySeverityFormatted.find((s: any) => s.severity === 'CRITICAL')?.count || 0,
      moderateCount: bySeverityFormatted.find((s: any) => s.severity === 'MODERATE')?.count || 0,
      lowCount: bySeverityFormatted.find((s: any) => s.severity === 'LOW')?.count || 0,
      avgResponseTimeMinutes,
      mostCommonCriticalTests,
      bySeverity: bySeverityFormatted,
      byDate,
    };
  }

  async escalateAlert(alertId: string): Promise<any> {
    const alert = await (this.prisma as any).criticalAlert.findUnique({
      where: { id: alertId },
      include: {
        report: { select: { id: true, reportNumber: true } },
        patient: { select: { id: true, firstNameEn: true, lastNameEn: true } },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Critical alert with ID ${alertId} not found`);
    }

    if (alert.status === 'RESOLVED') {
      throw new BadRequestException('Cannot escalate a resolved alert');
    }

    const seniorDoctor = await (this.prisma as any).user.findFirst({
      where: { role: { in: ['SENIOR_DOCTOR', 'SUPER_ADMIN'] }, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, firstNameEn: true, lastNameEn: true, email: true, phone: true },
    });

    if (!seniorDoctor) {
      throw new NotFoundException('No senior doctor available for escalation');
    }

    const escalated = await (this.prisma as any).criticalAlert.update({
      where: { id: alertId },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
        escalatedToId: seniorDoctor.id,
      },
    });

    this.logger.warn(`Critical alert ${alertId} escalated to senior doctor ${seniorDoctor.id}`);

    try {
      this.notificationGateway.sendToUser(seniorDoctor.id, {
        type: 'ESCALATED_CRITICAL_ALERT',
        titleEn: `Escalated Critical Alert: ${alert.testNameEn}`,
        bodyEn: `Alert for patient ${alert.patientNameEn || alert.patientId} - ${alert.testNameEn}: ${alert.value} ${alert.unit}`,
        data: {
          alertId: alert.id,
          reportId: alert.reportId,
          severity: alert.severity,
          originalAlertCreatedAt: alert.createdAt,
        },
        severity: 'URGENT',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to notify senior doctor about escalation`, error);
    }

    return escalated;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<any> {
    const alert = await (this.prisma as any).criticalAlert.findUnique({ where: { id: alertId } });
    if (!alert) {
      throw new NotFoundException(`Critical alert with ID ${alertId} not found`);
    }

    if (alert.status === 'RESOLVED') {
      throw new BadRequestException('Alert is already resolved');
    }

    if (alert.status === 'ACKNOWLEDGED') {
      return alert;
    }

    const acknowledged = await (this.prisma as any).criticalAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    });

    this.logger.log(`Critical alert ${alertId} acknowledged by user ${userId}`);
    return acknowledged;
  }
}
