import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export enum QueueEvent {
  TICKET_CREATED = 'ticketCreated',
  TICKET_CALLED = 'ticketCalled',
  TICKET_SERVING = 'ticketServing',
  TICKET_COMPLETED = 'ticketCompleted',
  TICKET_CANCELLED = 'ticketCancelled',
  QUEUE_UPDATED = 'queueUpdated',
  SERVICE_POINT_UPDATED = 'servicePointUpdated',
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/queue',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Queue client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Queue client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBranchRoom')
  handleJoinBranchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() branchId: string,
  ): void {
    const room = `branch:${branchId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined branch room ${branchId}`);
    client.emit('joinedBranchRoom', { branchId, room });
  }

  @SubscribeMessage('leaveBranchRoom')
  handleLeaveBranchRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() branchId: string,
  ): void {
    const room = `branch:${branchId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left branch room ${branchId}`);
  }

  broadcastToBranch(branchId: string, event: QueueEvent, data: unknown): void {
    const room = `branch:${branchId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasting ${event} to room ${room}`);
  }

  broadcastToDisplay(branchId: string, data: unknown): void {
    const room = `display:${branchId}`;
    this.server.to(room).emit(QueueEvent.QUEUE_UPDATED, data);
    this.logger.debug(`Broadcasting queue update to display room ${branchId}`);
  }

  broadcastQueueUpdate(branchId: string, data: unknown): void {
    this.broadcastToBranch(branchId, QueueEvent.QUEUE_UPDATED, data);
    this.broadcastToDisplay(branchId, data);
  }

  broadcastToAll(event: QueueEvent, data: unknown): void {
    this.server.emit(event, data);
  }

  joinDisplayRoom(client: Socket, branchId: string): void {
    const room = `display:${branchId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined display room ${branchId}`);
  }

  @SubscribeMessage('joinDisplayRoom')
  handleJoinDisplayRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() branchId: string,
  ): void {
    this.joinDisplayRoom(client, branchId);
    client.emit('joinedDisplayRoom', { branchId });
  }
}
