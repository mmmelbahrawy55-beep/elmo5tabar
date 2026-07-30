import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { DataEncryptionService } from './data-encryption.service';

interface AccessLogEntry {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  phi: boolean;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

interface AuditTrailEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  phiAccessed: boolean;
  dataClassification: string;
  createdAt: Date;
}

interface ComplianceReport {
  period: { from: string; to: string };
  totalAccesses: number;
  phiAccesses: number;
  unauthorizedAttempts: number;
  uniqueUsers: number;
  uniqueResources: number;
  accessByType: Record<string, number>;
  accessByUser: Array<{ userId: string; count: number }>;
  violations: Violation[];
  recommendations: string[];
}

interface Violation {
  type: string;
  description: string;
  severity: string;
  userId?: string;
  timestamp: Date;
}

@Injectable()
export class HIPAAService {
  private readonly logger = new Logger(HIPAAService.name);

  private readonly PHI_FIELDS = new Set([
    'patientName',
    'patientPhone',
    'patientEmail',
    'dateOfBirth',
    'nationalId',
    'medicalRecordNumber',
    'diagnosis',
    'diagnosisCode',
    'labResults',
    'medications',
    'allergies',
    'bloodType',
    'medicalHistory',
    'testResults',
    'healthConditions',
    'insuranceNumber',
    'policyNumber',
    'ssn',
    'mrn',
  ]);

  private readonly DATA_CLASSIFICATIONS: Record<string, string> = {
    patient: 'RESTRICTED',
    medical_record: 'RESTRICTED',
    lab_result: 'RESTRICTED',
    diagnosis: 'RESTRICTED',
    prescription: 'RESTRICTED',
    order: 'CONFIDENTIAL',
    report: 'CONFIDENTIAL',
    invoice: 'CONFIDENTIAL',
    appointment: 'INTERNAL',
    user_profile: 'CONFIDENTIAL',
    contact: 'INTERNAL',
    system_log: 'INTERNAL',
    public_content: 'PUBLIC',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: DataEncryptionService,
  ) {}

  async logAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    phi: boolean,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<string> {
    try {
      const classification = this.getDataClassification(resourceType);

      const log = await (this.prisma as any).authAuditLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          details: details || {},
          ipAddress,
          userAgent,
          requestId,
          dataClassification: classification,
          phiAccessed: phi,
          responseStatus: 200,
        },
      });

      if (phi) {
        this.logger.warn(
          `PHI ACCESS: User ${userId} accessed ${resourceType}:${resourceId} (${action})`,
        );
      }

      return log.id;
    } catch (error) {
      this.logger.error('Failed to log access', error);
      throw error;
    }
  }

  async checkAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<{ authorized: boolean; reason: string }> {
    try {
      const user = await (this.prisma as any).authUser.findUnique({
        where: { id: userId },
        select: { id: true, status: true, roleId: true },
      });

      if (!user) {
        return { authorized: false, reason: 'User not found' };
      }

      if (user.status !== 'ACTIVE') {
        return { authorized: false, reason: 'User account is not active' };
      }

      const role = await (this.prisma as any).authRole.findUnique({
        where: { id: user.roleId },
        select: { name: true },
      });

      if (!role) {
        return { authorized: false, reason: 'User role not found' };
      }

      const rolePermissions = await (this.prisma as any).authRolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      });

      const hasResourceAccess = rolePermissions.some(
        (rp: any) =>
          rp.permission.module === resourceType ||
          rp.permission.resource === resourceType ||
          rp.permission.module === '*',
      );

      if (!hasResourceAccess) {
        await this.logAccess(
          userId,
          resourceType,
          resourceId,
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          this.isPHIResource(resourceType),
          { reason: 'Insufficient permissions' },
        );

        return { authorized: false, reason: 'Insufficient permissions for this resource' };
      }

      return { authorized: true, reason: 'Access granted' };
    } catch (error) {
      this.logger.error('Failed to check access', error);
      return { authorized: false, reason: 'Access check failed' };
    }
  }

  async getAccessLogs(
    userId?: string,
    resourceType?: string,
    dateFrom?: string,
    dateTo?: string,
    phiOnly?: boolean,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditTrailEntry[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.userId = userId;
    if (resourceType) where.resourceType = resourceType;
    if (phiOnly) where.phiAccessed = true;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    try {
      const [logs, total] = await Promise.all([
        (this.prisma as any).authAuditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (this.prisma as any).authAuditLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      this.logger.error('Failed to fetch access logs', error);
      throw error;
    }
  }

  async generateBAAReport(): Promise<{
    generatedAt: string;
    complianceStatus: string;
    totalPHIAccesses: number;
    authorizedAccesses: number;
    unauthorizedAttempts: number;
    accessControlMeasures: string[];
    encryptionStatus: string;
    auditLoggingEnabled: boolean;
    trainingRequired: boolean;
    recommendations: string[];
  }> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalPHIAccesses, unauthorizedAttempts, uniqueUsersWithPHIAccess] = await Promise.all([
        (this.prisma as any).authAuditLog.count({
          where: {
            phiAccessed: true,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        (this.prisma as any).authAuditLog.count({
          where: {
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        (this.prisma as any).authAuditLog.groupBy({
          by: ['userId'],
          where: {
            phiAccessed: true,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      const authorizedAccesses = totalPHIAccesses - unauthorizedAttempts;
      const recommendations: string[] = [];

      if (unauthorizedAttempts > 0) {
        recommendations.push(
          `Review ${unauthorizedAttempts} unauthorized access attempts from the last 30 days.`,
        );
      }

      if (uniqueUsersWithPHIAccess.length > 50) {
        recommendations.push(
          'Consider implementing stricter role-based access controls to limit PHI access.',
        );
      }

      recommendations.push('Ensure all staff with PHI access have completed HIPAA training.');
      recommendations.push('Review and update Business Associate Agreements annually.');
      recommendations.push('Conduct quarterly access reviews for PHI-related resources.');

      return {
        generatedAt: now.toISOString(),
        complianceStatus: unauthorizedAttempts === 0 ? 'COMPLIANT' : 'REVIEW_REQUIRED',
        totalPHIAccesses,
        authorizedAccesses,
        unauthorizedAttempts,
        accessControlMeasures: [
          'Role-based access control (RBAC)',
          'Multi-factor authentication (MFA)',
          'Session timeout and device tracking',
          'Audit logging for all PHI access',
          'Encryption at rest and in transit',
        ],
        encryptionStatus: 'AES-256-GCM encryption enabled',
        auditLoggingEnabled: true,
        trainingRequired: unauthorizedAttempts > 0,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to generate BAA report', error);
      throw error;
    }
  }

  getDataClassification(resourceType: string): string {
    return this.DATA_CLASSIFICATIONS[resourceType] || 'INTERNAL';
  }

  isPHI(fieldNames: string[]): boolean {
    return fieldNames.some((field) => this.PHI_FIELDS.has(field));
  }

  private isPHIResource(resourceType: string): boolean {
    const phiResources = ['patient', 'medical_record', 'lab_result', 'diagnosis', 'prescription'];
    return phiResources.includes(resourceType);
  }

  async getAuditTrail(
    resourceType: string,
    resourceId: string,
  ): Promise<AuditTrailEntry[]> {
    try {
      return (this.prisma as any).authAuditLog.findMany({
        where: { resourceType, resourceId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch audit trail for ${resourceType}:${resourceId}`, error);
      throw error;
    }
  }

  async encryptPHI(data: Record<string, any>): Promise<Record<string, any>> {
    const encrypted = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (this.PHI_FIELDS.has(key) && typeof value === 'string') {
        const enc = this.encryptionService.encrypt(value, 'RESTRICTED');
        encrypted[key] = {
          encrypted: enc.encrypted.toString('base64'),
          iv: enc.iv.toString('base64'),
          authTag: enc.authTag.toString('base64'),
          keyVersion: enc.keyVersion,
        };
      }
    }

    return encrypted;
  }

  async validateMinimumNecessary(
    userId: string,
    requestedFields: string[],
  ): Promise<{ allowed: boolean; blockedFields: string[] }> {
    try {
      const user = await (this.prisma as any).authUser.findUnique({
        where: { id: userId },
        select: { roleId: true },
      });

      if (!user) {
        return { allowed: false, blockedFields: requestedFields };
      }

      const rolePermissions = await (this.prisma as any).authRolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      });

      const hasFullAccess = rolePermissions.some(
        (rp: any) => rp.permission.action === 'full_access' || rp.permission.module === '*',
      );

      if (hasFullAccess) {
        return { allowed: true, blockedFields: [] };
      }

      const blockedFields: string[] = [];
      const sensitiveFields = ['nationalId', 'passwordHash', 'twoFactorSecret', 'totpSecret', 'bankAccount'];

      for (const field of requestedFields) {
        if (sensitiveFields.includes(field)) {
          blockedFields.push(field);
        }
      }

      return {
        allowed: blockedFields.length === 0,
        blockedFields,
      };
    } catch (error) {
      this.logger.error('Failed to validate minimum necessary', error);
      return { allowed: false, blockedFields: requestedFields };
    }
  }

  async generateComplianceReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<ComplianceReport> {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    try {
      const [
        totalAccesses,
        phiAccesses,
        unauthorizedAttempts,
        uniqueUsersResult,
        uniqueResourcesResult,
        accessByTypeResult,
        accessByUserResult,
      ] = await Promise.all([
        (this.prisma as any).authAuditLog.count({
          where: { createdAt: { gte: from, lte: to } },
        }),
        (this.prisma as any).authAuditLog.count({
          where: { createdAt: { gte: from, lte: to }, phiAccessed: true },
        }),
        (this.prisma as any).authAuditLog.count({
          where: {
            createdAt: { gte: from, lte: to },
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          },
        }),
        (this.prisma as any).authAuditLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: from, lte: to } },
        }),
        (this.prisma as any).authAuditLog.groupBy({
          by: ['resourceType'],
          where: { createdAt: { gte: from, lte: to } },
        }),
        (this.prisma as any).authAuditLog.groupBy({
          by: ['resourceType'],
          where: { createdAt: { gte: from, lte: to } },
          _count: { id: true },
        }),
        (this.prisma as any).authAuditLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: from, lte: to } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        }),
      ]);

      const accessByType: Record<string, number> = {};
      for (const item of accessByTypeResult) {
        accessByType[item.resourceType] = (item as any)._count?.id || 0;
      }

      const accessByUser = accessByUserResult.map((item: any) => ({
        userId: item.userId || 'unknown',
        count: item._count.id,
      }));

      const violations: Violation[] = [];
      const recommendations: string[] = [];

      if (unauthorizedAttempts > 0) {
        violations.push({
          type: 'UNAUTHORIZED_ACCESS',
          description: `${unauthorizedAttempts} unauthorized access attempts detected`,
          severity: 'HIGH',
          timestamp: new Date(),
        });
      }

      if (phiAccesses > totalAccesses * 0.8) {
        violations.push({
          type: 'EXCESSIVE_PHI_ACCESS',
          description: 'PHI access rate is unusually high',
          severity: 'MEDIUM',
          timestamp: new Date(),
        });
      }

      recommendations.push('Conduct regular access reviews for PHI-related resources.');
      recommendations.push('Ensure all PHI access is logged and audited.');
      recommendations.push('Verify that all users with PHI access have completed HIPAA training.');
      recommendations.push('Review and update access control policies quarterly.');

      return {
        period: { from: dateFrom, to: dateTo },
        totalAccesses,
        phiAccesses,
        unauthorizedAttempts,
        uniqueUsers: uniqueUsersResult.length,
        uniqueResources: uniqueResourcesResult.length,
        accessByType,
        accessByUser,
        violations,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report', error);
      throw error;
    }
  }
}
