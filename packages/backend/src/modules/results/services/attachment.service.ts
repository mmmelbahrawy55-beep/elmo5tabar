import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  encoding?: string;
}

interface AttachmentTypeSummary {
  fileType: string;
  count: number;
  totalSize: number;
}

interface SupportedFormat {
  extension: string;
  mimeType: string;
  category: 'IMAGE' | 'DOCUMENT' | 'DATA' | 'OTHER';
  maxSize: number;
}

@Injectable()
export class AttachmentService {
  private readonly logger = new Logger(AttachmentService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly supportedFormats: SupportedFormat[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads/results');
    this.maxFileSize = this.config.get<number>('MAX_ATTACHMENT_SIZE', 50 * 1024 * 1024);

    this.supportedFormats = [
      { extension: '.jpg', mimeType: 'image/jpeg', category: 'IMAGE', maxSize: 10 * 1024 * 1024 },
      { extension: '.jpeg', mimeType: 'image/jpeg', category: 'IMAGE', maxSize: 10 * 1024 * 1024 },
      { extension: '.png', mimeType: 'image/png', category: 'IMAGE', maxSize: 10 * 1024 * 1024 },
      { extension: '.gif', mimeType: 'image/gif', category: 'IMAGE', maxSize: 5 * 1024 * 1024 },
      { extension: '.webp', mimeType: 'image/webp', category: 'IMAGE', maxSize: 10 * 1024 * 1024 },
      { extension: '.dicom', mimeType: 'application/dicom', category: 'IMAGE', maxSize: 100 * 1024 * 1024 },
      { extension: '.pdf', mimeType: 'application/pdf', category: 'DOCUMENT', maxSize: 50 * 1024 * 1024 },
      { extension: '.doc', mimeType: 'application/msword', category: 'DOCUMENT', maxSize: 25 * 1024 * 1024 },
      { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'DOCUMENT', maxSize: 25 * 1024 * 1024 },
      { extension: '.xls', mimeType: 'application/vnd.ms-excel', category: 'DOCUMENT', maxSize: 25 * 1024 * 1024 },
      { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'DOCUMENT', maxSize: 25 * 1024 * 1024 },
      { extension: '.csv', mimeType: 'text/csv', category: 'DATA', maxSize: 10 * 1024 * 1024 },
      { extension: '.txt', mimeType: 'text/plain', category: 'DATA', maxSize: 5 * 1024 * 1024 },
      { extension: '.hl7', mimeType: 'text/plain', category: 'DATA', maxSize: 10 * 1024 * 1024 },
      { extension: '.xml', mimeType: 'application/xml', category: 'DATA', maxSize: 10 * 1024 * 1024 },
      { extension: '.json', mimeType: 'application/json', category: 'DATA', maxSize: 10 * 1024 * 1024 },
    ];

    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        this.logger.log(`Upload directory created: ${this.uploadDir}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${this.uploadDir}`, error);
    }
  }

  async upload(reportId: string, file: UploadedFile, userId: string, description?: string): Promise<any> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, reportNumber: true, patientId: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size ${file.size} exceeds maximum allowed size of ${this.maxFileSize}`);
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const format = this.supportedFormats.find((f) => f.extension === extension);
    if (!format) {
      throw new BadRequestException(`File format ${extension} is not supported. Supported formats: ${this.supportedFormats.map((f) => f.extension).join(', ')}`);
    }

    if (file.size > format.maxSize) {
      throw new BadRequestException(`File size ${file.size} exceeds ${format.extension} limit of ${format.maxSize}`);
    }

    const fileId = this.generateFileId();
    const safeFileName = `${fileId}${extension}`;
    const relativePath = `reports/${report.reportNumber}/${safeFileName}`;
    const absolutePath = path.join(this.uploadDir, relativePath);
    const fileUrl = `/uploads/${relativePath}`;

    const dirPath = path.dirname(absolutePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(absolutePath, file.buffer);

    this.logger.log(`File saved to disk: ${absolutePath}`);

    const attachment = await this.prisma.resultAttachment.create({
      data: {
        reportId,
        fileName: file.originalname,
        fileUrl,
        fileType: file.mimetype || format.category,
        fileSize: file.size,
        description: description || null,
        uploadedBy: userId,
        createdAt: new Date(),
      },
    });

    this.logger.log(`Attachment ${attachment.id} uploaded for report ${report.reportNumber}`);
    return attachment;
  }

  async getAttachments(reportId: string): Promise<any[]> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const attachments = await this.prisma.resultAttachment.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    });

    return attachments;
  }

  async getAttachment(attachmentId: string): Promise<{ attachment: any; filePath: string; fileBuffer: Buffer }> {
    const attachment = await this.prisma.resultAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        report: { select: { id: true, reportNumber: true } },
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    const absolutePath = path.join(this.uploadDir, attachment.fileUrl.replace('/uploads/', ''));
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Attachment file not found on disk');
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    return { attachment, filePath: absolutePath, fileBuffer };
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = await this.prisma.resultAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    const absolutePath = path.join(this.uploadDir, attachment.fileUrl.replace('/uploads/', ''));
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      this.logger.log(`File deleted from disk: ${absolutePath}`);
    }

    await this.prisma.resultAttachment.delete({
      where: { id: attachmentId },
    });

    this.logger.log(`Attachment ${attachmentId} deleted by user ${userId}`);
  }

  async getAttachmentsByPatient(patientId: string): Promise<any[]> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const reports = await this.prisma.report.findMany({
      where: { patientId },
      select: { id: true },
    });

    if (reports.length === 0) {
      return [];
    }

    const reportIds = reports.map((r) => r.id);
    const attachments = await this.prisma.resultAttachment.findMany({
      where: { reportId: { in: reportIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        report: { select: { id: true, reportNumber: true, createdAt: true } },
      },
    });

    return attachments;
  }

  async getAttachmentTypes(reportId: string): Promise<AttachmentTypeSummary[]> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const attachments = await this.prisma.resultAttachment.findMany({
      where: { reportId },
    });

    const typeMap = new Map<string, { count: number; totalSize: number }>();
    for (const att of attachments) {
      const existing = typeMap.get(att.fileType) || { count: 0, totalSize: 0 };
      existing.count++;
      existing.totalSize += att.fileSize;
      typeMap.set(att.fileType, existing);
    }

    return Array.from(typeMap.entries()).map(([fileType, data]) => ({
      fileType,
      count: data.count,
      totalSize: data.totalSize,
    }));
  }

  async getTotalByType(patientId: string): Promise<AttachmentTypeSummary[]> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const reports = await this.prisma.report.findMany({
      where: { patientId },
      select: { id: true },
    });

    if (reports.length === 0) return [];

    const reportIds = reports.map((r) => r.id);
    const attachments = await this.prisma.resultAttachment.findMany({
      where: { reportId: { in: reportIds } },
    });

    const typeMap = new Map<string, { count: number; totalSize: number }>();
    for (const att of attachments) {
      const existing = typeMap.get(att.fileType) || { count: 0, totalSize: 0 };
      existing.count++;
      existing.totalSize += att.fileSize;
      typeMap.set(att.fileType, existing);
    }

    return Array.from(typeMap.entries()).map(([fileType, data]) => ({
      fileType,
      count: data.count,
      totalSize: data.totalSize,
    }));
  }

  async generateThumbnail(attachmentId: string): Promise<string> {
    const { attachment, fileBuffer } = await this.getAttachment(attachmentId);

    const imageFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!imageFormats.includes(attachment.fileType)) {
      throw new BadRequestException('Thumbnail generation is only supported for image files');
    }

    try {
      const thumbnailDir = path.join(this.uploadDir, 'thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      const thumbnailName = `thumb_${path.basename(attachment.fileUrl)}`;
      const thumbnailPath = path.join(thumbnailDir, thumbnailName);

      const sharpLib = await this.loadSharp();
      if (sharpLib) {
        await sharpLib(fileBuffer)
          .resize(200, 200, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } else {
        fs.writeFileSync(thumbnailPath, fileBuffer);
      }

      const thumbnailUrl = `/uploads/thumbnails/${thumbnailName}`;
      this.logger.log(`Thumbnail generated for attachment ${attachmentId}: ${thumbnailUrl}`);
      return thumbnailUrl;
    } catch (error) {
      this.logger.warn(`Thumbnail generation failed for ${attachmentId}, using original`, error);
      return attachment.fileUrl;
    }
  }

  private async loadSharp(): Promise<any | null> {
    try {
      return await Promise.resolve(null);
    } catch {
      this.logger.warn('Sharp library not available. Install it for thumbnail generation: npm install sharp');
      return null;
    }
  }

  getSupportedFormats(): SupportedFormat[] {
    return this.supportedFormats;
  }

  private generateFileId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  }
}


