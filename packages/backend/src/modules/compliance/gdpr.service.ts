import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { DataEncryptionService } from './data-encryption.service';

interface ExportedUserData {
  exportedAt: string;
  userId: string;
  profile: any;
  sessions: any[];
  devices: any[];
  loginHistory: any[];
  consents: any[];
  auditLogs: any[];
}

interface ConsentRecord {
  userId: string;
  consentType: string;
  version: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}

interface BreachData {
  affectedUserIds: string[];
  dataTypes: string[];
  breachDate: string;
  discoveryDate: string;
  description: string;
}

interface DataProcessingEntry {
  activity: string;
  purpose: string;
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: string;
  legalBasis: string;
}

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);
  private readonly DATA_RETENTION_YEARS = 7;
  private readonly DELETION_CONFIRMATION = 'DELETE MY DATA';

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: DataEncryptionService,
  ) {}

  async exportUserData(userId: string): Promise<ExportedUserData> {
    try {
      const user = await (this.prisma as any).authUser.findUnique({
        where: { id: userId },
        include: {
          sessions: {
            select: {
              id: true,
              ipAddress: true,
              userAgent: true,
              locationCity: true,
              locationCountry: true,
              startedAt: true,
              lastActivityAt: true,
            },
          },
          devices: {
            select: {
              id: true,
              deviceName: true,
              deviceType: true,
              deviceOs: true,
              deviceBrowser: true,
              lastSeenAt: true,
              createdAt: true,
            },
          },
          loginHistory: {
            select: {
              id: true,
              status: true,
              failureReason: true,
              ipAddress: true,
              ipCountry: true,
              ipCity: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
          },
          consents: {
            select: {
              id: true,
              consentType: true,
              version: true,
              granted: true,
              grantedAt: true,
              withdrawnAt: true,
            },
          },
          auditLogs: {
            select: {
              id: true,
              action: true,
              resourceType: true,
              resourceId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
          },
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const { passwordHash, totpSecret, backupCodes, ...safeProfile } = user as any;

      const exportedData: ExportedUserData = {
        exportedAt: new Date().toISOString(),
        userId,
        profile: safeProfile,
        sessions: (user as any).sessions || [],
        devices: (user as any).devices || [],
        loginHistory: (user as any).loginHistory || [],
        consents: (user as any).consents || [],
        auditLogs: (user as any).auditLogs || [],
      };

      this.logger.log(`User data exported for ${userId}`);
      return exportedData;
    } catch (error) {
      this.logger.error(`Failed to export data for user ${userId}`, error);
      throw error;
    }
  }

  async deleteUserData(
    userId: string,
    confirmation: string,
  ): Promise<{ anonymized: boolean; message: string }> {
    if (confirmation !== this.DELETION_CONFIRMATION) {
      throw new Error('Invalid confirmation. Please provide "DELETE MY DATA" to confirm deletion.');
    }

    try {
      const user = await (this.prisma as any).authUser.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const anonymousId = randomUUID();
      const anonymizedEmail = `deleted-${anonymousId}@anonymized.com`;
      const anonymizedPhone = '0000000000';
      const anonymizedName = 'Deleted User';

      await (this.prisma as any).authUser.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          phone: anonymizedPhone,
          phoneCountryCode: null,
          firstNameAr: anonymizedName,
          lastNameAr: anonymizedName,
          firstNameEn: anonymizedName,
          lastNameEn: anonymizedName,
          nationalId: null,
          dateOfBirth: null,
          avatarUrl: null,
          passwordHash: this.encryptionService.hashToken(randomUUID()),
          twoFactorSecret: null,
          totpSecret: null,
          backupCodes: [],
          biometricCredentialId: null,
          biometricPublicKey: null,
          metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      });

      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });

      await this.prisma.device.updateMany({
        where: { userId },
        data: {
          isTrusted: false,
        },
      });

      this.logger.log(`User data anonymized for ${userId}`);
      return { anonymized: true, message: 'User data has been anonymized successfully.' };
    } catch (error) {
      this.logger.error(`Failed to delete data for user ${userId}`, error);
      throw error;
    }
  }

  async recordConsent(record: ConsentRecord): Promise<string> {
    try {
      if (record.granted) {
        const existingConsent = await (this.prisma as any).authConsent.findFirst({
          where: {
            userId: record.userId,
            consentType: record.consentType,
            granted: true,
            withdrawnAt: null,
          },
        });

        if (existingConsent) {
          await (this.prisma as any).authConsent.update({
            where: { id: existingConsent.id },
            data: { withdrawnAt: new Date() },
          });
        }
      }

      const consent = await (this.prisma as any).authConsent.create({
        data: {
          userId: record.userId,
          consentType: record.consentType,
          version: record.version,
          granted: record.granted,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
          grantedAt: new Date(),
          withdrawnAt: record.granted ? null : new Date(),
        },
      });

      this.logger.log(
        `Consent ${record.granted ? 'granted' : 'withdrawn'}: ${record.consentType} v${record.version} for user ${record.userId}`,
      );

      return consent.id;
    } catch (error) {
      this.logger.error('Failed to record consent', error);
      throw error;
    }
  }

  async getConsentHistory(userId: string): Promise<any[]> {
    try {
      return (this.prisma as any).authConsent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch consent history for user ${userId}`, error);
      throw error;
    }
  }

  async checkDataRetention(): Promise<{
    usersPastRetention: number;
    oldestUser: Date | null;
    recommendations: string[];
  }> {
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.DATA_RETENTION_YEARS);

    try {
      const usersPastRetention = await (this.prisma as any).authUser.count({
        where: {
          createdAt: { lt: retentionCutoff },
          deletedAt: null,
        },
      });

      const oldestUser = await (this.prisma as any).authUser.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      const recommendations: string[] = [];
      if (usersPastRetention > 0) {
        recommendations.push(
          `${usersPastRetention} users are past the ${this.DATA_RETENTION_YEARS}-year retention period. Consider anonymizing or deleting their data.`,
        );
      }

      const inactiveUsers = await (this.prisma as any).authUser.count({
        where: {
          lastLoginAt: { lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
          status: 'ACTIVE',
        },
      });

      if (inactiveUsers > 0) {
        recommendations.push(
          `${inactiveUsers} users have not logged in for over a year. Consider sending a data retention notice.`,
        );
      }

      return {
        usersPastRetention,
        oldestUser: oldestUser?.createdAt || null,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to check data retention', error);
      throw error;
    }
  }

  async anonymizeUser(userId: string): Promise<{ anonymized: boolean }> {
    try {
      const anonymousId = randomUUID();

      await (this.prisma as any).authUser.update({
        where: { id: userId },
        data: {
          email: `anon-${anonymousId}@anonymized.com`,
          phone: `00${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
          firstNameAr: 'مستخدم مجهول',
          lastNameAr: 'مجهول',
          firstNameEn: 'Anonymous',
          lastNameEn: 'User',
          nationalId: null,
          dateOfBirth: null,
          avatarUrl: null,
          passwordHash: this.encryptionService.hashToken(randomUUID()),
          twoFactorSecret: null,
          totpSecret: null,
          metadata: { anonymized: true, anonymizedAt: new Date().toISOString() },
        },
      });

      this.logger.log(`User ${userId} fully anonymized`);
      return { anonymized: true };
    } catch (error) {
      this.logger.error(`Failed to anonymize user ${userId}`, error);
      throw error;
    }
  }

  async getDataProcessingLog(): Promise<DataProcessingEntry[]> {
    return [
      {
        activity: 'User Registration',
        purpose: 'Account creation and identity verification',
        dataCategories: ['Identity', 'Contact', 'Authentication'],
        recipients: ['Internal systems'],
        retentionPeriod: '7 years',
        legalBasis: 'Contract performance',
      },
      {
        activity: 'Login Processing',
        purpose: 'Authentication and security',
        dataCategories: ['Authentication', 'Device', 'Location'],
        recipients: ['Internal systems'],
        retentionPeriod: '1 year',
        legalBasis: 'Contract performance',
      },
      {
        activity: 'Medical Records Processing',
        purpose: 'Laboratory test management and reporting',
        dataCategories: ['Health', 'Medical', 'PHI'],
        recipients: ['Healthcare providers', 'Patients'],
        retentionPeriod: '7 years (medical data)',
        legalBasis: 'Healthcare provision',
      },
      {
        activity: 'Payment Processing',
        purpose: 'Billing and financial transactions',
        dataCategories: ['Financial', 'Payment'],
        recipients: ['Payment processors', 'Banks'],
        retentionPeriod: '7 years',
        legalBasis: 'Contract performance / Legal obligation',
      },
      {
        activity: 'Marketing Communications',
        purpose: 'Promotional emails and notifications',
        dataCategories: ['Contact', 'Preferences'],
        recipients: ['Marketing platforms'],
        retentionPeriod: 'Until consent withdrawn',
        legalBasis: 'Consent',
      },
      {
        activity: 'Security Monitoring',
        purpose: 'Fraud prevention and security',
        dataCategories: ['Device', 'Location', 'Behavior'],
        recipients: ['Internal security team'],
        retentionPeriod: '1 year',
        legalBasis: 'Legitimate interest',
      },
    ];
  }

  async checkBreachNotification(breachData: BreachData): Promise<{
    requiresNotification: boolean;
    notificationDeadline: string;
    affectedCount: number;
    severity: string;
  }> {
    const breachDate = new Date(breachData.breachDate);
    const discoveryDate = new Date(breachData.discoveryDate);
    const hoursSinceBreach = (discoveryDate.getTime() - breachDate.getTime()) / (1000 * 60 * 60);

    const healthDataBreached = breachData.dataTypes.some((dt) =>
      ['medical', 'health', 'phi', 'diagnosis', 'lab_results'].includes(dt.toLowerCase()),
    );
    const financialDataBreached = breachData.dataTypes.some((dt) =>
      ['payment', 'financial', 'credit_card', 'bank_account'].includes(dt.toLowerCase()),
    );

    let severity = 'low';
    if (healthDataBreached) severity = 'critical';
    else if (financialDataBreached) severity = 'high';
    else if (breachData.affectedUserIds.length > 100) severity = 'medium';

    const requiresNotification = severity !== 'low' || breachData.affectedUserIds.length > 50;

    const deadline = new Date(breachDate.getTime() + 72 * 60 * 60 * 1000);

    if (requiresNotification && hoursSinceBreach > 72) {
      this.logger.warn(
        `CRITICAL: Breach notification deadline exceeded! ${hoursSinceBreach.toFixed(1)} hours since breach.`,
      );
    }

    return {
      requiresNotification,
      notificationDeadline: deadline.toISOString(),
      affectedCount: breachData.affectedUserIds.length,
      severity,
    };
  }
}
