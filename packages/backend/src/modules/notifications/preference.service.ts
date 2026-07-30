import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class NotificationPreferenceService {
  private readonly logger = new Logger(NotificationPreferenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<any[]> {
    try {
      const prefDb = (this.prisma as any).notificationPreference;
      const preferences = await prefDb.findMany({ where: { userId } });

      if (preferences.length === 0) {
        return this.getDefaultPreferences(userId);
      }

      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences for ${userId}: ${error.message}`);
      return this.getDefaultPreferences(userId);
    }
  }

  async updatePreference(userId: string, channel: string, type: string, enabled: boolean): Promise<any> {
    try {
      const prefDb = (this.prisma as any).notificationPreference;

      const existing = await prefDb.findFirst({
        where: { userId, channel, type },
      });

      if (existing) {
        return prefDb.update({
          where: { id: existing.id },
          data: { enabled, updatedAt: new Date() },
        });
      }

      return prefDb.create({
        data: { userId, channel, type, enabled },
      });
    } catch (error) {
      this.logger.error(`Failed to update preference for ${userId}/${channel}/${type}: ${error.message}`);
      throw error;
    }
  }

  async updateBulkPreferences(userId: string, preferences: { channel: string; type: string; enabled: boolean }[]): Promise<any[]> {
    const results: any[] = [];
    for (const pref of preferences) {
      try {
        const result = await this.updatePreference(userId, pref.channel, pref.type, pref.enabled);
        results.push(result);
      } catch (error) {
        this.logger.error(`Bulk update failed for ${userId}/${pref.channel}/${pref.type}: ${error.message}`);
        results.push({ channel: pref.channel, type: pref.type, error: error.message });
      }
    }
    return results;
  }

  async getDefaultPreferences(userId: string): Promise<any[]> {
    const defaultChannels = ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];
    const defaultTypes = [
      'ORDER_CONFIRMED', 'RESULTS_READY', 'APPOINTMENT_REMINDER',
      'PAYMENT_RECEIVED', 'INSURANCE_EXPIRY', 'BIRTHDAY', 'SECURITY_ALERT',
    ];

    const defaults: any[] = [];
    for (const channel of defaultChannels) {
      for (const type of defaultTypes) {
        defaults.push({
          userId,
          channel,
          type,
          enabled: channel === 'IN_APP' || channel === 'EMAIL',
          maxPerDay: channel === 'SMS' ? 10 : channel === 'WHATSAPP' ? 10 : 100,
          quietHoursStart: null,
          quietHoursEnd: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return defaults;
  }

  async setQuietHours(userId: string, channel: string, start: string, end: string): Promise<any> {
    try {
      const prefDb = (this.prisma as any).notificationPreference;

      const existing = await prefDb.findFirst({
        where: { userId, channel },
      });

      if (existing) {
        return prefDb.update({
          where: { id: existing.id },
          data: { quietHoursStart: start, quietHoursEnd: end, updatedAt: new Date() },
        });
      }

      return prefDb.create({
        data: {
          userId,
          channel,
          type: 'ALL',
          enabled: true,
          quietHoursStart: start,
          quietHoursEnd: end,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to set quiet hours for ${userId}/${channel}: ${error.message}`);
      throw error;
    }
  }

  async setMaxPerDay(userId: string, channel: string, max: number): Promise<any> {
    try {
      const prefDb = (this.prisma as any).notificationPreference;

      const existing = await prefDb.findFirst({
        where: { userId, channel },
      });

      if (existing) {
        return prefDb.update({
          where: { id: existing.id },
          data: { maxPerDay: max, updatedAt: new Date() },
        });
      }

      return prefDb.create({
        data: { userId, channel, type: 'ALL', enabled: true, maxPerDay: max },
      });
    } catch (error) {
      this.logger.error(`Failed to set max per day for ${userId}/${channel}: ${error.message}`);
      throw error;
    }
  }

  async getOptimalChannels(userId: string, type: string): Promise<string[]> {
    try {
      const preferences = await this.getPreferences(userId);
      const typePrefs = preferences.filter((p: any) => p.type === type && p.enabled);

      if (typePrefs.length > 0) {
        return typePrefs
          .filter((p: any) => {
            if (p.maxPerDay) {
              return true;
            }
            return true;
          })
          .map((p: any) => p.channel);
      }

      const smsLogs = await (this.prisma as any).smsLog.count({ where: { recipientNumber: { not: null } } });
      const emailLogs = await (this.prisma as any).emailLog.count({ where: { recipientEmail: { not: null } } });
      const whatsappLogs = await (this.prisma as any).whatsAppLog.count({ where: { recipientNumber: { not: null } } });

      const channels: { name: string; count: number }[] = [];
      if (smsLogs > 0) channels.push({ name: 'SMS', count: smsLogs });
      if (emailLogs > 0) channels.push({ name: 'EMAIL', count: emailLogs });
      if (whatsappLogs > 0) channels.push({ name: 'WHATSAPP', count: whatsappLogs });

      channels.sort((a, b) => b.count - a.count);

      const result = ['IN_APP', ...channels.map((c) => c.name)];
      return result.slice(0, 3);
    } catch (error) {
      this.logger.error(`Failed to get optimal channels for ${userId}: ${error.message}`);
      return ['IN_APP', 'EMAIL'];
    }
  }

  async getSubscribedTypes(userId: string): Promise<string[]> {
    try {
      const preferences = await this.getPreferences(userId);
      const subscribed = preferences
        .filter((p: any) => p.enabled)
        .map((p: any) => p.type);

      return [...new Set<string>(subscribed)];
    } catch (error) {
      this.logger.error(`Failed to get subscribed types for ${userId}: ${error.message}`);
      return [];
    }
  }
}

