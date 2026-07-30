import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { NotificationPreferenceService } from './preference.service';

@Injectable()
export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);

  private readonly channelPriority: Record<string, number> = {
    SMS: 1,
    WHATSAPP: 2,
    EMAIL: 3,
    PUSH: 4,
    VOICE: 5,
    IN_APP: 6,
  };

  private readonly channelFallbackChain: Record<string, string[]> = {
    SMS: ['WHATSAPP', 'EMAIL', 'IN_APP'],
    WHATSAPP: ['SMS', 'EMAIL', 'IN_APP'],
    EMAIL: ['SMS', 'WHATSAPP', 'IN_APP'],
    PUSH: ['EMAIL', 'IN_APP'],
    VOICE: ['SMS', 'WHATSAPP', 'IN_APP'],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  async route(notification: {
    userId: string;
    type: string;
    priority: string;
    data: Record<string, any>;
    notification: any;
  }): Promise<string[]> {
    try {
      const userChannels = await this.resolveUserChannels(notification.userId, notification.type);
      if (userChannels.length === 0) {
        this.logger.warn(`No channels available for user ${notification.userId}, type ${notification.type}`);
        return ['IN_APP'];
      }

      const channels: string[] = [];
      for (const ch of userChannels) {
        const canSend = await this.canSendViaChannel(notification.userId, ch, notification.type);
        if (canSend) {
          channels.push(ch);
        } else {
          const fallback = await this.fallbackChannel(ch, notification);
          if (fallback) channels.push(fallback);
        }
      }

      if (channels.length === 0) {
        this.logger.warn(`No channels passed availability check, defaulting to IN_APP`);
        return ['IN_APP'];
      }

      if (notification.priority === 'URGENT') {
        return channels.sort((a, b) => (this.channelPriority[a] || 99) - (this.channelPriority[b] || 99));
      }

      if (notification.priority === 'HIGH') {
        return channels;
      }

      return channels.filter((c) => c !== 'VOICE');
    } catch (error) {
      this.logger.error(`Route error for user ${notification.userId}: ${error.message}`);
      return ['IN_APP'];
    }
  }

  async resolveUserChannels(userId: string, type: string): Promise<string[]> {
    try {
      const preferences = await this.preferenceService.getPreferences(userId);
      const typePrefs = preferences.filter((p: any) => p.type === type && p.enabled);

      if (typePrefs.length > 0) {
        return typePrefs.map((p: any) => p.channel);
      }

      const defaultChannels = ['IN_APP', 'EMAIL'];
      const activeChannels: string[] = [];

      for (const ch of defaultChannels) {
        const allowed = await this.checkQuietHours(userId, ch);
        if (allowed) activeChannels.push(ch);
      }

      return activeChannels.length > 0 ? activeChannels : ['IN_APP'];
    } catch (error) {
      this.logger.error(`Error resolving channels for user ${userId}: ${error.message}`);
      return ['IN_APP'];
    }
  }

  async fallbackChannel(failedChannel: string, notification: { userId: string; type: string; data: Record<string, any> }): Promise<string | null> {
    const chain = this.channelFallbackChain[failedChannel] || ['IN_APP'];
    for (const fallback of chain) {
      const canSend = await this.canSendViaChannel(notification.userId, fallback, notification.type);
      if (canSend) {
        this.logger.log(`Fallback ${failedChannel} -> ${fallback} for user ${notification.userId}`);
        return fallback;
      }
    }
    return null;
  }

  async canSendViaChannel(userId: string, channel: string, type: string): Promise<boolean> {
    try {
      const inQuietHours = await this.checkQuietHours(userId, channel);
      if (!inQuietHours) return false;

      const withinDailyCap = await this.checkDailyCap(userId, channel);
      if (!withinDailyCap) return false;

      const withinRateLimit = await this.checkRateLimit(channel);
      if (!withinRateLimit) return false;

      return true;
    } catch (error) {
      this.logger.error(`canSendViaChannel error: ${error.message}`);
      return true;
    }
  }

  private async checkQuietHours(userId: string, channel: string): Promise<boolean> {
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const prefs = await this.preferenceService.getPreferences(userId);
      const channelPref = prefs.find((p: any) => p.channel === channel);

      if (channelPref?.quietHoursStart && channelPref?.quietHoursEnd) {
        const [startH, startM] = channelPref.quietHoursStart.split(':').map(Number);
        const [endH, endM] = channelPref.quietHoursEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (startMinutes <= endMinutes) {
          if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return false;
        } else {
          if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) return false;
        }
      }

      return true;
    } catch {
      return true;
    }
  }

  private async checkDailyCap(userId: string, channel: string): Promise<boolean> {
    try {
      const prefs = await this.preferenceService.getPreferences(userId);
      const channelPref = prefs.find((p: any) => p.channel === channel);
      if (!channelPref?.maxPerDay) return true;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

    let count = 0;
      if (channel === 'SMS') {
        count = await (this.prisma as any).smsLog.count({ where: { createdAt: { gte: todayStart } } });
      } else if (channel === 'EMAIL') {
        count = await (this.prisma as any).emailLog.count({ where: { createdAt: { gte: todayStart } } });
      } else if (channel === 'WHATSAPP') {
        count = await (this.prisma as any).whatsAppLog.count({ where: { createdAt: { gte: todayStart } } });
      }

      return count < channelPref.maxPerDay;
    } catch {
      return true;
    }
  }

  private async checkRateLimit(channel: string): Promise<boolean> {
    try {
      const configDb = (this.prisma as any).channelConfig;
      let config: any = null;
      try {
        config = await configDb.findUnique({ where: { channel } });
      } catch {
        const allConfigs = await configDb.findMany({ where: { channel } });
        config = allConfigs?.[0];
      }

      if (!config?.rateLimitPerMinute) return true;

      const oneMinuteAgo = new Date(Date.now() - 60000);

      let recentCount = 0;
      if (channel === 'SMS') {
        recentCount = await this.prisma.smsLog.count({ where: { sentAt: { gte: oneMinuteAgo } } });
      } else if (channel === 'EMAIL') {
        recentCount = await this.prisma.emailLog.count({ where: { sentAt: { gte: oneMinuteAgo } } });
      } else if (channel === 'WHATSAPP') {
        recentCount = await this.prisma.whatsAppLog.count({ where: { sentAt: { gte: oneMinuteAgo } } });
      }

      return recentCount < config.rateLimitPerMinute;
    } catch {
      return true;
    }
  }
}

