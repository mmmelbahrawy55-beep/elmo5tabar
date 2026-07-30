import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../lib/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn(`Client ${client.id} rejected: invalid payload`);
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        this.logger.warn(`Client ${client.id} rejected: inactive`);
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.role = user.role;

      const userRoom = `user_${userId}`;
      client.join(userRoom);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        client.join('admins');
      }
      if (['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role)) {
        client.join('staff');
      }

      this.logger.log(`Client ${client.id} connected as user ${userId} (${user.role})`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} rejected: auth failed - ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  sendToUser(userId: string, notification: Record<string, unknown>): void {
    this.server.to(`user_${userId}`).emit('notificationReceived', notification);
  }

  broadcastToRole(role: string, notification: Record<string, unknown>): void {
    const roomMap: Record<string, string> = {
      ADMIN: 'admins',
      SUPER_ADMIN: 'admins',
      BRANCH_MANAGER: 'staff',
      STAFF: 'staff',
    };
    const room = roomMap[role] || role.toLowerCase();
    this.server.to(room).emit('notificationReceived', notification);
  }

  broadcastToAdmins(event: string, data: Record<string, unknown>): void {
    this.server.to('admins').emit(event, data);
  }

  broadcastToStaff(event: string, data: Record<string, unknown>): void {
    this.server.to('staff').emit(event, data);
  }

  broadcastToAll(event: string, data: Record<string, unknown>): void {
    this.server.emit(event, data);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, notificationId: string): Promise<void> {
    try {
      const userId = client.data.userId;
      if (!userId) return;

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { read: true, readAt: new Date() },
      });

      this.sendToUser(userId, { id: notificationId, read: true } as unknown as Record<string, unknown>);
    } catch (error) {
      this.logger.error(`markAsRead error: ${error.message}`);
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, room: string): void {
    if (typeof room !== 'string') return;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, room: string): void {
    if (typeof room !== 'string') return;
    client.leave(room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
  }

  joinRoom(client: Socket, room: string): void {
    client.join(room);
  }

  leaveRoom(client: Socket, room: string): void {
    client.leave(room);
  }
}

