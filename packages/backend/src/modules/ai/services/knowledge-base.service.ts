import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { DocumentProcessorService } from '../rag/document-processor.service';
import { EmbeddingsService } from '../rag/embeddings.service';
import { AiModelProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private prisma: PrismaService,
    private rag: RagService,
    private documentProcessor: DocumentProcessorService,
    private embeddings: EmbeddingsService,
  ) {}

  async create(data: {
    title: string; titleAr?: string; content: string; contentAr?: string;
    summary?: string; summaryAr?: string; documentType: string; category?: string;
    tags?: string[]; language?: string; source?: string; authorId?: string;
  }) {
    const doc = await this.prisma.aiKnowledgeBase.create({
      data: {
        title: data.title,
        titleAr: data.titleAr,
        content: data.content,
        contentAr: data.contentAr,
        summary: data.summary,
        summaryAr: data.summaryAr,
        documentType: data.documentType as any,
        category: data.category,
        tags: data.tags || [],
        language: data.language || 'both',
        source: data.source || 'manual',
        authorId: data.authorId,
      },
    });

    try {
      const chunks = this.documentProcessor.chunkDocument(
        data.content, data.contentAr,
        { title: data.title, titleAr: data.titleAr, documentType: data.documentType, category: data.category, tags: data.tags },
      );
      await this.rag.storeChunks(doc.id, chunks);
    } catch (error: any) {
      this.logger.error(`Failed to index knowledge base entry ${doc.id}: ${error.message}`);
    }

    return doc;
  }

  async findAll(filters?: {
    documentType?: string; category?: string; isActive?: boolean;
    search?: string; page?: number; limit?: number; language?: string;
  }) {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100);
    const where: any = { deletedAt: null };
    if (filters?.documentType) where.documentType = filters.documentType;
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.aiKnowledgeBase.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true, title: true, titleAr: true, summary: true, summaryAr: true,
          documentType: true, category: true, tags: true, language: true,
          source: true, isActive: true, viewCount: true, helpfulCount: true,
          version: true, createdAt: true, updatedAt: true,
        },
      }),
      this.prisma.aiKnowledgeBase.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const doc = await this.prisma.aiKnowledgeBase.findFirst({
      where: { id, deletedAt: null },
      include: {
        chunks: { select: { id: true, content: true, contentAr: true, chunkIndex: true, tokenCount: true }, orderBy: { chunkIndex: 'asc' } },
        relatedFrom: { include: { target: { select: { id: true, title: true, titleAr: true, documentType: true } } } },
        relatedTo: { include: { source: { select: { id: true, title: true, titleAr: true, documentType: true } } } },
      },
    });
    if (!doc) throw new NotFoundException('Knowledge base entry not found');

    await this.prisma.aiKnowledgeBase.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return doc;
  }

  async update(id: string, data: {
    title?: string; titleAr?: string; content?: string; contentAr?: string;
    summary?: string; summaryAr?: string; category?: string; tags?: string[];
    isActive?: boolean;
  }) {
    const existing = await this.prisma.aiKnowledgeBase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Knowledge base entry not found');

    const updateData: any = { ...data, version: { increment: 1 } };
    const doc = await this.prisma.aiKnowledgeBase.update({ where: { id }, data: updateData });

    if (data.content || data.contentAr) {
      try {
        await this.rag.deleteChunks(id);
        const content = data.content || existing.content;
        const contentAr = data.contentAr || existing.contentAr;
        const chunks = this.documentProcessor.chunkDocument(
          content, contentAr || undefined,
          { title: data.title || existing.title, titleAr: data.titleAr || existing.titleAr, documentType: existing.documentType, category: data.category || existing.category, tags: data.tags || existing.tags },
        );
        await this.rag.storeChunks(id, chunks);
      } catch (error: any) {
        this.logger.error(`Failed to reindex knowledge base entry ${id}: ${error.message}`);
      }
    }

    return doc;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.aiKnowledgeBase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Knowledge base entry not found');
    await this.prisma.aiKnowledgeBase.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.rag.deleteChunks(id);
  }

  async markHelpful(id: string): Promise<void> {
    await this.prisma.aiKnowledgeBase.update({ where: { id }, data: { helpfulCount: { increment: 1 } } });
  }

  async createRelation(sourceId: string, targetId: string, relationType: string, weight?: number) {
    return this.prisma.aiKnowledgeRelation.create({
      data: { sourceId, targetId, relationType, weight: weight || 1.0 },
    });
  }

  async getRelated(id: string, relationType?: string) {
    const where: any = { OR: [{ sourceId: id }, { targetId: id }] };
    if (relationType) where.relationType = relationType;
    return this.prisma.aiKnowledgeRelation.findMany({
      where,
      include: {
        source: { select: { id: true, title: true, titleAr: true, documentType: true } },
        target: { select: { id: true, title: true, titleAr: true, documentType: true } },
      },
    });
  }

  async search(query: string, language?: 'ar' | 'en', documentType?: string) {
    const context = await this.rag.retrieveRelevantContext(query, { language, documentType });
    return context.chunks.map(c => ({
      id: c.knowledgeBaseId,
      title: c.metadata.title,
      titleAr: c.metadata.titleAr,
      content: language === 'ar' ? (c.contentAr || c.content) : c.content,
      contentAr: c.contentAr,
      documentType: c.metadata.documentType,
      category: c.metadata.category,
      relevance: c.score,
      source: c.metadata.source,
    }));
  }
}
