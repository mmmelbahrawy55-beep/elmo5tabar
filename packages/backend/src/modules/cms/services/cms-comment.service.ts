import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class CmsCommentService {
  private readonly logger = new Logger(CmsCommentService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: { postId: string; content: string; parentId?: string; authorName?: string; authorEmail?: string; userId?: string }) {
    const post = await this.prisma.blogPost.findUnique({ where: { id: data.postId } });
    if (!post || post.deletedAt) throw new BadRequestException('Post not found');
    if (!post.allowComments && !data.userId) throw new BadRequestException('Comments are disabled on this post');

    const comment = await this.prisma.contentComment.create({
      data: {
        postId: data.postId,
        content: data.content,
        parentId: data.parentId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        userId: data.userId,
        isApproved: !!data.userId,
      },
    });

    await this.prisma.blogPost.update({
      where: { id: data.postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async moderate(commentId: string, action: 'approve' | 'reject' | 'spam') {
    const comment = await this.prisma.contentComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new BadRequestException('Comment not found');

    const updateData: any = {};
    if (action === 'approve') updateData.isApproved = true;
    if (action === 'reject') updateData.isApproved = false;
    if (action === 'spam') { updateData.isSpam = true; updateData.isApproved = false; }

    return this.prisma.contentComment.update({ where: { id: commentId }, data: updateData });
  }

  async findPending(page = 1, limit = 20) {
    const where = { isApproved: false, isSpam: false, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.contentComment.findMany({ where, include: { post: { select: { id: true, titleAr: true, titleEn: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.contentComment.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByPost(postId: string, page = 1, limit = 20) {
    const where = { postId, isApproved: true, parentId: null, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.contentComment.findMany({ where, include: { replies: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.contentComment.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(commentId: string) {
    const comment = await this.prisma.contentComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new BadRequestException('Comment not found');
    await this.prisma.contentComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
    await this.prisma.blogPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });
  }
}
