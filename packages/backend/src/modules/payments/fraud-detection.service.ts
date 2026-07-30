import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface PaymentData {
  patientId: string;
  amount: number;
  method: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  cardLast4?: string;
  cardCountry?: string;
  email?: string;
}

export interface RiskScore {
  score: number;
  factors: string[];
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresReview: boolean;
}

export interface FraudAlertFilters {
  riskLevel?: string;
  status?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  private readonly HIGH_RISK_BIN_RANGES = [
    '400005', '400016', '400017', '400018',
    '510000', '510004', '510005',
    '222300', '222301', '222302',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async assessPaymentRisk(paymentData: PaymentData): Promise<RiskScore> {
    const factors: string[] = [];
    let score = 0;

    const rules = await this.getActiveRules();

    for (const rule of rules) {
      const ruleResult = this.evaluateRule(rule, paymentData);
      if (ruleResult.triggered) {
        factors.push(ruleResult.reason);
        score += rule.points;
      }
    }

    const velocityResult = await this.checkVelocity(paymentData);
    if (velocityResult.triggered) {
      factors.push(velocityResult.reason);
      score += velocityResult.points;
    }

    const amountResult = await this.checkAmountAnomaly(paymentData);
    if (amountResult.triggered) {
      factors.push(amountResult.reason);
      score += amountResult.points;
    }

    const deviceResult = await this.checkDeviceFingerprint(paymentData);
    if (deviceResult.triggered) {
      factors.push(deviceResult.reason);
      score += deviceResult.points;
    }

    const geoResult = await this.checkGeolocation(paymentData);
    if (geoResult.triggered) {
      factors.push(geoResult.reason);
      score += geoResult.points;
    }

    const binResult = this.checkBinRange(paymentData);
    if (binResult.triggered) {
      factors.push(binResult.reason);
      score += binResult.points;
    }

    const blacklistResult = await this.checkBlacklist(paymentData);
    if (blacklistResult.triggered) {
      factors.push(blacklistResult.reason);
      score += blacklistResult.points;
    }

    score = Math.min(score, 100);

    const level = this.determineRiskLevel(score);
    const requiresReview = level === 'HIGH' || level === 'CRITICAL';

    if (level !== 'LOW') {
      await this.createFraudAlert(paymentData, score, level, factors);
    }

    return { score, factors, level, requiresReview };
  }

  async getFraudAlerts(filters: FraudAlertFilters) {
    const { riskLevel, status, patientId, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = {};

    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [alerts, total] = await Promise.all([
      (this.prisma as any).fraudAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).fraudAlert.count({ where }),
    ]);

    return {
      data: alerts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async investigateAlert(id: string, investigatorId: string, notes?: string) {
    const alert = await (this.prisma as any).fraudAlert.findUnique({ where: { id } });
    if (!alert) throw new Error('Fraud alert not found');

    const updated = await (this.prisma as any).fraudAlert.update({
      where: { id },
      data: {
        status: 'INVESTIGATING',
        investigatedBy: investigatorId,
        investigatedAt: new Date(),
        notes: notes || alert.notes,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('FRAUD_ALERT_INVESTIGATED', id, alert.status, {
      investigatorId,
      notes,
    });

    return updated;
  }

  async resolveAlert(id: string, resolution: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'UNDER_REVIEW') {
    const alert = await (this.prisma as any).fraudAlert.findUnique({ where: { id } });
    if (!alert) throw new Error('Fraud alert not found');

    const updated = await (this.prisma as any).fraudAlert.update({
      where: { id },
      data: {
        status: resolution === 'FALSE_POSITIVE' ? 'RESOLVED_FALSE_POSITIVE' : 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (resolution === 'CONFIRMED_FRAUD') {
      await this.blockPayment(alert.patientId, alert.amount);
    }

    await this.createAuditLog('FRAUD_ALERT_RESOLVED', id, alert.status, {
      resolution,
    });

    return updated;
  }

  async getFraudStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalAlerts, byLevel, resolvedCount, confirmedFraudCount, blockedCount] = await Promise.all([
      (this.prisma as any).fraudAlert.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      (this.prisma as any).fraudAlert.groupBy({
        by: ['riskLevel'],
        _count: true,
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      (this.prisma as any).fraudAlert.count({
        where: {
          status: { in: ['RESOLVED', 'RESOLVED_FALSE_POSITIVE'] },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      (this.prisma as any).fraudAlert.count({
        where: {
          resolution: 'CONFIRMED_FRAUD',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      (this.prisma as any).blockedPayment.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }).catch(() => 0),
    ]);

    const levelCounts: Record<string, number> = {};
    byLevel.forEach((item: { riskLevel: string; _count: number }) => {
      levelCounts[item.riskLevel] = item._count;
    });

    return {
      totalAlerts,
      byRiskLevel: levelCounts,
      resolvedAlerts: resolvedCount,
      confirmedFraud: confirmedFraudCount,
      blockedPayments: blockedCount,
      resolutionRate: totalAlerts > 0 ? Math.round((resolvedCount / totalAlerts) * 100) : 0,
      period: { from: thirtyDaysAgo.toISOString(), to: now.toISOString() },
    };
  }

  private async getActiveRules(): Promise<Array<{ ruleType: string; threshold: number; points: number }>> {
    try {
      const rules = await (this.prisma as any).fraudDetectionRule.findMany({
        where: { isActive: true },
      });
      return rules;
    } catch {
      return [
        { ruleType: 'VELOCITY', threshold: 5, points: 30 },
        { ruleType: 'AMOUNT_ANOMALY', threshold: 10000, points: 25 },
        { ruleType: 'BIN_CHECK', threshold: 0, points: 20 },
        { ruleType: 'BLACKLIST', threshold: 0, points: 50 },
        { ruleType: 'GEOLOCATION', threshold: 0, points: 15 },
      ];
    }
  }

  private evaluateRule(
    rule: { ruleType: string; threshold: number; points: number },
    data: PaymentData,
  ): { triggered: boolean; reason: string; points: number } {
    switch (rule.ruleType) {
      case 'IP_BLOCKED':
        return { triggered: false, reason: '', points: 0 };
      default:
        return { triggered: false, reason: '', points: 0 };
    }
  }

  private async checkVelocity(
    data: PaymentData,
  ): Promise<{ triggered: boolean; reason: string; points: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentPayments = await (this.prisma as any).payment.count({
      where: {
        patientId: data.patientId,
        createdAt: { gte: oneHourAgo },
        status: { in: ['COMPLETED', 'PENDING', 'PROCESSING'] },
      },
    }).catch(() => 0);

    if (recentPayments >= 5) {
      return {
        triggered: true,
        reason: `Velocity: ${recentPayments} payments in the last hour`,
        points: 30,
      };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPayments = await (this.prisma as any).payment.count({
      where: {
        patientId: data.patientId,
        createdAt: { gte: todayStart },
        status: { in: ['COMPLETED', 'PENDING', 'PROCESSING'] },
      },
    }).catch(() => 0);

    if (todayPayments >= 10) {
      return {
        triggered: true,
        reason: `Velocity: ${todayPayments} payments today`,
        points: 25,
      };
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private async checkAmountAnomaly(
    data: PaymentData,
  ): Promise<{ triggered: boolean; reason: string; points: number }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const payments = await (this.prisma as any).payment.findMany({
      where: {
        patientId: data.patientId,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true },
    }).catch(() => []);

    if (payments.length === 0) return { triggered: false, reason: '', points: 0 };

    const avgAmount = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) / payments.length;
    const maxAmount = Math.max(...payments.map((p: { amount: number }) => p.amount));

    if (data.amount > avgAmount * 5 && data.amount > 5000) {
      return {
        triggered: true,
        reason: `Amount anomaly: ${data.amount} is ${Math.round(data.amount / avgAmount)}x the average (${Math.round(avgAmount)})`,
        points: 25,
      };
    }

    if (data.amount > maxAmount * 3 && maxAmount > 0) {
      return {
        triggered: true,
        reason: `Amount exceeds 3x patient maximum (max: ${maxAmount})`,
        points: 20,
      };
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private async checkDeviceFingerprint(
    data: PaymentData,
  ): Promise<{ triggered: boolean; reason: string; points: number }> {
    if (!data.deviceFingerprint) return { triggered: false, reason: '', points: 0 };

    const knownDevice = await (this.prisma as any).patientDevice.findFirst({
      where: {
        patientId: data.patientId,
        fingerprint: data.deviceFingerprint,
      },
    }).catch(() => null);

    if (!knownDevice) {
      const recentDeviceCount = await (this.prisma as any).patientDevice.count({
        where: { patientId: data.patientId },
      }).catch(() => 0);

      if (recentDeviceCount >= 3) {
        return {
          triggered: true,
          reason: 'New device fingerprint with multiple known devices',
          points: 15,
        };
      }

      return {
        triggered: true,
        reason: 'New device fingerprint',
        points: 10,
      };
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private async checkGeolocation(
    data: PaymentData,
  ): Promise<{ triggered: boolean; reason: string; points: number }> {
    if (!data.ipAddress || !data.cardCountry) return { triggered: false, reason: '', points: 0 };

    try {
      const ipCountry = await this.resolveCountryFromIP(data.ipAddress);
      if (ipCountry && ipCountry !== data.cardCountry) {
        return {
          triggered: true,
          reason: `Country mismatch: IP from ${ipCountry}, card from ${data.cardCountry}`,
          points: 15,
        };
      }
    } catch {
      this.logger.warn(`Could not resolve IP country for ${data.ipAddress}`);
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private checkBinRange(
    data: PaymentData,
  ): { triggered: boolean; reason: string; points: number } {
    if (!data.cardLast4) return { triggered: false, reason: '', points: 0 };

    const bin = data.cardLast4;
    if (this.HIGH_RISK_BIN_RANGES.some((range) => bin.startsWith(range.substring(0, 6)))) {
      return {
        triggered: true,
        reason: `High-risk BIN range detected: ${bin}`,
        points: 20,
      };
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private async checkBlacklist(
    data: PaymentData,
  ): Promise<{ triggered: boolean; reason: string; points: number }> {
    const checks: Array<{ field: string; value: string }> = [];

    if (data.email) checks.push({ field: 'email', value: data.email });
    if (data.ipAddress) checks.push({ field: 'ip', value: data.ipAddress });
    if (data.cardLast4) checks.push({ field: 'card', value: data.cardLast4 });

    for (const check of checks) {
      try {
        const blocked = await (this.prisma as any).fraudBlacklist.findFirst({
          where: {
            type: check.field,
            value: check.value,
            isActive: true,
          },
        });

        if (blocked) {
          return {
            triggered: true,
            reason: `Blacklist match: ${check.field} = ${check.value}`,
            points: 50,
          };
        }
      } catch {
        // Table may not exist
      }
    }

    return { triggered: false, reason: '', points: 0 };
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  private async createFraudAlert(
    data: PaymentData,
    score: number,
    level: string,
    factors: string[],
  ): Promise<void> {
    try {
      await (this.prisma as any).fraudAlert.create({
        data: {
          patientId: data.patientId,
          amount: data.amount,
          method: data.method,
          ipAddress: data.ipAddress,
          deviceFingerprint: data.deviceFingerprint,
          riskScore: score,
          riskLevel: level,
          factors: JSON.stringify(factors),
          status: 'OPEN',
        },
      });

      this.logger.warn(
        `Fraud alert created: score=${score}, level=${level}, patient=${data.patientId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to create fraud alert: ${(error as Error).message}`);
    }
  }

  private async blockPayment(patientId: string, amount: number): Promise<void> {
    try {
      await (this.prisma as any).blockedPayment.create({
        data: {
          patientId,
          amount,
          reason: 'Confirmed fraud',
          createdAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to block payment: ${(error as Error).message}`);
    }
  }

  private async resolveCountryFromIP(ip: string): Promise<string | null> {
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
      return 'SA';
    }
    return null;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'FRAUD_DETECTION',
          entityId,
          previousState: previousState ? JSON.stringify(previousState) : null,
          newState: JSON.stringify(metadata),
          metadata: JSON.stringify(metadata),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`);
    }
  }
}
