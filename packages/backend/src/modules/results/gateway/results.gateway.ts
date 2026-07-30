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
import { PrismaService } from '../../../lib/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/results',
})
@Injectable()
export class ResultsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ResultsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly doctorSockets = new Map<string, Set<string>>();

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
      const role = payload.role;

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
        this.logger.warn(`Client ${client.id} rejected: inactive user`);
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

      if (user.role === 'DOCTOR') {
        const doctorRoom = `doctor_${userId}`;
        client.join(doctorRoom);

        if (!this.doctorSockets.has(userId)) {
          this.doctorSockets.set(userId, new Set());
        }
        this.doctorSockets.get(userId)!.add(client.id);
      }

      if (user.role === 'PATIENT') {
        const patientRecord = await (this.prisma as any).patient?.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (patientRecord) {
          const patientRoom = `patient_${patientRecord.id}`;
          client.join(patientRoom);
        }
      }

      if (['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role)) {
        client.join('results_staff');
      }

      this.logger.log(
        `Client ${client.id} connected as user ${userId} (${user.role}) to /results`,
      );
    } catch (error) {
      this.logger.warn(`Client ${client.id} rejected: auth failed - ${error.message}`);
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

    if (userId && this.doctorSockets.has(userId)) {
      this.doctorSockets.get(userId)!.delete(client.id);
      if (this.doctorSockets.get(userId)!.size === 0) {
        this.doctorSockets.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected from /results`);
  }

  notifyNewResult(report: any): void {
    try {
      if (report.patientId) {
        this.server.to(`patient_${report.patientId}`).emit('newResult', {
          reportId: report.id,
          reportNumber: report.reportNumber,
          status: report.status,
          createdAt: report.createdAt,
          summary: report.summary,
        });
      }

      this.server.to('results_staff').emit('newResult', {
        reportId: report.id,
        reportNumber: report.reportNumber,
        patientId: report.patientId,
        status: report.status,
        createdAt: report.createdAt,
      });

      this.logger.log(`Emitted newResult for report ${report.reportNumber}`);
    } catch (error) {
      this.logger.error(`notifyNewResult failed: ${error.message}`, error.stack);
    }
  }

  notifyResultUpdate(report: any): void {
    try {
      if (report.patientId) {
        this.server.to(`patient_${report.patientId}`).emit('resultUpdate', {
          reportId: report.id,
          reportNumber: report.reportNumber,
          status: report.status,
          updatedAt: report.updatedAt,
        });
      }

      this.server.to('results_staff').emit('resultUpdate', {
        reportId: report.id,
        reportNumber: report.reportNumber,
        patientId: report.patientId,
        status: report.status,
        updatedAt: report.updatedAt,
      });

      this.logger.log(`Emitted resultUpdate for report ${report.reportNumber}`);
    } catch (error) {
      this.logger.error(`notifyResultUpdate failed: ${error.message}`, error.stack);
    }
  }

  notifyCriticalAlert(alert: {
    reportId: string;
    patientId: string;
    testName: string;
    value: string;
    severity: string;
    message: string;
  }): void {
    try {
      this.server.to(`patient_${alert.patientId}`).emit('criticalAlert', {
        reportId: alert.reportId,
        testName: alert.testName,
        value: alert.value,
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date().toISOString(),
      });

      this.server.to('results_staff').emit('criticalAlert', {
        reportId: alert.reportId,
        patientId: alert.patientId,
        testName: alert.testName,
        value: alert.value,
        severity: alert.severity,
        message: alert.message,
        timestamp: new Date().toISOString(),
      });

      for (const [, sockets] of this.doctorSockets) {
        for (const socketId of sockets) {
          this.server.to(socketId).emit('criticalAlert', {
            reportId: alert.reportId,
            patientId: alert.patientId,
            testName: alert.testName,
            value: alert.value,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      this.logger.log(`Emitted criticalAlert for report ${alert.reportId}`);
    } catch (error) {
      this.logger.error(`notifyCriticalAlert failed: ${error.message}`, error.stack);
    }
  }

  notifyStatusChange(reportId: string, oldStatus: string, newStatus: string): void {
    try {
      const payload = {
        reportId,
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      };

      this.server.to('results_staff').emit('statusChange', payload);
      this.server.emit('statusChange', payload);

      this.logger.log(`Status change: ${reportId} ${oldStatus} -> ${newStatus}`);
    } catch (error) {
      this.logger.error(`notifyStatusChange failed: ${error.message}`, error.stack);
    }
  }

  broadcastToDoctors(event: string, data: Record<string, unknown>): void {
    try {
      const doctorIds = Array.from(this.doctorSockets.keys());
      for (const doctorId of doctorIds) {
        this.server.to(`doctor_${doctorId}`).emit(event, data);
      }
      this.logger.debug(`Broadcast ${event} to ${doctorIds.length} doctors`);
    } catch (error) {
      this.logger.error(`broadcastToDoctors failed: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('subscribePatient')
  handleSubscribePatient(client: Socket, patientId: string): void {
    if (typeof patientId !== 'string') {
      client.emit('error', { message: 'Invalid patientId' });
      return;
    }
    const room = `patient_${patientId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('subscribeReport')
  handleSubscribeReport(client: Socket, reportId: string): void {
    if (typeof reportId !== 'string') {
      client.emit('error', { message: 'Invalid reportId' });
      return;
    }
    const room = `report_${reportId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    client.emit('subscribed', { room });
  }

  @SubscribeMessage('markViewed')
  async handleMarkViewed(
    client: Socket,
    data: { reportId: string },
  ): Promise<void> {
    try {
      const userId = client.data.userId;
      if (!userId || !data?.reportId) {
        client.emit('error', { message: 'Invalid data' });
        return;
      }

      await this.prisma.report.update({
        where: { id: data.reportId },
        data: { viewCount: { increment: 1 } },
      });

      this.logger.log(`Report ${data.reportId} viewed by user ${userId}`);
      client.emit('viewed', { reportId: data.reportId });
    } catch (error) {
      this.logger.error(`markViewed error: ${error.message}`);
      client.emit('error', { message: 'Failed to mark as viewed' });
    }
  }

  getConnectedUsersCount(): { total: number; doctors: number; patients: number } {
    const total = this.server?.engine?.clientsCount ?? 0;
    return {
      total,
      doctors: this.doctorSockets.size,
      patients: this.userSockets.size - this.doctorSockets.size,
    };
  }

  getActiveDoctorIds(): string[] {
    return Array.from(this.doctorSockets.keys());
  }
}
