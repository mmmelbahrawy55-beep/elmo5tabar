import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QueueGateway, QueueEvent } from '../gateway/queue.gateway';
import { CreateTicketDto, TicketPriority, ServiceType } from '../dto/create-ticket.dto';
import { Prisma } from '@prisma/client';

export enum TicketStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  SERVING = 'SERVING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  TRANSFERRED = 'TRANSFERRED',
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  private readonly PRIORITY_ORDER: Record<string, number> = {
    EMERGENCY: 0,
    VIP: 1,
    PRIORITY: 2,
    NORMAL: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly gateway: QueueGateway,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    const ticketNumber = await this.generateTicketNumber(dto.branchId, dto.serviceType);

    const ticket = await this.prisma.queueEntry.create({
      data: {
        branchId: dto.branchId,
        patientId: dto.patientId,
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        patientNationalId: (dto as any).patientNationalId,
        serviceType: dto.serviceType,
        priority: dto.priority ?? TicketPriority.NORMAL,
        notes: dto.notes,
        ticketNumber,
        status: TicketStatus.WAITING,
        createdBy: dto.patientId,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(dto.branchId, QueueEvent.TICKET_CREATED, ticket);
    this.gateway.broadcastQueueUpdate(dto.branchId, await this.getQueueStatus(dto.branchId));

    this.logger.log(`Ticket created: ${ticketNumber} for branch ${dto.branchId}`);
    return ticket;
  }

  async callNext(servicePointId: string) {
    const servicePoint = await this.prisma.queueServicePoint.findUnique({
      where: { id: servicePointId },
      include: { branch: true },
    });

    if (!servicePoint) {
      throw new NotFoundException(`Service point with ID ${servicePointId} not found`);
    }

    const nextTicket = await this.prisma.queueEntry.findFirst({
      where: {
        branchId: servicePoint.branchId,
        status: TicketStatus.WAITING,
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!nextTicket) {
      throw new BadRequestException('No tickets waiting in queue');
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: nextTicket.id },
      data: {
        status: TicketStatus.CALLED,
        calledAt: new Date(),
        servicePoint: servicePoint.name,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(servicePoint.branchId, QueueEvent.TICKET_CALLED, updated);
    this.gateway.broadcastQueueUpdate(servicePoint.branchId, await this.getQueueStatus(servicePoint.branchId));

    this.logger.log(`Ticket called: ${nextTicket.ticketNumber} at service point ${servicePoint.name}`);
    return updated;
  }

  async startServing(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { branch: true },
    });

    if (!entry) {
      throw new NotFoundException(`Queue entry with ID ${entryId} not found`);
    }

    if (entry.status !== TicketStatus.CALLED) {
      throw new BadRequestException(`Cannot start serving ticket with status: ${entry.status}. Must be CALLED.`);
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: TicketStatus.SERVING,
        startedServingAt: new Date(),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(entry.branchId, QueueEvent.TICKET_SERVING, updated);
    this.gateway.broadcastQueueUpdate(entry.branchId, await this.getQueueStatus(entry.branchId));

    this.logger.log(`Ticket serving started: ${entry.ticketNumber}`);
    return updated;
  }

  async completeServing(entryId: string, notes?: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { branch: true },
    });

    if (!entry) {
      throw new NotFoundException(`Queue entry with ID ${entryId} not found`);
    }

    if (entry.status !== TicketStatus.SERVING) {
      throw new BadRequestException(`Cannot complete ticket with status: ${entry.status}. Must be SERVING.`);
    }

    const completedAt = new Date();
    const waitTime = entry.createdAt && entry.calledAt
      ? Math.floor((entry.calledAt.getTime() - entry.createdAt.getTime()) / 1000)
      : null;
    const serviceTime = entry.startedServingAt
      ? Math.floor((completedAt.getTime() - entry.startedServingAt.getTime()) / 1000)
      : null;

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: TicketStatus.COMPLETED,
        completedAt,
        actualWaitMinutes: waitTime ? Math.floor(waitTime / 60) : null,
        ...(notes ? { notes } : {}),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(entry.branchId, QueueEvent.TICKET_COMPLETED, updated);
    this.gateway.broadcastQueueUpdate(entry.branchId, await this.getQueueStatus(entry.branchId));

    this.logger.log(`Ticket completed: ${entry.ticketNumber} (wait: ${waitTime}s, service: ${serviceTime}s)`);
    return { ...updated, waitTimeSeconds: waitTime, serviceTimeSeconds: serviceTime };
  }

  async cancelTicket(entryId: string, reason: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { branch: true },
    });

    if (!entry) {
      throw new NotFoundException(`Queue entry with ID ${entryId} not found`);
    }

    if (entry.status === TicketStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed ticket');
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: TicketStatus.CANCELLED,
        completedAt: new Date(),
        notes: reason || 'Cancelled by operator',
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(entry.branchId, QueueEvent.TICKET_CANCELLED, updated);
    this.gateway.broadcastQueueUpdate(entry.branchId, await this.getQueueStatus(entry.branchId));

    this.logger.log(`Ticket cancelled: ${entry.ticketNumber} - ${reason}`);
    return updated;
  }

  async noShow(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { branch: true },
    });

    if (!entry) {
      throw new NotFoundException(`Queue entry with ID ${entryId} not found`);
    }

    if (entry.status !== TicketStatus.CALLED && entry.status !== TicketStatus.WAITING) {
      throw new BadRequestException(
        `Cannot mark no-show for ticket with status: ${entry.status}`,
      );
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: TicketStatus.NO_SHOW,
        completedAt: new Date(),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(entry.branchId, QueueEvent.TICKET_CANCELLED, updated);
    this.gateway.broadcastQueueUpdate(entry.branchId, await this.getQueueStatus(entry.branchId));

    this.logger.log(`Ticket marked no-show: ${entry.ticketNumber}`);
    return updated;
  }

  async transferTicket(entryId: string, toBranchId: string, reason?: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { branch: true },
    });

    if (!entry) {
      throw new NotFoundException(`Queue entry with ID ${entryId} not found`);
    }

    if (entry.status === TicketStatus.COMPLETED) {
      throw new BadRequestException('Cannot transfer a completed ticket');
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: TicketStatus.TRANSFERRED,
        completedAt: new Date(),
        notes: reason ? `Transferred to ${toBranchId}: ${reason}` : `Transferred to ${toBranchId}`,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    const newTicketNumber = await this.generateTicketNumber(toBranchId, entry.serviceType as ServiceType);
    const newTicket = await this.prisma.queueEntry.create({
      data: {
        branchId: toBranchId,
        patientId: entry.patientId,
        patientName: entry.patientName,
        patientPhone: entry.patientPhone,
        patientNationalId: entry.patientNationalId,
        serviceType: entry.serviceType,
        priority: entry.priority,
        notes: entry.notes ? `[Transferred from ${entry.branch.nameAr}] ${entry.notes}` : `[Transferred from ${entry.branch.nameAr}]`,
        ticketNumber: newTicketNumber,
        status: TicketStatus.WAITING,
        createdBy: entry.createdBy,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    this.gateway.broadcastToBranch(entry.branchId, QueueEvent.TICKET_CANCELLED, updated);
    this.gateway.broadcastToBranch(toBranchId, QueueEvent.TICKET_CREATED, newTicket);
    this.gateway.broadcastQueueUpdate(entry.branchId, await this.getQueueStatus(entry.branchId));
    this.gateway.broadcastQueueUpdate(toBranchId, await this.getQueueStatus(toBranchId));

    this.logger.log(`Ticket transferred: ${entry.ticketNumber} -> ${newTicketNumber}`);
    return { original: updated, transferred: newTicket };
  }

  async getQueueStatus(branchId: string) {
    const [waitingCount, calledCount, servingCount] = await Promise.all([
      this.prisma.queueEntry.count({
        where: { branchId, status: TicketStatus.WAITING },
      }),
      this.prisma.queueEntry.count({
        where: { branchId, status: TicketStatus.CALLED },
      }),
      this.prisma.queueEntry.count({
        where: { branchId, status: TicketStatus.SERVING },
      }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const servedToday = await this.prisma.queueEntry.count({
      where: {
        branchId,
        status: TicketStatus.COMPLETED,
        completedAt: { gte: todayStart },
      },
    });

    const servicePoints = await this.prisma.queueServicePoint.findMany({
      where: { branchId, status: 'ACTIVE' },
      include: {
        currentEntry: {
          select: { id: true, ticketNumber: true, status: true, patientName: true },
        },
      },
    });

    return {
      branchId,
      waitingCount,
      calledCount,
      servingCount,
      servedToday,
      servicePoints: servicePoints.map((sp) => ({
        id: sp.id,
        name: sp.name,
        type: sp.type,
        currentTicket: sp.currentEntry ?? null,
        status: sp.currentEntry ? 'BUSY' : 'AVAILABLE',
      })),
      timestamp: new Date().toISOString(),
    };
  }

  async getQueueEntries(
    branchId: string,
    filters: { status?: string; page?: number; limit?: number; date?: string },
  ) {
    const { status, page = 1, limit = 50, date } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QueueEntryWhereInput = { branchId };
    if (status) where.status = status as any;
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.createdAt = { gte: dayStart, lte: dayEnd };
    }

    const [entries, total] = await Promise.all([
      this.prisma.queueEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
          branch: { select: { id: true, nameAr: true } },
        },
      }),
      this.prisma.queueEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getQueueHistory(branchId: string, dateFrom: string, dateTo: string) {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    const entries = await this.prisma.queueEntry.findMany({
      where: {
        branchId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    const total = entries.length;
    const completed = entries.filter((e) => e.status === TicketStatus.COMPLETED).length;
    const cancelled = entries.filter((e) => e.status === TicketStatus.CANCELLED).length;
    const noShow = entries.filter((e) => e.status === TicketStatus.NO_SHOW).length;

    const completedEntries = entries.filter(
      (e) => e.createdAt && e.calledAt && e.status === TicketStatus.COMPLETED,
    );
    const avgWaitTime =
      completedEntries.length > 0
        ? completedEntries.reduce((sum, e) => {
            const wait = (e.calledAt!.getTime() - e.createdAt!.getTime()) / 1000;
            return sum + wait;
          }, 0) / completedEntries.length
        : 0;

    return {
      entries,
      summary: {
        total,
        completed,
        cancelled,
        noShow,
        avgWaitTimeSeconds: Math.round(avgWaitTime),
        completionRate: total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0,
      },
      dateRange: { from: dateFrom, to: dateTo },
    };
  }

  async getServicePoints(branchId: string) {
    return this.prisma.queueServicePoint.findMany({
      where: { branchId },
      include: {
        currentEntry: {
          where: { status: { in: [TicketStatus.CALLED, TicketStatus.SERVING] } },
          select: {
            id: true,
            ticketNumber: true,
            patientName: true,
            status: true,
            calledAt: true,
            startedServingAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateServicePoint(
    id: string,
    dto: { name?: string; type?: string; status?: string },
  ) {
    const point = await this.prisma.queueServicePoint.findUnique({ where: { id } });
    if (!point) {
      throw new NotFoundException(`Service point with ID ${id} not found`);
    }

    const updated = await this.prisma.queueServicePoint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
    });

    this.gateway.broadcastToBranch(point.branchId, QueueEvent.SERVICE_POINT_UPDATED, updated);
    return updated;
  }

  async getDashboardStats(branchId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [waiting, serving, completedToday, cancelledToday, noShowToday, totalToday] =
      await Promise.all([
        this.prisma.queueEntry.count({
          where: { branchId, status: TicketStatus.WAITING },
        }),
        this.prisma.queueEntry.count({
          where: { branchId, status: TicketStatus.SERVING },
        }),
        this.prisma.queueEntry.count({
          where: { branchId, status: TicketStatus.COMPLETED, completedAt: { gte: todayStart } },
        }),
        this.prisma.queueEntry.count({
          where: { branchId, status: TicketStatus.CANCELLED, completedAt: { gte: todayStart } },
        }),
        this.prisma.queueEntry.count({
          where: { branchId, status: TicketStatus.NO_SHOW, completedAt: { gte: todayStart } },
        }),
        this.prisma.queueEntry.count({
          where: { branchId, createdAt: { gte: todayStart } },
        }),
      ]);

    const completedEntriesToday = await this.prisma.queueEntry.findMany({
      where: {
        branchId,
        status: TicketStatus.COMPLETED,
        completedAt: { gte: todayStart },
        calledAt: { not: null },
      },
      select: { createdAt: true, calledAt: true, startedServingAt: true, completedAt: true },
    });

    const avgWaitTime =
      completedEntriesToday.length > 0
        ? completedEntriesToday.reduce((sum, e) => {
            const wait = (e.calledAt!.getTime() - e.createdAt.getTime()) / 1000;
            return sum + wait;
          }, 0) / completedEntriesToday.length
        : 0;

    const avgServiceTime =
      completedEntriesToday.length > 0
        ? completedEntriesToday
            .filter((e) => e.startedServingAt)
            .reduce((sum, e) => {
              const service = (e.completedAt!.getTime() - e.startedServingAt!.getTime()) / 1000;
              return sum + service;
            }, 0) / completedEntriesToday.filter((e) => e.startedServingAt).length
        : 0;

    const hourlyDistribution: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourlyDistribution[i] = 0;

    await this.prisma.queueEntry.findMany({
      where: { branchId, createdAt: { gte: todayStart } },
      select: { createdAt: true },
    }).then((entries) => {
      entries.forEach((e) => {
        if (e.createdAt) {
          const hour = e.createdAt.getHours();
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
      });
    });

    const peakHour = Object.entries(hourlyDistribution).reduce(
      (max, [hour, count]) => (count > max.count ? { hour: Number(hour), count } : max),
      { hour: 0, count: 0 },
    );

    return {
      branchId,
      current: {
        waiting,
        serving,
      },
      today: {
        total: totalToday,
        completed: completedToday,
        cancelled: cancelledToday,
        noShow: noShowToday,
      },
      performance: {
        avgWaitTimeSeconds: Math.round(avgWaitTime),
        avgServiceTimeSeconds: Math.round(avgServiceTime),
        completionRate: totalToday > 0 ? Math.round((completedToday / totalToday) * 100 * 100) / 100 : 0,
      },
      peakHour: {
        hour: peakHour.hour,
        count: peakHour.count,
      },
      hourlyDistribution,
      timestamp: new Date().toISOString(),
    };
  }

  async generateTicketNumber(branchId: string, serviceType: ServiceType): Promise<string> {
    const prefixMap: Record<string, string> = {
      WALK_IN: 'Q',
      APPOINTMENT: 'O',
      HOME_VISIT: 'V',
      CONSULTATION: 'P',
    };

    const prefix = prefixMap[serviceType] ?? 'Q';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.queueEntry.count({
      where: {
        branchId,
        createdAt: { gte: todayStart },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  }
}
