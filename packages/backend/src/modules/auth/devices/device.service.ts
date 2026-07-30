import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

interface DeviceRegisterDto {
  name?: string;
  type: string;
  os?: string;
  browser?: string;
  fingerprint?: string;
}

interface DetectNewDeviceResult {
  isNew: boolean;
  device: any;
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: DeviceRegisterDto): Promise<any> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (dto.fingerprint) {
      const existing = await this.prisma.device.findFirst({
        where: {
          userId,
          fingerprint: dto.fingerprint,
        },
      });

      if (existing) {
        const updated = await this.prisma.device.update({
          where: { id: existing.id },
          data: {
            lastUsedAt: new Date(),
            name: dto.name ?? existing.name,
            os: dto.os ?? existing.os,
            browser: dto.browser ?? existing.browser,
          },
        });
        return updated;
      }
    }

    const device = await this.prisma.device.create({
      data: {
        userId,
        name: dto.name || 'Unknown Device',
        type: dto.type,
        os: dto.os,
        browser: dto.browser,
        fingerprint: dto.fingerprint,
      },
    });

    const deviceCount = await this.prisma.device.count({
      where: { userId },
    });

    if (deviceCount > 1) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true },
      });

      if (user?.twoFactorEnabled) {
        await this.createSecurityAlert(userId, {
          type: 'new_device',
          severity: 'WARNING',
          titleEn: 'New device login detected',
          titleAr: 'تم اكتشاف تسجيل دخول من جهاز جديد',
          descriptionEn: `A new ${dto.type} device (${dto.name || 'unnamed'}) has been registered to your account. OS: ${dto.os || 'unknown'}, Browser: ${dto.browser || 'unknown'}.`,
          descriptionAr: `تم تسجيل جهاز ${dto.type} جديد (${dto.name || 'بدون اسم'}) على حسابك. نظام التشغيل: ${dto.os || 'غير معروف'}, المتصفح: ${dto.browser || 'غير معروف'}.`,
          deviceInfo: [dto.os, dto.browser, dto.name].filter(Boolean).join(' | '),
        });
      }
    }

    this.logger.log(`Device registered: ${device.id} for user ${userId}`);
    return device;
  }

  async getDevices(userId: string): Promise<any[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });

    return devices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type,
      os: device.os,
      browser: device.browser,
      isTrusted: device.isTrusted,
      lastUsedAt: device.lastUsedAt,
    }));
  }

  async trustDevice(userId: string, deviceId: string): Promise<any> {
    const device = await this.findUserDevice(userId, deviceId);

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: { isTrusted: true },
    });

    await this.logAudit(userId, 'DEVICE_TRUSTED', {
      deviceId,
      name: device.name,
    });

    this.logger.log(`Device ${deviceId} trusted for user ${userId}`);
    return updated;
  }

  async untrustDevice(userId: string, deviceId: string): Promise<any> {
    const device = await this.findUserDevice(userId, deviceId);

    const updated = await this.prisma.device.update({
      where: { id: deviceId },
      data: { isTrusted: false },
    });

    await this.logAudit(userId, 'DEVICE_UNTRUSTED', {
      deviceId,
      name: device.name,
    });

    this.logger.log(`Device ${deviceId} untrusted for user ${userId}`);
    return updated;
  }

  async removeDevice(userId: string, deviceId: string): Promise<{ message: string }> {
    const device = await this.findUserDevice(userId, deviceId);

    await this.prisma.$transaction([
      this.prisma.session.deleteMany({
        where: { userId, isActive: true },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId, isActive: true },
      }),
      this.prisma.device.delete({
        where: { id: deviceId },
      }),
    ]);

    await this.logAudit(userId, 'DEVICE_REMOVED', {
      deviceId,
      name: device.name,
      type: device.type,
      sessionsRevoked: true,
    });

    this.logger.log(`Device ${deviceId} revoked for user ${userId}`);
    return { message: 'Device removed and all sessions revoked' };
  }

  async isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId,
        isTrusted: true,
      },
    });

    return !!device;
  }

  async updateLastSeen(deviceId: string): Promise<void> {
    try {
      await this.prisma.device.update({
        where: { id: deviceId },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to update last seen for device ${deviceId}: ${(error as Error).message}`,
      );
    }
  }

  async detectNewDevice(
    userId: string,
    fingerprint: string,
    ip: string,
    userAgent: string,
  ): Promise<DetectNewDeviceResult> {
    if (!userId || !fingerprint) {
      throw new BadRequestException('User ID and fingerprint are required');
    }

    const existingDevice = await this.prisma.device.findFirst({
      where: {
        userId,
        fingerprint,
      },
    });

    if (existingDevice) {
      await this.updateLastSeen(existingDevice.id);

      return {
        isNew: false,
        device: existingDevice,
      };
    }

    const newDevice = await this.prisma.device.create({
      data: {
        userId,
        fingerprint,
        name: this.extractDeviceName(userAgent),
        type: this.inferDeviceType(userAgent),
        os: this.extractOs(userAgent),
        browser: this.extractBrowser(userAgent),
      },
    });

    await this.createSecurityAlert(userId, {
      type: 'new_device',
      severity: 'WARNING',
      titleEn: 'New device login',
      titleAr: 'تسجيل دخول من جهاز جديد',
      descriptionEn: `A new device logged into your account from IP ${ip}. User agent: ${userAgent}.`,
      descriptionAr: `قام جهاز جديد بتسجيل الدخول إلى حسابك من IP ${ip}. وكيل المستخدم: ${userAgent}.`,
      ipAddress: ip,
      deviceInfo: userAgent,
    });

    await this.logAudit(userId, 'NEW_DEVICE_LOGIN', {
      deviceId: newDevice.id,
      fingerprint,
      ip,
      userAgent,
    });

    this.logger.warn(
      `New device detected for user ${userId}: ${newDevice.id} from IP ${ip}`,
    );

    return {
      isNew: true,
      device: newDevice,
    };
  }

  async getDeviceLoginHistory(userId: string, limit: number = 20): Promise<any[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const history = await this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        success: true,
        ipAddress: true,
        deviceType: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return history;
  }

  async getDeviceByFingerprint(fingerprint: string): Promise<any> {
    if (!fingerprint) {
      throw new BadRequestException('Fingerprint is required');
    }

    const device = await this.prisma.device.findFirst({
      where: { fingerprint },
      orderBy: { lastUsedAt: 'desc' },
    });

    return device;
  }

  private async findUserDevice(userId: string, deviceId: string): Promise<any> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  private async createSecurityAlert(
    userId: string,
    data: {
      type: string;
      severity: string;
      titleEn: string;
      titleAr: string;
      descriptionEn: string;
      descriptionAr: string;
      ipAddress?: string;
      deviceInfo?: string;
    },
  ): Promise<void> {
    try {
      const model = (this.prisma as any).securityAlert;
      if (model && typeof model.create === 'function') {
        await model.create({
          data: {
            userId,
            type: data.type,
            severity: data.severity,
            titleEn: data.titleEn,
            titleAr: data.titleAr,
            descriptionEn: data.descriptionEn,
            descriptionAr: data.descriptionAr,
            ipAddress: data.ipAddress,
            deviceInfo: data.deviceInfo,
            actionRequired: data.severity === 'CRITICAL',
          },
        });
      }

      this.logger.warn(
        `Security alert created for user ${userId}: ${data.type} (${data.severity})`,
      );
    } catch (error) {
      this.logger.error(`Failed to create security alert: ${(error as Error).message}`);
    }
  }

  private async logAudit(
    userId: string,
    action: string,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          entity: 'device',
          newValues: details,
          severity: 'info',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log audit: ${(error as Error).message}`);
    }
  }

  private extractDeviceName(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      if (/iphone/i.test(userAgent)) return 'iPhone';
      if (/ipad/i.test(userAgent)) return 'iPad';
      if (/android/i.test(userAgent)) return 'Android Device';
      return 'Mobile Device';
    }

    if (/windows/i.test(userAgent)) return 'Windows PC';
    if (/macintosh|mac os/i.test(userAgent)) return 'Mac';
    if (/linux/i.test(userAgent)) return 'Linux PC';
    return 'Desktop';
  }

  private inferDeviceType(userAgent: string): string {
    if (!userAgent) return 'desktop';

    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    if (/ipad|tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private extractOs(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    if (/windows nt 10/i.test(userAgent)) return 'Windows 10';
    if (/windows nt 11/i.test(userAgent)) return 'Windows 11';
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac os x ([\d_]+)/i.test(userAgent)) {
      const version = userAgent.match(/mac os x ([\d_]+)/i)?.[1]?.replace(/_/g, '.');
      return `macOS ${version || ''}`.trim();
    }
    if (/android ([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/android ([\d.]+)/i)?.[1];
      return `Android ${version || ''}`.trim();
    }
    if (/iphone os ([\d_]+)/i.test(userAgent)) {
      const version = userAgent.match(/iphone os ([\d_]+)/i)?.[1]?.replace(/_/g, '.');
      return `iOS ${version || ''}`.trim();
    }
    if (/linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  private extractBrowser(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    if (/edg\/([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/edg\/([\d.]+)/i)?.[1];
      return `Edge ${version || ''}`.trim();
    }
    if (/chrome\/([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/chrome\/([\d.]+)/i)?.[1];
      return `Chrome ${version || ''}`.trim();
    }
    if (/firefox\/([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/firefox\/([\d.]+)/i)?.[1];
      return `Firefox ${version || ''}`.trim();
    }
    if (/safari\/([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/safari\/([\d.]+)/i)?.[1];
      return `Safari ${version || ''}`.trim();
    }
    return 'Unknown';
  }
}
