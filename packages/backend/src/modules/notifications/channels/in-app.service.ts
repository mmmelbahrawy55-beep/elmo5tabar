import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { NotificationGateway } from '../notification.gateway';

@Injectable()
export class InAppService {
  constructor(private prisma: PrismaService, private gateway: NotificationGateway) {}

  async send(userId: string, titleAr: string, titleEn: string, bodyAr: string, bodyEn: string, type: string, extraData?: Record<string, any>): Promise<any> {
    const notification = await this.prisma.notification.create({
      data: { userId, titleAr, titleEn, bodyAr, bodyEn, type: type as any, data: extraData || {} } as any,
    });
    this.gateway.sendToUser(userId, notification);
    return notification;
  }

  async sendToMany(userIds: string[], titleAr: string, titleEn: string, bodyAr: string, bodyEn: string, type: string, metadata?: Record<string, any>): Promise<number> {
    const notifications = await Promise.all(userIds.map(uid =>
      this.prisma.notification.create({ data: { userId: uid, titleAr, titleEn, bodyAr, bodyEn, type: type as any, data: metadata || {} } as any })
    ));
    userIds.forEach(userId => this.gateway.sendToUser(userId, { type, titleAr, titleEn, bodyAr, bodyEn }));
    return notifications.length;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, read: false },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } }) as unknown as number;
  }
}

