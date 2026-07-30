import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

interface LoginRiskData {
  userId: string;
  ip: string;
  deviceFingerprint?: string;
  userAgent?: string;
  isNewDevice?: boolean;
  isVpn?: boolean;
  isTor?: boolean;
}

interface RiskAssessment {
  score: number;
  factors: string[];
  requiresMFA: boolean;
  requiresManualReview: boolean;
}

interface SecurityDashboard {
  period: string;
  failedAttempts: number;
  blockedIPs: number;
  activeSessions: number;
  suspiciousActivities: number;
  riskDistribution: { low: number; medium: number; high: number; critical: number };
}

interface SuspiciousActivity {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  status: string;
  failureReason: string;
  riskScore: number;
  riskFactors: string[];
  createdAt: Date;
}

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);
  private readonly MAX_TRAVEL_SPEED_KMH = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async assessLoginRisk(data: LoginRiskData): Promise<RiskAssessment> {
    let score = 0;
    const factors: string[] = [];

    if (data.isNewDevice) {
      score += 30;
      factors.push('new_device');
    }

    if (data.isVpn) {
      score += 10;
      factors.push('vpn_detected');
    }

    if (data.isTor) {
      score += 40;
      factors.push('tor_detected');
    }

    const recentFailures = await this.getRecentFailures(data.userId, 15);
    if (recentFailures >= 3) {
      score += 15;
      factors.push(`rapid_failures:${recentFailures}`);
    }

    const impossibleTravel = await this.detectImpossibleTravel(
      data.userId,
      data.ip,
      new Date(),
    );
    if (impossibleTravel) {
      score += 50;
      factors.push('impossible_travel');
    }

    const unusualLocation = await this.detectUnusualLocation(data.userId, data.ip);
    if (unusualLocation) {
      score += 20;
      factors.push('unusual_location');
    }

    score = Math.min(score, 100);

    const requiresMFA = score >= 50;
    const requiresManualReview = score >= 80;

    this.logger.log(
      `Login risk assessment for user ${data.userId}: score=${score}, factors=[${factors.join(', ')}]`,
    );

    return { score, factors, requiresMFA, requiresManualReview };
  }

  async createSecurityAlert(
    userId: string,
    type: string,
    severity: 'info' | 'warning' | 'critical',
    data: Record<string, any>,
  ): Promise<string> {
    try {
      const alert = await (this.prisma as any).authSecurityAlert.create({
        data: {
          userId,
          type,
          severity: severity.toUpperCase() as any,
          titleEn: data.titleEn || type,
          titleAr: data.titleAr || type,
          descriptionEn: data.descriptionEn || '',
          descriptionAr: data.descriptionAr || '',
          ipAddress: data.ipAddress,
          deviceInfo: data.deviceInfo,
          actionRequired: severity === 'critical',
          actionUrl: data.actionUrl,
          metadata: data.metadata || {},
        },
      });

      this.logger.log(
        `Security alert created: ${alert.id} for user ${userId} (${type}, ${severity})`,
      );

      return alert.id;
    } catch (error) {
      this.logger.error('Failed to create security alert', error);
      throw error;
    }
  }

  async getSecurityAlerts(
    userId: string,
    filters?: {
      severity?: string;
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    },
  ): Promise<{ alerts: any[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (filters?.severity) {
      where.severity = filters.severity.toUpperCase();
    }
    if (filters?.unreadOnly) {
      where.isRead = false;
    }

    try {
      const [alerts, total] = await Promise.all([
        (this.prisma as any).authSecurityAlert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (this.prisma as any).authSecurityAlert.count({ where }),
      ]);

      return { alerts, total, page, limit };
    } catch (error) {
      this.logger.error('Failed to fetch security alerts', error);
      throw error;
    }
  }

  async dismissAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const result = await (this.prisma as any).authSecurityAlert.updateMany({
        where: { id: alertId, userId },
        data: { isDismissed: true, isRead: true },
      });

      if (result.count === 0) {
        this.logger.warn(`Alert ${alertId} not found or access denied for user ${userId}`);
        return false;
      }

      this.logger.log(`Alert ${alertId} dismissed by user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to dismiss alert', error);
      throw error;
    }
  }

  async getSecurityDashboard(period?: string): Promise<SecurityDashboard> {
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case '24h':
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    try {
      const [
        failedAttempts,
        blockedIPs,
        activeSessions,
        suspiciousActivities,
        lowRisk,
        mediumRisk,
        highRisk,
        criticalRisk,
      ] = await Promise.all([
        (this.prisma as any).authLoginHistory.count({
          where: { status: 'FAILED', createdAt: { gte: dateFrom } },
        }),
        (this.prisma as any).authRateLimit.count({
          where: { blockedUntil: { gt: now } },
        }),
        (this.prisma as any).authSession.count({
          where: { revokedAt: null, expiresAt: { gt: now } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { status: 'SUSPICIOUS', createdAt: { gte: dateFrom } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: {
            createdAt: { gte: dateFrom },
            riskScore: { gte: 0, lt: 30 },
          },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: {
            createdAt: { gte: dateFrom },
            riskScore: { gte: 30, lt: 60 },
          },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: {
            createdAt: { gte: dateFrom },
            riskScore: { gte: 60, lt: 80 },
          },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: {
            createdAt: { gte: dateFrom },
            riskScore: { gte: 80 },
          },
        }),
      ]);

      return {
        period: period || '24h',
        failedAttempts,
        blockedIPs,
        activeSessions,
        suspiciousActivities,
        riskDistribution: {
          low: lowRisk,
          medium: mediumRisk,
          high: highRisk,
          critical: criticalRisk,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch security dashboard', error);
      throw error;
    }
  }

  async detectImpossibleTravel(
    userId: string,
    currentIp: string,
    currentTimestamp: Date,
  ): Promise<boolean> {
    try {
      const lastLogin = await (this.prisma as any).authLoginHistory.findFirst({
        where: {
          userId,
          status: 'SUCCESS',
          geoLatitude: { not: null },
          geoLongitude: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!lastLogin || !lastLogin.geoLatitude || !lastLogin.geoLongitude) {
        return false;
      }

      const currentLogin = await (this.prisma as any).authLoginHistory.findFirst({
        where: {
          userId,
          ipAddress: currentIp,
          geoLatitude: { not: null },
          geoLongitude: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!currentLogin || !currentLogin.geoLatitude || !currentLogin.geoLongitude) {
        return false;
      }

      const distance = this.haversineDistance(
        Number(lastLogin.geoLatitude),
        Number(lastLogin.geoLongitude),
        Number(currentLogin.geoLatitude),
        Number(currentLogin.geoLongitude),
      );

      const timeDiffHours =
        (new Date(currentLogin.createdAt).getTime() - new Date(lastLogin.createdAt).getTime()) /
        (1000 * 60 * 60);

      if (timeDiffHours <= 0) return false;

      const speedKmh = distance / timeDiffHours;

      return speedKmh > this.MAX_TRAVEL_SPEED_KMH;
    } catch (error) {
      this.logger.error('Failed to detect impossible travel', error);
      return false;
    }
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async getRecentFailures(userId: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return (this.prisma as any).authLoginHistory.count({
      where: {
        userId,
        status: 'FAILED',
        createdAt: { gte: since },
      },
    });
  }

  private async detectUnusualLocation(userId: string, currentIp: string): Promise<boolean> {
    try {
      const recentLogins = await (this.prisma as any).authLoginHistory.findMany({
        where: {
          userId,
          status: 'SUCCESS',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { ipAddress: true, ipCountry: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      if (recentLogins.length < 5) return false;

      const knownIPs = new Set(recentLogins.map((l: { ipAddress: string }) => l.ipAddress).filter(Boolean));
      return !knownIPs.has(currentIp);
    } catch {
      return false;
    }
  }

  async getSuspiciousActivities(filters?: {
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    minRiskScore?: number;
    page?: number;
    limit?: number;
  }): Promise<{ activities: SuspiciousActivity[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ status: 'SUSPICIOUS' }, { status: 'FAILED' }, { riskScore: { gte: filters?.minRiskScore || 50 } }],
    };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    try {
      const [activities, total] = await Promise.all([
        (this.prisma as any).authLoginHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (this.prisma as any).authLoginHistory.count({ where }),
      ]);

      return { activities, total };
    } catch (error) {
      this.logger.error('Failed to fetch suspicious activities', error);
      throw error;
    }
  }

  async generateSecurityReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    period: { from: string; to: string };
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    blockedAttempts: number;
    suspiciousActivities: number;
    riskDistribution: { low: number; medium: number; high: number; critical: number };
    topThreatenedIPs: Array<{ ip: string; attempts: number }>;
    alertsGenerated: number;
    mfaChallenges: number;
  }> {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    try {
      const [
        totalLogins,
        successfulLogins,
        failedLogins,
        blockedAttempts,
        suspiciousActivities,
        lowRisk,
        mediumRisk,
        highRisk,
        criticalRisk,
        alertsGenerated,
        mfaChallenges,
      ] = await Promise.all([
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, status: 'SUCCESS' },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, status: 'FAILED' },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, status: 'BLOCKED' },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, status: 'SUSPICIOUS' },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, riskScore: { gte: 0, lt: 30 } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, riskScore: { gte: 30, lt: 60 } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, riskScore: { gte: 60, lt: 80 } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, riskScore: { gte: 80 } },
        }),
        (this.prisma as any).authSecurityAlert.count({
          where: { createdAt: { gte: from, lte: to } },
        }),
        (this.prisma as any).authLoginHistory.count({
          where: { createdAt: { gte: from, lte: to }, mfaRequired: true },
        }),
      ]);

      const topIPs = await (this.prisma as any).authLoginHistory.groupBy({
        by: ['ipAddress'],
        where: {
          createdAt: { gte: from, lte: to },
          status: 'FAILED',
          ipAddress: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const topThreatenedIPs = topIPs
        .filter((ip: { ipAddress: string | null }) => ip.ipAddress)
        .map((ip: { ipAddress: string; _count: { id: number } }) => ({
          ip: ip.ipAddress,
          attempts: ip._count.id,
        }));

      return {
        period: { from: dateFrom, to: dateTo },
        totalLogins,
        successfulLogins,
        failedLogins,
        blockedAttempts,
        suspiciousActivities,
        riskDistribution: {
          low: lowRisk,
          medium: mediumRisk,
          high: highRisk,
          critical: criticalRisk,
        },
        topThreatenedIPs,
        alertsGenerated,
        mfaChallenges,
      };
    } catch (error) {
      this.logger.error('Failed to generate security report', error);
      throw error;
    }
  }
}
