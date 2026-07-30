import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface ShareLinkPayload {
  reportIds: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  maxAccess: number;
}

interface ShareLinkAccess {
  id: string;
  ipAddress: string;
  userAgent: string;
  accessedAt: Date;
}

interface LinkAnalytics {
  linkId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  totalAccess: number;
  uniqueIPs: number;
  recentAccesses: ShareLinkAccess[];
  reportIds: string[];
}

@Injectable()
export class ShareLinkService {
  private readonly logger = new Logger(ShareLinkService.name);
  private readonly tokenLength = 48;
  private readonly defaultExpiryHours = 24;
  private readonly maxExpiryHours = 720;
  private readonly encryptionAlgorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;
  private readonly ivLength = 16;
  private readonly maxAccessPerHour = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('SHARE_LINK_ENCRYPTION_KEY') || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = crypto.scryptSync(key, 'share-link-salt', 32);
  }

  async createShareLink(
    reportIds: string[],
    expiresInHours: number = this.defaultExpiryHours,
    createdBy: string,
    password?: string,
    maxAccess?: number,
  ): Promise<any> {
    if (!reportIds || reportIds.length === 0) {
      throw new BadRequestException('At least one report ID is required');
    }

    const validExpiry = Math.min(Math.max(1, expiresInHours), this.maxExpiryHours);
    const expiresAt = new Date(Date.now() + validExpiry * 60 * 60 * 1000);

    const reports = await this.prisma.report.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, reportNumber: true, patientId: true, status: true },
    });

    if (reports.length === 0) {
      throw new NotFoundException('No valid reports found');
    }

    const foundIds = new Set(reports.map((r) => r.id));
    const missingIds = reportIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      this.logger.warn(`Some report IDs not found: ${missingIds.join(', ')}`);
    }

    const token = await this.generateSecureToken();
    const maxAccessCount = maxAccess ?? 0;

    const payload: ShareLinkPayload = {
      reportIds: Array.from(foundIds),
      createdBy,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      maxAccess: maxAccessCount,
    };

    let encryptedPayload: string | null = null;
    if (password) {
      encryptedPayload = this.encryptPayload(payload, password);
    }

    const shareLink = await (this.prisma as any).shareLink.create({
      data: {
        token,
        reportIds: Array.from(foundIds),
        createdBy,
        createdAt: new Date(),
        expiresAt,
        isActive: true,
        maxAccess: maxAccessCount,
        accessCount: 0,
        hasPassword: !!password,
        encryptedPayload,
      },
    });

    this.logger.log(`Share link created: ${shareLink.id} (${validExpiry}h, ${reportIds.length} reports)`);
    return shareLink;
  }

  async getSharedReport(token: string, password?: string): Promise<any> {
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      throw new UnauthorizedException(validation.message);
    }

    const shareLink = validation.shareLink!;
    const payload = shareLink.encryptedPayload
      ? this.decryptPayload(shareLink.encryptedPayload, password || '')
      : null;

    let reportIds: string[];
    if (payload) {
      reportIds = payload.reportIds;
    } else if (Array.isArray(shareLink.reportIds)) {
      reportIds = shareLink.reportIds;
    } else {
      try {
        reportIds = typeof shareLink.reportIds === 'string'
          ? JSON.parse(shareLink.reportIds)
          : shareLink.reportIds;
      } catch {
        reportIds = shareLink.reportIds;
      }
    }

    const reports = await this.prisma.report.findMany({
      where: { id: { in: reportIds } },
      include: {
        patient: {
          select: {
            id: true,
            firstNameAr: true,
            lastNameAr: true,
            firstNameEn: true,
            lastNameEn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            labTest: {
              select: { id: true, nameAr: true, nameEn: true, units: true, referenceRange: true },
            },
          },
        },
      },
    });

    const sensitiveFields = reports.map((r) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      status: r.status,
      createdAt: r.createdAt,
      releasedAt: r.releasedAt,
      summary: r.summary,
      conclusions: r.conclusions,
      version: r.version,
      patient: r.patient
        ? {
            id: r.patient.id,
            name: r.patient.firstNameEn || r.patient.firstNameAr,
            dateOfBirth: r.patient.dateOfBirth,
            gender: r.patient.gender,
          }
        : null,
      items: r.items.map((item) => ({
        id: item.id,
        testName: item.labTest?.nameEn || item.labTest?.nameAr,
        value: item.value,
        numericValue: item.numericValue,
        unit: item.unit || item.labTest?.units,
        referenceRange: item.labTest?.referenceRange,
        referenceRangeLow: item.referenceRangeLow,
        referenceRangeHigh: item.referenceRangeHigh,
        isAbnormal: item.isAbnormal,
        flags: item.flags,
        methodology: item.methodology,
      })),
    }));

    return {
      reports: sensitiveFields,
      sharedAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
      accessCount: shareLink.accessCount,
    };
  }

  async revokeShareLink(linkId: string, userId: string): Promise<void> {
    const link = await (this.prisma as any).shareLink.findUnique({ where: { id: linkId } });
    if (!link) {
      throw new NotFoundException(`Share link with ID ${linkId} not found`);
    }

    if (link.createdBy !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new UnauthorizedException('You can only revoke your own share links');
      }
    }

    if (!link.isActive) {
      throw new BadRequestException('Share link is already revoked');
    }

    await (this.prisma as any).shareLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    this.logger.log(`Share link ${linkId} revoked by user ${userId}`);
  }

  async getActiveLinks(userId: string): Promise<any[]> {
    const links = await (this.prisma as any).shareLink.findMany({
      where: {
        createdBy: userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((link: any) => ({
      id: link.id,
      token: link.token,
      reportIds: link.reportIds,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      maxAccess: link.maxAccess,
      accessCount: link.accessCount,
      hasPassword: link.hasPassword,
      isExpired: new Date() > new Date(link.expiresAt),
    }));
  }

  async accessSharedLink(token: string, ipAddress: string, userAgent: string): Promise<any> {
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      throw new UnauthorizedException(validation.message);
    }

    const shareLink = validation.shareLink!;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentAccesses = await (this.prisma as any).shareLinkAccess.count({
      where: {
        shareLinkId: shareLink.id,
        accessedAt: { gte: oneHourAgo },
      },
    });

    if (recentAccesses >= this.maxAccessPerHour) {
      throw new BadRequestException('Rate limit exceeded. Too many accesses to this link.');
    }

    await (this.prisma as any).shareLink.update({
      where: { id: shareLink.id },
      data: { accessCount: { increment: 1 } },
    });

    await (this.prisma as any).shareLinkAccess.create({
      data: {
        shareLinkId: shareLink.id,
        ipAddress,
        userAgent: userAgent || '',
        accessedAt: now,
      },
    });

    this.logger.log(`Share link ${shareLink.id} accessed from ${ipAddress}`);

    return this.getSharedReport(token);
  }

  async getLinkAnalytics(linkId: string): Promise<LinkAnalytics> {
    const link = await (this.prisma as any).shareLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException(`Share link with ID ${linkId} not found`);
    }

    const accesses = await (this.prisma as any).shareLinkAccess.findMany({
      where: { shareLinkId: linkId },
      orderBy: { accessedAt: 'desc' },
      take: 100,
    });

    const uniqueIPs = new Set(accesses.map((a: any) => a.ipAddress));

    return {
      linkId: link.id,
      token: link.token,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      isActive: link.isActive,
      totalAccess: link.accessCount,
      uniqueIPs: uniqueIPs.size,
      recentAccesses: accesses.map((a: any) => ({
        id: a.id,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        accessedAt: a.accessedAt,
      })),
      reportIds: link.reportIds,
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean; message: string; shareLink?: any }> {
    if (!token || token.length < 10) {
      return { valid: false, message: 'Invalid token format' };
    }

    const shareLink = await (this.prisma as any).shareLink.findUnique({ where: { token } });

    if (!shareLink) {
      return { valid: false, message: 'Share link not found' };
    }

    if (!shareLink.isActive) {
      return { valid: false, message: 'Share link has been revoked' };
    }

    const now = new Date();
    if (now > new Date(shareLink.expiresAt)) {
      return { valid: false, message: 'Share link has expired' };
    }

    if (shareLink.maxAccess > 0 && shareLink.accessCount >= shareLink.maxAccess) {
      return { valid: false, message: 'Share link has reached maximum access limit' };
    }

    return { valid: true, message: 'Token is valid', shareLink };
  }

  async generateSecureToken(): Promise<string> {
    const bytes = crypto.randomBytes(this.tokenLength);
    const token = bytes.toString('base64url');
    return token;
  }

  encryptPayload(payload: ShareLinkPayload, password: string): string {
    const key = crypto.scryptSync(password, 'share-encryption', 32);
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);

    const json = JSON.stringify(payload);
    let encrypted = cipher.update(json, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const combined = iv.toString('hex') + ':' + encrypted;
    return combined;
  }

  decryptPayload(encrypted: string, password: string): ShareLinkPayload {
    try {
      const parts = encrypted.split(':');
      if (parts.length < 2) {
        throw new BadRequestException('Invalid encrypted payload format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts.slice(1).join(':');
      const key = crypto.scryptSync(password, 'share-encryption', 32);

      const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Payload decryption failed', error);
      throw new UnauthorizedException('Invalid password or corrupted data');
    }
  }
}
