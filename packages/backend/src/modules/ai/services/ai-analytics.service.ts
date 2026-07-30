import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

export interface AiDashboardStats {
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  avgLatencyMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
  estimatedCost: number;
  topQueries: { query: string; count: number }[];
  providerBreakdown: { provider: string; count: number }[];
  typeBreakdown: { documentType: string; count: number }[];
  dailyStats: { date: string; conversations: number; messages: number }[];
  satisfactionRate: number;
  feedbackCount: { thumbsUp: number; thumbsDown: number; total: number };
}

export interface AiPerformanceReport {
  period: { from: string; to: string };
  summary: AiDashboardStats;
  providerPerformance: {
    provider: string;
    avgLatency: number;
    totalCalls: number;
    errorRate: number;
    avgTokens: number;
  }[];
  hourlyDistribution: { hour: number; count: number }[];
  topUsers: { userId: string; userRole: string; count: number }[];
}

@Injectable()
export class AiAnalyticsService {
  private readonly logger = new Logger(AiAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats(days = 30): Promise<AiDashboardStats> {
    const since = new Date(Date.now() - days * 86400000);

    const [conversations, messages, uniqueUsers, topQueriesRaw, providerRaw, typeRaw, dailyRaw, feedback] =
      await Promise.all([
        this.prisma.aiConversation.count({ where: { createdAt: { gte: since } } }),
        this.prisma.aiMessage.count({ where: { createdAt: { gte: since } } }),
        this.prisma.aiAnalytics.groupBy({ by: ['userId'], where: { createdAt: { gte: since } }, _count: { id: true } }),
        this.prisma.aiAnalytics.groupBy({
          by: ['query'], where: { createdAt: { gte: since } },
          _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10,
        }),
        this.prisma.aiAnalytics.groupBy({
          by: ['provider'], where: { createdAt: { gte: since } },
          _count: { id: true }, _avg: { latencyMs: true },
        }),
        this.prisma.aiAnalytics.groupBy({
          by: ['documentType'], where: { createdAt: { gte: since }, documentType: { not: null } },
          _count: { id: true },
        }),
        this.prisma.aiAnalytics.groupBy({
          by: ['createdAt'], where: { createdAt: { gte: since } },
          _count: { id: true },
        }),
        this.prisma.aiMessage.groupBy({
          by: ['feedback'], where: { createdAt: { gte: since }, feedback: { not: null } },
          _count: { id: true },
        }),
      ]);

    const analyticsData = await this.prisma.aiAnalytics.aggregate({
      where: { createdAt: { gte: since } },
      _avg: { latencyMs: true },
      _sum: { tokensIn: true, tokensOut: true, costUsd: true },
    });

    const dailyStatsMap = new Map<string, { conversations: Set<string>; messages: number }>();
    for (const entry of dailyRaw) {
      const date = entry.createdAt.toISOString().split('T')[0];
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, { conversations: new Set(), messages: 0 });
      }
    }

    return {
      totalConversations: conversations,
      totalMessages: messages,
      uniqueUsers: uniqueUsers.length,
      avgLatencyMs: Math.round(analyticsData._avg.latencyMs || 0),
      totalTokensIn: analyticsData._sum.tokensIn || 0,
      totalTokensOut: analyticsData._sum.tokensOut || 0,
      estimatedCost: Math.round((analyticsData._sum.costUsd || 0) * 100) / 100,
      topQueries: topQueriesRaw.map(q => ({ query: q.query, count: q._count.id })),
      providerBreakdown: providerRaw.map(p => ({ provider: p.provider, count: p._count.id })),
      typeBreakdown: typeRaw.map(t => ({ documentType: t.documentType || 'unknown', count: t._count.id })),
      dailyStats: Array.from(dailyStatsMap.entries()).map(([date, data]) => ({
        date, conversations: data.conversations.size, messages: data.messages,
      })),
      satisfactionRate: this.calculateSatisfaction(feedback),
      feedbackCount: {
        thumbsUp: feedback.find(f => f.feedback === 'THUMBS_UP' || f.feedback === 'HELPFUL' || f.feedback === 'ACCURATE')?._count.id || 0,
        thumbsDown: feedback.find(f => f.feedback === 'THUMBS_DOWN' || f.feedback === 'NOT_HELPFUL' || f.feedback === 'INACCURATE')?._count.id || 0,
        total: feedback.reduce((s, f) => s + f._count.id, 0),
      },
    };
  }

  async getPerformanceReport(from: string, to: string): Promise<AiPerformanceReport> {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const analytics = await this.prisma.aiAnalytics.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await this.getDashboardStats(
      Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000),
    );

    const providerMap = new Map<string, { latencies: number[]; calls: number; errors: number; tokens: number[] }>();
    const hourlyMap = new Map<number, number>();
    const userMap = new Map<string, { role: string; count: number }>();

    for (const entry of analytics) {
      if (entry.provider) {
        if (!providerMap.has(entry.provider)) {
          providerMap.set(entry.provider, { latencies: [], calls: 0, errors: 0, tokens: [] });
        }
        const p = providerMap.get(entry.provider)!;
        p.calls++;
        if (entry.latencyMs) p.latencies.push(entry.latencyMs);
        p.tokens.push((entry.tokensIn || 0) + (entry.tokensOut || 0));
      }
      const hour = entry.createdAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      if (entry.userId && entry.userRole) {
        userMap.set(entry.userId, { role: entry.userRole, count: (userMap.get(entry.userId)?.count || 0) + 1 });
      }
    }

    return {
      period: { from, to },
      summary,
      providerPerformance: Array.from(providerMap.entries()).map(([name, data]) => ({
        provider: name,
        avgLatency: Math.round(data.latencies.reduce((s, l) => s + l, 0) / Math.max(1, data.latencies.length)),
        totalCalls: data.calls,
        errorRate: data.errors / Math.max(1, data.calls),
        avgTokens: Math.round(data.tokens.reduce((s, t) => s + t, 0) / Math.max(1, data.tokens.length)),
      })),
      hourlyDistribution: Array.from(hourlyMap.entries()).map(([hour, count]) => ({ hour, count })),
      topUsers: Array.from(userMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .map(([userId, data]) => ({ userId, userRole: data.role, count: data.count })),
    };
  }

  private calculateSatisfaction(feedback: any[]): number {
    const positive = feedback
      .filter(f => ['THUMBS_UP', 'HELPFUL', 'ACCURATE'].includes(f.feedback))
      .reduce((s, f) => s + f._count.id, 0);
    const total = feedback.reduce((s, f) => s + f._count.id, 0);
    return total > 0 ? Math.round((positive / total) * 100) : 0;
  }

  async logFeedback(messageId: string, userId: string, rating: string, comment?: string) {
    return this.prisma.aiFeedback.create({
      data: {
        messageId,
        userId,
        rating: rating as any,
        comment,
      },
    });
  }

  async getFeedbackList(page = 1, limit = 20, resolved?: boolean) {
    const where: any = {};
    if (resolved !== undefined) where.isResolved = resolved;
    const [items, total] = await Promise.all([
      this.prisma.aiFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { message: { select: { content: true } } },
      }),
      this.prisma.aiFeedback.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveFeedback(id: string, resolvedBy: string) {
    return this.prisma.aiFeedback.update({
      where: { id },
      data: { isResolved: true, resolvedById: resolvedBy, resolvedAt: new Date() },
    });
  }
}
