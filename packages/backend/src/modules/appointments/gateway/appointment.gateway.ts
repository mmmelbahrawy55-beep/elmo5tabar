import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export enum AppointmentEvent {
  CREATED = 'appointmentCreated',
  UPDATED = 'appointmentUpdated',
  CANCELLED = 'appointmentCancelled',
  CHECKED_IN = 'appointmentCheckedIn',
  COMPLETED = 'appointmentCompleted',
  RESCHEDULED = 'appointmentRescheduled',
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/appointments',
})
export class AppointmentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppointmentGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastToBranch(branchId: string, event: AppointmentEvent, data: unknown): void {
    const room = `branch:${branchId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasting ${event} to room ${room}`);
  }

  broadcastToPatient(patientId: string, event: AppointmentEvent, data: unknown): void {
    const room = `patient:${patientId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasting ${event} to patient room ${patientId}`);
  }

  broadcastToDoctor(doctorId: string, event: AppointmentEvent, data: unknown): void {
    const room = `doctor:${doctorId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Broadcasting ${event} to doctor room ${doctorId}`);
  }

  broadcastToAll(event: AppointmentEvent, data: unknown): void {
    this.server.emit(event, data);
  }

  joinBranchRoom(client: Socket, branchId: string): void {
    const room = `branch:${branchId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined branch room ${branchId}`);
  }

  joinPatientRoom(client: Socket, patientId: string): void {
    const room = `patient:${patientId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined patient room ${patientId}`);
  }

  joinDoctorRoom(client: Socket, doctorId: string): void {
    const room = `doctor:${doctorId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined doctor room ${doctorId}`);
  }

  handleJoinBranchRoom(client: Socket, branchId: string): void {
    this.joinBranchRoom(client, branchId);
  }

  handleJoinPatientRoom(client: Socket, patientId: string): void {
    this.joinPatientRoom(client, patientId);
  }

  handleJoinDoctorRoom(client: Socket, doctorId: string): void {
    this.joinDoctorRoom(client, doctorId);
  }
}
