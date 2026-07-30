import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class CmsWorkflowService {
  private readonly logger = new Logger(CmsWorkflowService.name);
  private readonly workflowStates: Record<string, string[]> = {
    draft: ['submit_review'],
    review: ['approve', 'reject', 'draft'],
    approved: ['publish', 'archive', 'draft'],
    published: ['draft', 'archive'],
    archived: ['draft'],
    scheduled: ['draft', 'publish'],
  };

  constructor(private prisma: PrismaService) {}

  async transition(postId: string, action: string, userId: string, notes?: string, scheduledAt?: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('Post not found');

    const allowed = this.workflowStates[post.status];
    if (!allowed?.includes(action)) {
      throw new BadRequestException(`Cannot ${action} from status ${post.status}`);
    }

    const updateData: any = { updatedBy: userId };
    const revisionData: any = {};

    switch (action) {
      case 'submit_review':
        updateData.status = 'review';
        break;
      case 'approve':
        updateData.status = 'approved';
        updateData.approvedById = userId;
        updateData.approvedAt = new Date();
        break;
      case 'reject':
        updateData.status = 'draft';
        updateData.reviewedById = userId;
        updateData.reviewedAt = new Date();
        updateData.reviewNotes = notes || null;
        break;
      case 'publish':
        updateData.status = 'published';
        updateData.publishedAt = new Date();
        break;
      case 'archive':
        updateData.status = 'archived';
        break;
      case 'draft':
        updateData.status = 'draft';
        break;
      case 'schedule':
        if (!scheduledAt) throw new BadRequestException('scheduledAt required for schedule action');
        updateData.status = 'scheduled';
        updateData.scheduledAt = new Date(scheduledAt);
        break;
      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });

    await this.createRevision(post, userId, notes);

    return updated;
  }

  private async createRevision(post: any, userId: string, changeNotes?: string) {
    const lastRevision = await this.prisma.contentRevision.findFirst({
      where: { postId: post.id },
      orderBy: { version: 'desc' },
    });
    const version = (lastRevision?.version || 0) + 1;

    await this.prisma.contentRevision.create({
      data: {
        postId: post.id,
        version,
        titleAr: post.titleAr,
        titleEn: post.titleEn,
        contentAr: post.contentAr,
        contentEn: post.contentEn,
        excerptAr: post.excerptAr,
        excerptEn: post.excerptEn,
        slug: post.slug,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        ogTitle: post.ogTitle,
        ogDescription: post.ogDescription,
        tags: post.tags,
        status: post.status,
        changeNotes: changeNotes || null,
        createdBy: userId,
      },
    });
  }

  async getRevisions(postId: string) {
    return this.prisma.contentRevision.findMany({
      where: { postId },
      orderBy: { version: 'desc' },
    });
  }

  async getRevision(postId: string, version: number) {
    return this.prisma.contentRevision.findFirst({
      where: { postId, version },
    });
  }

  async restoreRevision(postId: string, version: number, userId: string) {
    const revision = await this.prisma.contentRevision.findFirst({
      where: { postId, version },
    });
    if (!revision) throw new BadRequestException('Revision not found');

    const post = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) throw new BadRequestException('Post not found');

    await this.createRevision(post, userId, `Restored from version ${version}`);

    return this.prisma.blogPost.update({
      where: { id: postId },
      data: {
        titleAr: revision.titleAr || post.titleAr,
        titleEn: revision.titleEn || post.titleEn,
        contentAr: revision.contentAr || post.contentAr,
        contentEn: revision.contentEn || post.contentEn,
        excerptAr: revision.excerptAr || post.excerptAr,
        excerptEn: revision.excerptEn || post.excerptEn,
        slug: revision.slug || post.slug,
        metaTitle: revision.metaTitle || post.metaTitle,
        metaDescription: revision.metaDescription || post.metaDescription,
        ogTitle: revision.ogTitle || post.ogTitle,
        ogDescription: revision.ogDescription || post.ogDescription,
        tags: revision.tags || post.tags,
        updatedBy: userId,
      },
    });
  }
}
