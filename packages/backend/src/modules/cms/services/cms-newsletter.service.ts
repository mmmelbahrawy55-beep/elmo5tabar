import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

@Injectable()
export class CmsNewsletterService {
  private readonly logger = new Logger(CmsNewsletterService.name);

  constructor(private prisma: PrismaService) {}

  async subscribe(email: string, data?: { nameAr?: string; nameEn?: string; language?: string; interests?: string[]; source?: string }) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) {
        return this.prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true, unsubscribedAt: null, updatedAt: new Date() },
        });
      }
      return existing;
    }
    return this.prisma.newsletterSubscriber.create({
      data: {
        email,
        nameAr: data?.nameAr,
        nameEn: data?.nameEn,
        language: data?.language || 'ar',
        interests: data?.interests || [],
        source: data?.source || 'website',
        confirmedAt: new Date(),
      },
    });
  }

  async unsubscribe(email: string, reason?: string) {
    const sub = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!sub) throw new BadRequestException('Subscriber not found');
    return this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date(), unsubscribeReason: reason },
    });
  }

  async createCampaign(data: {
    subjectAr: string; subjectEn?: string; previewTextAr?: string; previewTextEn?: string;
    contentAr?: string; contentEn?: string; postIds?: string[]; categoryIds?: string[];
    language?: string; scheduledAt?: string; createdBy?: string;
  }) {
    return this.prisma.newsletterCampaign.create({
      data: {
        subjectAr: data.subjectAr, subjectEn: data.subjectEn,
        previewTextAr: data.previewTextAr, previewTextEn: data.previewTextEn,
        contentAr: data.contentAr, contentEn: data.contentEn,
        postIds: data.postIds || [], categoryIds: data.categoryIds || [],
        language: data.language || 'both',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.scheduledAt ? 'scheduled' : 'draft',
        createdBy: data.createdBy,
      },
    });
  }

  async getCampaigns(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.newsletterCampaign.findMany({
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.newsletterCampaign.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sendCampaign(id: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) throw new BadRequestException('Campaign not found');

    const where: any = { isActive: true };
    if (campaign.language !== 'both') where.language = campaign.language;
    if (campaign.categoryIds.length > 0) where.interests = { hasSome: campaign.categoryIds };

    const subscribers = await this.prisma.newsletterSubscriber.findMany({ where });
    const recipientCount = subscribers.length;

    await this.prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'sending', recipientCount, sentAt: new Date() },
    });

    this.logger.log(`Campaign ${id} sent to ${recipientCount} subscribers`);
    return { campaignId: id, recipientCount };
  }

  async getSubscribers(page = 1, limit = 20, isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    const [items, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
