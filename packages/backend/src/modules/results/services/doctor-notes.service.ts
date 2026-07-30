import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import * as crypto from 'crypto';

interface NoteTemplate {
  id?: string;
  title: string;
  content: string;
  specialty: string;
  category?: string;
  isDefault?: boolean;
}

interface NoteFilters {
  page?: number;
  limit?: number;
  reportId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  isPrivate?: boolean;
}

@Injectable()
export class DoctorNotesService {
  private readonly logger = new Logger(DoctorNotesService.name);
  private readonly signatureAlgorithm = 'sha256';

  constructor(private readonly prisma: PrismaService) {}

  async addNote(reportId: string, doctorId: string, content: string, isPrivate: boolean = false): Promise<any> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Note content cannot be empty');
    }

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, patientId: true, reportNumber: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, email: true, role: true },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const note = await (this.prisma as any).reportNote.create({
      data: {
        reportId,
        patientId: report.patientId,
        doctorId,
        content,
        isPrivate,
        isSigned: false,
        signature: null,
        signedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Note added to report ${report.reportNumber} by doctor ${doctorId}`);
    return note;
  }

  async getNotes(reportId: string, userId: string, role: string): Promise<any[]> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, patientId: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const where: any = { reportId, deletedAt: null };

    const isPatient = role === 'PATIENT' || role === 'USER';
    if (isPatient) {
      where.isPrivate = false;
    }

    const notes = await (this.prisma as any).reportNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            firstNameEn: true,
            lastNameEn: true,
            firstNameAr: true,
            lastNameAr: true,
            role: true,
            specialty: true,
          },
        },
      },
    });

    return notes.map((note: any) => {
      if (isPatient) {
        const { isPrivate, ...rest } = note;
        return rest;
      }
      return note;
    });
  }

  async updateNote(noteId: string, doctorId: string, content: string): Promise<any> {
    const note = await (this.prisma as any).reportNote.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.doctorId !== doctorId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    if (note.deletedAt) {
      throw new BadRequestException('Cannot update a deleted note');
    }

    if (note.isSigned) {
      throw new BadRequestException('Cannot update a signed note. Create a new note instead.');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Note content cannot be empty');
    }

    const updated = await (this.prisma as any).reportNote.update({
      where: { id: noteId },
      data: { content, updatedAt: new Date() },
    });

    this.logger.log(`Note ${noteId} updated by doctor ${doctorId}`);
    return updated;
  }

  async deleteNote(noteId: string, doctorId: string): Promise<void> {
    const note = await (this.prisma as any).reportNote.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.doctorId !== doctorId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    if (note.deletedAt) {
      throw new BadRequestException('Note is already deleted');
    }

    await (this.prisma as any).reportNote.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Note ${noteId} soft-deleted by doctor ${doctorId}`);
  }

  async getNotesByPatient(patientId: string, doctorId: string): Promise<any[]> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const notes = await (this.prisma as any).reportNote.findMany({
      where: { patientId, doctorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        report: { select: { id: true, reportNumber: true, createdAt: true } },
      },
    });

    return notes;
  }

  async getNotesByDoctor(doctorId: string, filters: NoteFilters): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const { page = 1, limit = 20, reportId, patientId, dateFrom, dateTo, isPrivate } = filters;
    const skip = (page - 1) * limit;

    const where: any = { doctorId, deletedAt: null };
    if (reportId) where.reportId = reportId;
    if (patientId) where.patientId = patientId;
    if (isPrivate !== undefined) where.isPrivate = isPrivate;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [notes, total] = await Promise.all([
      (this.prisma as any).reportNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          report: { select: { id: true, reportNumber: true } },
        },
      }),
      (this.prisma as any).reportNote.count({ where }),
    ]);

    return {
      data: notes,
      meta: { total, page, limit },
    };
  }

  async addTemplate(noteTemplate: NoteTemplate): Promise<any> {
    if (!noteTemplate.title || !noteTemplate.content || !noteTemplate.specialty) {
      throw new BadRequestException('Title, content, and specialty are required for a note template');
    }

    const template = await (this.prisma as any).noteTemplate.create({
      data: {
        title: noteTemplate.title,
        content: noteTemplate.content,
        specialty: noteTemplate.specialty,
        category: noteTemplate.category || null,
        isDefault: noteTemplate.isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Note template created: ${template.id} - ${template.title}`);
    return template;
  }

  async getTemplates(specialty?: string): Promise<any[]> {
    const where: any = {};
    if (specialty) where.specialty = specialty;

    const templates = await (this.prisma as any).noteTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { title: 'asc' }],
    });

    return templates;
  }

  async signNote(noteId: string, doctorId: string): Promise<any> {
    const note = await (this.prisma as any).reportNote.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.doctorId !== doctorId) {
      throw new ForbiddenException('You can only sign your own notes');
    }

    if (note.deletedAt) {
      throw new BadRequestException('Cannot sign a deleted note');
    }

    if (note.isSigned) {
      return note;
    }

    const contentToSign = `${note.id}:${note.content}:${note.createdAt.toISOString()}:${doctorId}`;
    const signature = crypto.createHash(this.signatureAlgorithm).update(contentToSign).digest('hex');
    const timestamp = new Date();

    const signed = await (this.prisma as any).reportNote.update({
      where: { id: noteId },
      data: {
        isSigned: true,
        signature,
        signedAt: timestamp,
      },
    });

    this.logger.log(`Note ${noteId} digitally signed by doctor ${doctorId}`);
    return signed;
  }
}

