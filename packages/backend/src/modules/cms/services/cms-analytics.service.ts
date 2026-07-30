import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

export interface CmsDashboardStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  totalSubscribers: number;
  postsByStatus: { status: string; count: number }[];
  postsByType: { type: string; count: number }[];
  topViewed: { id: string; title: string; views: number }[];
  viewsByDay: { date: string; views: number }[];
  commentsByDay: { date: string; count: number }[];
  subscribersByDay: { date: string; count: number }[];
  recentPosts: any[];
}

@Injectable()
export class CmsAnalyticsService {
  private readonly logger = new Logger(CmsAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard(days = 30): Promise<CmsDashboardStats> {
    const since = new Date(Date.now() - days * 86400000);

    const [totalPosts, totalViews, totalComments, totalSubscribers, statusGroup, typeGroup, topViewed, dailyViews, dailyComments, subscriberGrowth, recentPosts] = await Promise.all([
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
      this.prisma.blogPost.aggregate({ where: { deletedAt: null }, _sum: { viewCount: true } }),
      this.prisma.contentComment.count({ where: { deletedAt: null, isApproved: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.blogPost.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { id: true } }),
      this.prisma.blogPost.groupBy({ by: ['contentType'], where: { deletedAt: null }, _count: { id: true } }),
      this.prisma.blogPost.findMany({
        where: { deletedAt: null, status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, titleAr: true, titleEn: true, viewCount: true },
      }),
      this.prisma.contentAnalytics.groupBy({
        by: ['date'],
        where: { date: { gte: since } },
        _sum: { views: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.contentComment.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: since }, isApproved: true },
        _count: { id: true },
      }),
      this.prisma.newsletterSubscriber.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.blogPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, titleAr: true, titleEn: true, contentType: true, status: true, viewCount: true, createdAt: true, publishedAt: true },
      }),
    ]);

    return {
      totalPosts,
      totalViews: totalViews._sum.viewCount || 0,
      totalComments,
      totalSubscribers,
      postsByStatus: statusGroup.map(s => ({ status: s.status, count: s._count.id })),
      postsByType: typeGroup.map(t => ({ type: t.contentType, count: t._count.id })),
      topViewed: topViewed.map(p => ({
        id: p.id, title: p.titleAr || p.titleEn || '', views: p.viewCount,
      })),
      viewsByDay: dailyViews.map(d => ({ date: d.date.toISOString().split('T')[0], views: d._sum.views || 0 })),
      commentsByDay: dailyComments.map(d => ({ date: d.createdAt.toISOString().split('T')[0], count: d._count.id })),
      subscribersByDay: subscriberGrowth.map(d => ({ date: d.createdAt.toISOString().split('T')[0], count: d._count.id })),
      recentPosts: recentPosts.map(p => ({
        ...p, title: p.titleAr || p.titleEn,
      })),
    };
  }

  async trackView(postId: string, ip?: string, country?: string, source?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.blogPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    await this.prisma.contentAnalytics.upsert({
      where: { postId_date: { postId, date: today } },
      create: { postId, date: today, views: 1, uniqueViews: 1, source },
      update: { views: { increment: 1 } },
    });
  }

  async trackShare(postId: string) {
    await this.prisma.blogPost.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });
  }
}
