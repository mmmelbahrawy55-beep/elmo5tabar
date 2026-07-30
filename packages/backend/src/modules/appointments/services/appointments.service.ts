import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppointmentGateway, AppointmentEvent } from '../gateway/appointment.gateway';
import { CreateAppointmentDto, AppointmentType } from '../dto/create-appointment.dto';
import { AppointmentFiltersDto, AppointmentStatus } from '../dto/appointment-filters.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly gateway: AppointmentGateway,
  ) {}

  async findAll(filters: AppointmentFiltersDto) {
    const { page = 1, limit = 20, status, branchId, doctorId, patientId, dateFrom, dateTo, type } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {};

    if (status) where.status = status as any;
    if (branchId) where.branchId = branchId;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom);
      if (dateTo) where.scheduledAt.lte = new Date(dateTo);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            select: {
              id: true,
              firstNameAr: true,
              lastNameAr: true,
              phone: true,
              email: true,
            },
          },
          branch: {
            select: { id: true, nameAr: true, addressAr: true },
          },
          doctorProfile: {
            select: {
              id: true,
              specialtyAr: true,
              user: {
                select: {
                  profile: {
                    select: { firstNameAr: true, lastNameAr: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        branch: true,
        doctorProfile: true,
        order: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto, userId?: string) {
    const scheduledAt = new Date(dto.scheduledAt);
    const durationMinutes = dto.durationMinutes ?? 15;
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    await this.validateNoConflict({
      branchId: dto.branchId,
      doctorId: dto.doctorId,
      scheduledAt,
      endTime,
      durationMinutes,
    });

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        branchId: dto.branchId,
        doctorId: dto.doctorId,
        scheduledAt,
        durationMinutes,
        type: dto.type ?? AppointmentType.LAB_TEST,
        notes: dto.notes,
        status: AppointmentStatus.SCHEDULED,
        createdBy: userId,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(dto.branchId, AppointmentEvent.CREATED, appointment);
    this.gateway.broadcastToPatient(dto.patientId, AppointmentEvent.CREATED, appointment);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment created: ${appointment.id}`);
    return appointment;
  }

  async update(id: string, dto: Partial<CreateAppointmentDto>, userId?: string) {
    const existing = await this.findOne(id);

    if (existing.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled appointment');
    }

    if (existing.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot update a completed appointment');
    }

    if (dto.scheduledAt && dto.scheduledAt !== existing.scheduledAt.toISOString()) {
      const newScheduledAt = new Date(dto.scheduledAt);
      const durationMinutes = dto.durationMinutes ?? existing.durationMinutes;
      const endTime = new Date(newScheduledAt.getTime() + durationMinutes * 60 * 1000);

      await this.validateNoConflict({
        branchId: dto.branchId ?? existing.branchId,
        doctorId: dto.doctorId ?? existing.doctorId,
        scheduledAt: newScheduledAt,
        endTime,
        durationMinutes,
        excludeAppointmentId: id,
      });
    }

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (dto.patientId) updateData.patient = { connect: { id: dto.patientId } };
    if (dto.branchId) updateData.branch = { connect: { id: dto.branchId } };
    if (dto.doctorId !== undefined) {
      updateData.doctorProfile = dto.doctorId ? { connect: { id: dto.doctorId } } : { disconnect: true };
    }
    if (dto.scheduledAt) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes) updateData.durationMinutes = dto.durationMinutes;
    if (dto.type) updateData.type = dto.type;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    updateData.updatedBy = userId;

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(existing.branchId, AppointmentEvent.UPDATED, updated);
    this.gateway.broadcastToPatient(existing.patientId, AppointmentEvent.UPDATED, updated);

    await this.cache.invalidatePattern('appointments:*');

    return updated;
  }

  async cancel(id: string, reason: string, userId: string) {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: reason,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(appointment.branchId, AppointmentEvent.CANCELLED, updated);
    this.gateway.broadcastToPatient(appointment.patientId, AppointmentEvent.CANCELLED, updated);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment cancelled: ${id} by ${userId}`);
    return updated;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto, userId: string) {
    const existing = await this.findOne(id);

    if (existing.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }

    if (existing.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule a completed appointment');
    }

    const newScheduledAt = new Date(dto.newScheduledAt);
    const durationMinutes = existing.durationMinutes;
    const endTime = new Date(newScheduledAt.getTime() + durationMinutes * 60 * 1000);

    await this.validateNoConflict({
      branchId: existing.branchId,
      doctorId: existing.doctorId,
      scheduledAt: newScheduledAt,
      endTime,
      durationMinutes,
      excludeAppointmentId: id,
    });

    const cancelledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: dto.reason ?? 'Rescheduled',
      },
    });

    this.gateway.broadcastToBranch(existing.branchId, AppointmentEvent.CANCELLED, cancelledAppointment);
    this.gateway.broadcastToPatient(existing.patientId, AppointmentEvent.CANCELLED, cancelledAppointment);

    const newAppointment = await this.prisma.appointment.create({
      data: {
        patientId: existing.patientId,
        branchId: existing.branchId,
        doctorId: existing.doctorId,
        scheduledAt: newScheduledAt,
        durationMinutes,
        type: existing.type,
        notes: existing.notes,
        status: AppointmentStatus.SCHEDULED,
        createdBy: userId,
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(existing.branchId, AppointmentEvent.RESCHEDULED, newAppointment);
    this.gateway.broadcastToPatient(existing.patientId, AppointmentEvent.RESCHEDULED, newAppointment);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment rescheduled: ${id} -> ${newAppointment.id}`);
    return newAppointment;
  }

  async checkIn(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot check in appointment with status: ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(appointment.branchId, AppointmentEvent.CHECKED_IN, updated);
    this.gateway.broadcastToPatient(appointment.patientId, AppointmentEvent.CHECKED_IN, updated);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment checked in: ${id}`);
    return updated;
  }

  async complete(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.CHECKED_IN && appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot complete appointment with status: ${appointment.status}. Must be CHECKED_IN or IN_PROGRESS.`,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(appointment.branchId, AppointmentEvent.COMPLETED, updated);
    this.gateway.broadcastToPatient(appointment.patientId, AppointmentEvent.COMPLETED, updated);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment completed: ${id}`);
    return updated;
  }

  async markNoShow(id: string) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot mark no-show for appointment with status: ${appointment.status}`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.NO_SHOW,
        noShowAt: new Date(),
      },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });

    this.gateway.broadcastToBranch(appointment.branchId, AppointmentEvent.CANCELLED, updated);
    this.gateway.broadcastToPatient(appointment.patientId, AppointmentEvent.CANCELLED, updated);

    await this.cache.invalidatePattern('appointments:*');

    this.logger.log(`Appointment marked as no-show: ${id}`);
    return updated;
  }

  async getAvailableSlots(branchId: string, doctorId: string | undefined, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(8, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(20, 0, 0, 0);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        ...(doctorId ? { doctorId } : {}),
        scheduledAt: { gte: startOfDay, lt: endOfDay },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const slotDuration = 15;
    const slots: Array<{ time: string; available: boolean; datetime: string }> = [];

    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);

        if (slotStart < new Date()) continue;

        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

        const isOccupied = existingAppointments.some((apt) => {
          const aptStart = new Date(apt.scheduledAt);
          const aptEnd = new Date(aptStart.getTime() + (apt.durationMinutes || 15) * 60 * 1000);
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          available: !isOccupied,
          datetime: slotStart.toISOString(),
        });
      }
    }

    return slots;
  }

  async getCalendar(branchId: string, dateFrom: string, dateTo: string) {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        branchId,
        scheduledAt: { gte: start, lte: end },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    const groupedByDate: Record<string, typeof appointments> = {};
    appointments.forEach((apt) => {
      const dateKey = new Date(apt.scheduledAt).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(apt);
    });

    return {
      appointments,
      grouped: groupedByDate,
      total: appointments.length,
      dateRange: { from: dateFrom, to: dateTo },
    };
  }

  async getStats(branchId?: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.AppointmentWhereInput = {};

    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom);
      if (dateTo) where.scheduledAt.lte = new Date(dateTo);
    }

    const [total, completed, cancelled, noShow, scheduled, checkedIn] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.SCHEDULED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CHECKED_IN } }),
    ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;

    return {
      total,
      completed,
      cancelled,
      noShow,
      scheduled,
      checkedIn,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      dateRange: {
        from: dateFrom ?? null,
        to: dateTo ?? null,
      },
    };
  }

  async getUpcoming(patientId?: string, doctorId?: string, branchId?: string) {
    const where: Prisma.AppointmentWhereInput = {
      scheduledAt: { gte: new Date() },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN],
      },
    };

    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (branchId) where.branchId = branchId;

    return this.prisma.appointment.findMany({
      where,
      take: 10,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { id: true, firstNameAr: true, lastNameAr: true, phone: true } },
        branch: { select: { id: true, nameAr: true } },
        doctorProfile: { select: { id: true, specialtyAr: true } },
      },
    });
  }

  private async validateNoConflict(params: {
    branchId: string;
    doctorId?: string;
    scheduledAt: Date;
    endTime: Date;
    durationMinutes: number;
    excludeAppointmentId?: string;
  }) {
    const { branchId, doctorId, scheduledAt, endTime, excludeAppointmentId } = params;

    const conflictingConditions: Prisma.AppointmentWhereInput[] = [
      {
        branchId,
        scheduledAt: { lt: endTime },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
    ];

    if (doctorId) {
      conflictingConditions.push({
        doctorId,
        scheduledAt: { lt: endTime },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      });
    }

    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        AND: [
          { scheduledAt: { lt: endTime } },
          {
            scheduledAt: {
              gte: new Date(scheduledAt.getTime() - 60 * 60 * 1000),
            },
          },
          {
            id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          },
          {
            OR: doctorId
              ? [{ branchId }, { doctorId }]
              : [{ branchId }],
          },
          {
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
            },
          },
        ],
      },
    });

    if (conflicting) {
      throw new ConflictException(
        'Time slot is not available. There is a conflicting appointment in this time range.',
      );
    }
  }
}
