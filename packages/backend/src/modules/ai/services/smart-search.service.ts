import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { EmbeddingsService } from '../rag/embeddings.service';
import { LlmFactory } from '../providers/llm.factory';

export interface SmartSearchResult {
  id: string;
  type: 'test' | 'package' | 'knowledge' | 'patient' | 'doctor' | 'appointment' | 'result';
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  score: number;
  url?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SmartSearchService {
  private readonly logger = new Logger(SmartSearchService.name);

  constructor(
    private prisma: PrismaService,
    private rag: RagService,
    private embeddings: EmbeddingsService,
    private llmFactory: LlmFactory,
  ) {}

  async search(
    query: string,
    options?: {
      language?: 'ar' | 'en';
      role?: string;
      types?: string[];
      userId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: SmartSearchResult[]; total: number; query: string; suggestions?: string[] }> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 50);
    const types = options?.types || ['test', 'package', 'knowledge'];
    const results: SmartSearchResult[] = [];

    const normalizedQuery = query.toLowerCase().trim();

    if (types.includes('knowledge')) {
      const knowledgeResults = await this.searchKnowledge(normalizedQuery, options?.language);
      results.push(...knowledgeResults);
    }

    if (types.includes('test')) {
      const testResults = await this.searchTests(normalizedQuery, options?.language);
      results.push(...testResults);
    }

    if (types.includes('package')) {
      const packageResults = await this.searchPackages(normalizedQuery, options?.language);
      results.push(...packageResults);
    }

    if (types.includes('patient') && options?.role && ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(options.role)) {
      const patientResults = await this.searchPatients(normalizedQuery);
      results.push(...patientResults);
    }

    if (types.includes('doctor')) {
      const doctorResults = await this.searchDoctors(normalizedQuery, options?.language);
      results.push(...doctorResults);
    }

    if (types.includes('result') && options?.userId) {
      const resultResults = await this.searchResults(normalizedQuery, options.userId);
      results.push(...resultResults);
    }

    const scored = this.scoreResults(normalizedQuery, results);
    const sorted = scored.sort((a, b) => b.score - a.score);

    const total = sorted.length;
    const paginated = sorted.slice((page - 1) * limit, page * limit);

    const suggestions = await this.generateSearchSuggestions(normalizedQuery, options?.language);

    return { items: paginated, total, query, suggestions };
  }

  private async searchKnowledge(query: string, language?: 'ar' | 'en'): Promise<SmartSearchResult[]> {
    try {
      const context = await this.rag.retrieveRelevantContext(query, { language });
      return context.chunks.map(c => ({
        id: c.knowledgeBaseId,
        type: 'knowledge' as const,
        title: c.metadata.title,
        titleAr: c.metadata.titleAr,
        description: language === 'ar' ? (c.contentAr || c.content).slice(0, 200) : c.content.slice(0, 200),
        descriptionAr: c.contentAr?.slice(0, 200),
        score: c.score,
        url: `/knowledge-base/${c.knowledgeBaseId}`,
        metadata: { documentType: c.metadata.documentType, category: c.metadata.category, tags: c.metadata.tags },
      }));
    } catch {
      return [];
    }
  }

  private async searchTests(query: string, _language?: 'ar' | 'en'): Promise<SmartSearchResult[]> {
    try {
      const tests = await (this.prisma as any).labTest.findMany({
        where: {
          OR: [
            { nameEn: { contains: query, mode: 'insensitive' } },
            { nameAr: { contains: query, mode: 'insensitive' } },
            { descriptionEn: { contains: query, mode: 'insensitive' } },
            { descriptionAr: { contains: query, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: { id: true, nameEn: true, nameAr: true, descriptionEn: true, descriptionAr: true, categoryId: true, price: true },
        take: 10,
      });
      return tests.map((t: any) => ({
        id: t.id,
        type: 'test' as const,
        title: t.nameEn,
        titleAr: t.nameAr,
        description: t.descriptionEn?.slice(0, 200) || '',
        descriptionAr: t.descriptionAr?.slice(0, 200) || '',
        score: 0.9,
        url: `/tests/${t.id}`,
        metadata: { categoryId: t.categoryId, price: t.price },
      }));
    } catch {
      return [];
    }
  }

  private async searchPackages(query: string, _language?: 'ar' | 'en'): Promise<SmartSearchResult[]> {
    try {
      const packages = await (this.prisma as any).testPackage.findMany({
        where: {
          OR: [
            { nameEn: { contains: query, mode: 'insensitive' } },
            { nameAr: { contains: query, mode: 'insensitive' } },
            { descriptionEn: { contains: query, mode: 'insensitive' } },
            { descriptionAr: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, nameEn: true, nameAr: true, descriptionEn: true, descriptionAr: true, originalPrice: true, packagePrice: true, categoryId: true },
        take: 10,
      });
      return packages.map((p: any) => ({
        id: p.id,
        type: 'package' as const,
        title: p.nameEn,
        titleAr: p.nameAr,
        description: p.descriptionEn?.slice(0, 200) || '',
        descriptionAr: p.descriptionAr?.slice(0, 200) || '',
        score: 0.85,
        url: `/packages/${p.id}`,
        metadata: { categoryId: p.categoryId, originalPrice: p.originalPrice, packagePrice: p.packagePrice },
      }));
    } catch {
      return [];
    }
  }

  private async searchPatients(query: string): Promise<SmartSearchResult[]> {
    try {
      const patients = await (this.prisma as any).patient.findMany({
        where: {
          OR: [
            { firstNameEn: { contains: query, mode: 'insensitive' } },
            { lastNameEn: { contains: query, mode: 'insensitive' } },
            { firstNameAr: { contains: query, mode: 'insensitive' } },
            { lastNameAr: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: { id: true, firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true, email: true, phone: true },
        take: 10,
      });
      return patients.map((p: any) => {
        const nameEn = [p.firstNameEn, p.lastNameEn].filter(Boolean).join(' ') || 'Unknown';
        const nameAr = [p.firstNameAr, p.lastNameAr].filter(Boolean).join(' ') || 'غير معروف';
        return {
          id: p.id,
          type: 'patient' as const,
          title: nameEn,
          titleAr: nameAr,
          description: `${p.email} | ${p.phone || ''}`,
          score: 0.7,
          url: `/admin/patients/${p.id}`,
          metadata: { email: p.email, phone: p.phone },
        };
      });
    } catch {
      return [];
    }
  }

  private async searchDoctors(query: string, _language?: 'ar' | 'en'): Promise<SmartSearchResult[]> {
    try {
      const doctors = await (this.prisma as any).doctorProfile.findMany({
        where: {
          OR: [
            { specialtyEn: { contains: query, mode: 'insensitive' } },
            { specialtyAr: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: { include: { profile: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true, email: true } } } },
        },
        take: 10,
      });
      return doctors.map((d: any) => {
        const p = d.user?.profile;
        const nameEn = [p?.firstNameEn, p?.lastNameEn].filter(Boolean).join(' ') || d.user?.email || 'Unknown';
        const nameAr = [p?.firstNameAr, p?.lastNameAr].filter(Boolean).join(' ') || 'غير معروف';
        return {
          id: d.id,
          type: 'doctor' as const,
          title: nameEn,
          titleAr: nameAr,
          description: d.specialtyEn || d.specialtyAr || '',
          score: 0.75,
          url: `/doctors/${d.id}`,
          metadata: { specialty: d.specialtyEn || d.specialtyAr, email: d.user?.email },
        };
      });
    } catch {
      return [];
    }
  }

  private async searchResults(query: string, userId: string): Promise<SmartSearchResult[]> {
    try {
      const results = await (this.prisma as any).report.findMany({
        where: {
          patientId: userId,
          OR: [
            { reportNumber: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: { id: true, reportNumber: true, status: true, createdAt: true },
        take: 10,
      });
      return results.map((r: any) => ({
        id: r.id,
        type: 'result' as const,
        title: `Report ${r.reportNumber}`,
        description: `Status: ${r.status} | ${r.createdAt.toISOString().split('T')[0]}`,
        score: 0.6,
        url: `/patient/results/${r.id}`,
        metadata: { status: r.status, date: r.createdAt.toISOString() },
      }));
    } catch {
      return [];
    }
  }

  private scoreResults(query: string, results: SmartSearchResult[]): SmartSearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    return results.map(r => {
      const titleLower = (r.title + ' ' + (r.titleAr || '')).toLowerCase();
      const descLower = (r.description + ' ' + (r.descriptionAr || '')).toLowerCase();
      const exactMatch = titleLower.includes(query) ? 0.2 : 0;
      const termMatches = queryTerms.filter(t => titleLower.includes(t)).length / queryTerms.length * 0.15;
      const descTermMatches = queryTerms.filter(t => descLower.includes(t)).length / queryTerms.length * 0.05;
      const score = r.score + exactMatch + termMatches + descTermMatches;
      return { ...r, score: Math.min(score, 1.0) };
    });
  }

  private async generateSearchSuggestions(query: string, _language?: 'ar' | 'en'): Promise<string[]> {
    if (query.length < 2) return [];
    try {
      const provider = this.llmFactory.getProvider();
      const result = await provider.generateChat([
        { role: 'system', content: 'You are a search suggestion generator for a medical laboratory. Generate 4 search suggestions related to the user\'s query. Return as a JSON array of strings.' },
        { role: 'user', content: `Query: "${query}". Generate 4 search suggestions.` },
      ], { temperature: 0.3, maxTokens: 200 });
      try {
        return JSON.parse(result.content);
      } catch {
        return result.content.split('\n').filter(s => s.trim()).slice(0, 4);
      }
    } catch {
      return [];
    }
  }
}
