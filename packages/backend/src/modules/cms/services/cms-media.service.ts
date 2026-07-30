import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class CmsMediaService {
  private readonly logger = new Logger(CmsMediaService.name);
  private readonly uploadDir: string;
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'audio/mpeg', 'audio/wav'];
  private readonly maxFileSize = 50 * 1024 * 1024;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('MEDIA_UPLOAD_DIR', 'uploads/media');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, uploaderId: string, options?: { folder?: string; alt?: string; caption?: string; tags?: string[] }) {
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File too large (max 50MB)');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    const fileName = `${hash}${ext}`;
    const folder = options?.folder || 'general';
    const folderPath = path.join(this.uploadDir, folder);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const fileType = file.mimetype.startsWith('image') ? 'image'
      : file.mimetype.startsWith('video') ? 'video'
      : file.mimetype.startsWith('audio') ? 'audio' : 'document';

    let width: number | null = null;
    let height: number | null = null;

    const media = await this.prisma.media.create({
      data: {
        name: file.originalname.replace(ext, ''),
        fileName,
        fileUrl: `/uploads/media/${folder}/${fileName}`,
        fileType,
        mimeType: file.mimetype,
        fileSize: file.size,
        width,
        height,
        alt: options?.alt,
        caption: options?.caption,
        folder,
        tags: options?.tags || [],
        uploadedById: uploaderId,
      },
    });

    return media;
  }

  async findAll(query: { folder?: string; fileType?: string; search?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const where: any = {};
    if (query.folder) where.folder = query.folder;
    if (query.fileType) where.fileType = query.fileType;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { alt: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.media.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new BadRequestException('Media not found');
    const filePath = path.join(this.uploadDir, media.folder, media.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.prisma.media.delete({ where: { id } });
  }

  async getFolders() {
    const result = await this.prisma.media.groupBy({
      by: ['folder'],
      _count: { id: true },
      _sum: { fileSize: true },
    });
    return result.map(r => ({ folder: r.folder, count: r._count.id, totalSize: r._sum.fileSize || 0 }));
  }
}
