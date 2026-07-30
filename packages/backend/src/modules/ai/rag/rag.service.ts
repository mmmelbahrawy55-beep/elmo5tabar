import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { DocumentProcessorService, ProcessedChunk } from './document-processor.service';
import { AiModelProvider } from '../interfaces/llm-provider.interface';
import { VectorSearchResult } from '../interfaces/vector-store.interface';

export interface RagContext {
  chunks: VectorSearchResult[];
  combinedContext: string;
  combinedContextAr: string;
  sourceCount: number;
  averageScore: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly TOP_K = 8;
  private readonly MIN_SCORE = 0.65;
  private readonly RERANK_TOP_K = 5;

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private documentProcessor: DocumentProcessorService,
    private config: ConfigService,
  ) {}

  async retrieveRelevantContext(
    query: string,
    options?: {
      language?: 'ar' | 'en';
      documentType?: string;
      topK?: number;
      minScore?: number;
      provider?: AiModelProvider;
    },
  ): Promise<RagContext> {
    const queryEmbedding = await this.embeddings.generateEmbedding(query, options?.provider);
    const topK = options?.topK || this.TOP_K;
    const minScore = options?.minScore || this.MIN_SCORE;

    const results: VectorSearchResult[] = [];

    const rawResults = await this.prisma.$queryRaw<any[]>`
      SELECT
        c.id, c."knowledgeBaseId", c.content, c."contentAr", c."chunkIndex",
        c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance,
        kb.title, kb."titleAr", kb."documentType", kb.category, kb.tags, kb.source
      FROM ai_knowledge_chunks c
      JOIN ai_knowledge_base kb ON kb.id = c."knowledgeBaseId"
      WHERE kb."isActive" = true
        AND c.embedding IS NOT NULL
        ${options?.documentType ? `AND kb."documentType" = '${options.documentType}'` : ''}
      ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${topK * 2}
    `;

    for (const row of rawResults || []) {
      const score = 1 - (parseFloat(row.distance) || 0);
      if (score < minScore) continue;
      results.push({
        id: row.id,
        knowledgeBaseId: row.knowledgeBaseId,
        content: row.content,
        contentAr: row.contentAr || undefined,
        score,
        metadata: {
          title: row.title,
          titleAr: row.titleAr || undefined,
          documentType: row.documentType,
          category: row.category,
          tags: row.tags || [],
          source: row.source,
        },
      });
    }

    const reranked = await this.rerank(query, results, options?.language);

    const combined = reranked
      .map(r => options?.language === 'ar' ? (r.contentAr || r.content) : r.content)
      .join('\n\n---\n\n');
    const combinedAr = reranked
      .map(r => r.contentAr || r.content)
      .join('\n\n---\n\n');

    return {
      chunks: reranked,
      combinedContext: combined,
      combinedContextAr: combinedAr,
      sourceCount: reranked.length,
      averageScore: reranked.length > 0
        ? reranked.reduce((s, r) => s + r.score, 0) / reranked.length
        : 0,
    };
  }

  private async rerank(
    query: string,
    results: VectorSearchResult[],
    language?: 'ar' | 'en',
  ): Promise<VectorSearchResult[]> {
    if (results.length <= this.RERANK_TOP_K) return results;

    const scored = results.map(r => {
      const content = language === 'ar' ? (r.contentAr || r.content) : r.content;
      const queryTerms = query.toLowerCase().split(/\s+/);
      const contentLower = content.toLowerCase();
      const termMatchCount = queryTerms.filter(t => contentLower.includes(t)).length;
      const termScore = termMatchCount / queryTerms.length;
      const exactPhraseScore = contentLower.includes(query.toLowerCase()) ? 0.15 : 0;
      const finalScore = r.score * 0.6 + termScore * 0.25 + exactPhraseScore;
      return { ...r, score: finalScore };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, this.RERANK_TOP_K);
  }

  async storeChunks(
    knowledgeBaseId: string,
    chunks: ProcessedChunk[],
    provider?: AiModelProvider,
  ): Promise<void> {
    for (const chunk of chunks) {
      try {
        const embedding = await this.embeddings.generateEmbedding(chunk.content, provider);
        await this.prisma.$executeRaw`
          INSERT INTO ai_knowledge_chunks (id, "knowledgeBaseId", content, "contentAr", "chunkIndex", "tokenCount", embedding, model)
          VALUES (${chunk.id}::uuid, ${knowledgeBaseId}::uuid, ${chunk.content}, ${chunk.contentAr}, ${chunk.chunkIndex}, ${chunk.tokenCount}, ${JSON.stringify(embedding)}::vector, ${provider || 'OPENAI'})
          ON CONFLICT (id) DO UPDATE SET embedding = ${JSON.stringify(embedding)}::vector, model = ${provider || 'OPENAI'}
        `;
      } catch (error: any) {
        this.logger.error(`Failed to store chunk ${chunk.chunkIndex}: ${error.message}`);
      }
    }
  }

  async deleteChunks(knowledgeBaseId: string): Promise<void> {
    await this.prisma.aiKnowledgeChunk.deleteMany({
      where: { knowledgeBaseId },
    });
  }

  async reindexAll(provider?: AiModelProvider): Promise<{ processed: number; failed: number }> {
    const docs = await this.prisma.aiKnowledgeBase.findMany({
      where: { isActive: true },
      select: { id: true, content: true, contentAr: true, documentType: true, title: true, titleAr: true, category: true, tags: true, source: true },
    });

    let processed = 0;
    let failed = 0;

    for (const doc of docs) {
      try {
        await this.deleteChunks(doc.id);
        const chunks = this.documentProcessor.chunkDocument(
          doc.content,
          doc.contentAr || undefined,
          { title: doc.title, titleAr: doc.titleAr, documentType: doc.documentType, category: doc.category, tags: doc.tags, source: doc.source },
        );
        await this.storeChunks(doc.id, chunks, provider);
        processed++;
      } catch (error: any) {
        this.logger.error(`Reindex failed for ${doc.id}: ${error.message}`);
        failed++;
      }
    }

    return { processed, failed };
  }
}
