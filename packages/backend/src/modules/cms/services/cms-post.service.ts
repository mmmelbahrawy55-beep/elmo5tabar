import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class CmsPostService {
  private readonly logger = new Logger(CmsPostService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.blogPost.create({
      data: {
        ...data,
        status: data.scheduledAt ? 'scheduled' : 'draft',
        createdBy: userId,
        updatedBy: userId,
      },
      include: { author: true, category: true },
    });
  }

  async findAll(query: any) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { titleAr: { contains: query.search, mode: 'insensitive' } },
        { titleEn: { contains: query.search, mode: 'insensitive' } },
        { excerptAr: { contains: query.search, mode: 'insensitive' } },
        { excerptEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.contentType) where.contentType = query.contentType;
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.authorId) where.authorId = query.authorId;
    if (query.tag) where.tags = { has: query.tag };
    if (query.locale) where.locale = query.locale;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.isPinned !== undefined) where.isPinned = query.isPinned;
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where, orderBy, include: { author: true, category: true },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id }, include: {
        author: true, category: true, revisions: { orderBy: { version: 'desc' }, take: 5 },
        comments: { where: { isApproved: true, parentId: null, deletedAt: null }, include: { replies: true }, orderBy: { createdAt: 'desc' } },
        relatedTo: { include: { target: true } },
      },
    });
    if (!post || post.deletedAt) throw new BadRequestException('Post not found');
    return post;
  }

  async update(id: string, data: any, userId: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post || post.deletedAt) throw new BadRequestException('Post not found');

    return this.prisma.blogPost.update({
      where: { id },
      data: { ...data, updatedBy: userId, updatedAt: new Date() },
      include: { author: true, category: true },
    });
  }

  async remove(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new BadRequestException('Post not found');
    return this.prisma.blogPost.update({
      where: { id }, data: { deletedAt: new Date() },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, deletedAt: null, status: { in: ['published', 'scheduled'] } },
      include: { author: true, category: true, relatedTo: { include: { target: true } } },
    });
    if (!post) throw new BadRequestException('Post not found');
    return post;
  }

  async createRelation(postId: string, targetId: string, type = 'related', weight = 1) {
    const [post, target] = await Promise.all([
      this.prisma.blogPost.findUnique({ where: { id: postId } }),
      this.prisma.blogPost.findUnique({ where: { id: targetId } }),
    ]);
    if (!post || !target) throw new BadRequestException('Post not found');

    const existing = await this.prisma.blogPostRelation.findFirst({
      where: { sourceId: postId, targetId },
    });
    if (existing) {
      return this.prisma.blogPostRelation.update({
        where: { id: existing.id },
        data: { type, weight },
      });
    }

    return this.prisma.blogPostRelation.create({
      data: { sourceId: postId, targetId, type, weight },
    });
  }

  async removeRelation(id: string) {
    return this.prisma.blogPostRelation.delete({ where: { id } });
  }
}
