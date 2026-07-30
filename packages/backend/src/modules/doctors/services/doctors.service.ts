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
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { DoctorScheduleSlotDto } from '../dto/schedule.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll(dto: PaginationDto & { specialty?: string; departmentId?: string; branchId?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', specialty, departmentId, branchId } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.DoctorProfileWhereInput = {};

    if (specialty) {
      where.specialtyAr = { contains: specialty, mode: 'insensitive' };
    }
    if (departmentId) where.departmentId = departmentId;

    if (search) {
      where.OR = [
        { specialtyAr: { contains: search, mode: 'insensitive' } },
        { specialtyEn: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { user: { profile: { firstNameAr: { contains: search, mode: 'insensitive' } } } },
        { user: { profile: { lastNameAr: { contains: search, mode: 'insensitive' } } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const include: Prisma.DoctorProfileInclude = {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          profile: { select: { firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true, avatar: true } },
        },
      },
      department: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      _count: { select: { schedule: true, appointments: true, issuedOrders: true } },
    };

    if (branchId) {
      include.schedule = {
        where: { branchId },
        select: { dayOfWeek: true, startTime: true, endTime: true, isAvailable: true },
        orderBy: { dayOfWeek: 'asc' },
      };
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include,
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      data: doctors,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
            profile: {
              select: {
                firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true,
                dateOfBirth: true, gender: true, nationality: true, avatar: true, address: true,
              },
            },
          },
        },
        department: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        schedule: {
          orderBy: { dayOfWeek: 'asc' },
          include: { branch: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
        },
        _count: { select: { appointments: true, issuedOrders: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const totalPatients = await this.prisma.appointment.count({
      where: { doctorId: id, status: 'COMPLETED' },
    });

    return { ...doctor, uniquePatients: totalPatients };
  }

  async create(dto: CreateDoctorDto, userId?: string) {
    const existingUser = await this.prisma.doctorProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (existingUser) {
      throw new ConflictException('A doctor profile already exists for this user');
    }

    const existingLicense = await this.prisma.doctorProfile.findUnique({
      where: { licenseNumber: dto.licenseNumber },
    });
    if (existingLicense) {
      throw new ConflictException('A doctor with this license number already exists');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const doctor = await this.prisma.doctorProfile.create({
      data: {
        userId: dto.userId,
        licenseNumber: dto.licenseNumber,
        specialtyAr: dto.specialtyAr,
        specialtyEn: dto.specialtyEn,
        departmentId: dto.departmentId,
        consultationFee: dto.consultationFee,
        experience: dto.experience,
        consultationDuration: dto.consultationDuration ?? 15,
        subSpecialty: dto.subSpecialty,
        education: dto.education,
        certifications: dto.certifications,
        bio: dto.bio,
        acceptingPatients: dto.acceptingPatients ?? true,
        isConsultant: dto.isConsultant ?? false,
      },
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
        department: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('doctors:*');

    this.logger.log(`Doctor profile created: ${doctor.id} for user ${dto.userId}`);
    return doctor;
  }

  async update(id: string, dto: Partial<CreateDoctorDto>, userId?: string) {
    const existing = await this.findOne(id);

    if (dto.licenseNumber && dto.licenseNumber !== existing.licenseNumber) {
      const dup = await this.prisma.doctorProfile.findUnique({
        where: { licenseNumber: dto.licenseNumber },
      });
      if (dup) {
        throw new ConflictException('A doctor with this license number already exists');
      }
    }

    const updateData: Prisma.DoctorProfileUpdateInput = {};
    if (dto.licenseNumber) updateData.licenseNumber = dto.licenseNumber;
    if (dto.specialtyAr) updateData.specialtyAr = dto.specialtyAr;
    if (dto.specialtyEn !== undefined) updateData.specialtyEn = dto.specialtyEn;
    if (dto.departmentId !== undefined) {
      updateData.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    }
    if (dto.consultationFee !== undefined) updateData.consultationFee = dto.consultationFee;
    if (dto.experience !== undefined) updateData.experience = dto.experience;
    if (dto.consultationDuration !== undefined) updateData.consultationDuration = dto.consultationDuration;
    if (dto.subSpecialty !== undefined) updateData.subSpecialty = dto.subSpecialty;
    if (dto.education !== undefined) updateData.education = dto.education;
    if (dto.certifications !== undefined) updateData.certifications = dto.certifications;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.acceptingPatients !== undefined) updateData.acceptingPatients = dto.acceptingPatients;
    if (dto.isConsultant !== undefined) updateData.isConsultant = dto.isConsultant;

    const updated = await this.prisma.doctorProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstNameAr: true, lastNameAr: true } } } },
        department: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.cache.invalidatePattern('doctors:*');

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    const hasActiveAppointments = await this.prisma.appointment.findFirst({
      where: {
        doctorId: id,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
    });

    if (hasActiveAppointments) {
      throw new BadRequestException('Cannot remove doctor with active appointments');
    }

    await this.prisma.doctorProfile.delete({ where: { id } });
    await this.cache.invalidatePattern('doctors:*');

    this.logger.log(`Doctor profile removed: ${id}`);
    return { message: 'Doctor profile removed successfully' };
  }

  async getSchedule(doctorId: string, branchId?: string) {
    await this.findOne(doctorId);

    const where: Prisma.DoctorScheduleWhereInput = { doctorId };
    if (branchId) where.branchId = branchId;

    return this.prisma.doctorSchedule.findMany({
      where,
      orderBy: { dayOfWeek: 'asc' },
      include: { branch: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
    });
  }

  async updateSchedule(doctorId: string, slots: DoctorScheduleSlotDto[]) {
    await this.findOne(doctorId);

    await this.prisma.$transaction(async (tx) => {
      for (const slot of slots) {
        await tx.doctorSchedule.upsert({
          where: {
            doctorId_branchId_dayOfWeek: {
              doctorId,
              branchId: slot.branchId,
              dayOfWeek: slot.dayOfWeek,
            },
          },
          create: {
            doctorId,
            branchId: slot.branchId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration ?? 15,
            maxPatients: slot.maxPatients ?? 20,
            isAvailable: slot.isAvailable ?? true,
            breakStart: slot.breakStart,
            breakEnd: slot.breakEnd,
          },
          update: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDuration: slot.slotDuration ?? 15,
            maxPatients: slot.maxPatients ?? 20,
            isAvailable: slot.isAvailable ?? true,
            breakStart: slot.breakStart,
            breakEnd: slot.breakEnd,
          },
        });
      }
    });

    await this.cache.invalidatePattern(`doctors:${doctorId}:schedule`);

    return this.getSchedule(doctorId);
  }

  async getAvailability(doctorId: string, date: string) {
    await this.findOne(doctorId);

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
      include: { branch: { select: { id: true, nameAr: true } } },
    });

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });

    const availability: Array<{
      branchId: string;
      branchName: string;
      slots: Array<{ time: string; available: boolean }>;
    }> = [];

    for (const schedule of schedules) {
      const slotDuration = schedule.slotDuration;
      const slots: Array<{ time: string; available: boolean }> = [];

      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + slotDuration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const min = currentMinutes % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, min, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

        let available = true;

        if (schedule.breakStart && schedule.breakEnd) {
          const [bStartH, bStartM] = schedule.breakStart.split(':').map(Number);
          const [bEndH, bEndM] = schedule.breakEnd.split(':').map(Number);
          const breakStart = bStartH * 60 + bStartM;
          const breakEnd = bEndH * 60 + bEndM;
          if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
            available = false;
          }
        }

        if (available && slotStart < new Date()) {
          available = false;
        }

        if (available) {
          const hasConflict = existingAppointments.some((apt) => {
            const aptStart = new Date(apt.scheduledAt);
            const aptEnd = new Date(aptStart.getTime() + (apt.durationMinutes || 15) * 60 * 1000);
            return slotStart < aptEnd && slotEnd > aptStart;
          });
          if (hasConflict) available = false;
        }

        slots.push({ time: timeStr, available });
        currentMinutes += slotDuration;
      }

      availability.push({
        branchId: schedule.branchId,
        branchName: schedule.branch.nameAr,
        slots,
      });
    }

    return { doctorId, date, availability };
  }

  async getDoctorStats(doctorId: string) {
    await this.findOne(doctorId);

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalAppointments,
      todayAppointments,
      monthlyAppointments,
      completedAppointments,
      totalOrders,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: { doctorId } }),
      this.prisma.appointment.count({ where: { doctorId, scheduledAt: { gte: startOfDay } } }),
      this.prisma.appointment.count({ where: { doctorId, scheduledAt: { gte: startOfMonth } } }),
      this.prisma.appointment.count({ where: { doctorId, status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { doctorId: doctorId } }),
      this.prisma.order.aggregate({
        where: { doctorId: doctorId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    const completionRate = totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

    return {
      totalAppointments,
      todayAppointments,
      monthlyAppointments,
      completedAppointments,
      completionRate,
      totalOrders,
      monthlyRevenue: monthlyRevenue._sum.total ?? 0,
    };
  }

  async searchBySpecialty(specialty: string) {
    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        acceptingPatients: true,
        OR: [
          { specialtyAr: { contains: specialty, mode: 'insensitive' } },
          { specialtyEn: { contains: specialty, mode: 'insensitive' } },
          { subSpecialty: { contains: specialty, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          select: {
            profile: { select: { firstNameAr: true, lastNameAr: true, firstNameEn: true, lastNameEn: true, avatar: true } },
          },
        },
        department: { select: { id: true, nameAr: true, nameEn: true } },
      },
      take: 50,
    });

    return doctors;
  }

  async toggleAcceptingPatients(doctorId: string) {
    const doctor = await this.findOne(doctorId);

    const updated = await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { acceptingPatients: !doctor.acceptingPatients },
    });

    await this.cache.invalidatePattern('doctors:*');

    return {
      doctorId: updated.id,
      acceptingPatients: updated.acceptingPatients,
      message: `Doctor is now ${updated.acceptingPatients ? 'accepting' : 'not accepting'} patients`,
    };
  }
}
