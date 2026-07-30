import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmFactory } from '../providers/llm.factory';
import { AiModelProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private embeddingDimensions: number;

  constructor(
    private llmFactory: LlmFactory,
    private config: ConfigService,
  ) {
    this.embeddingDimensions = this.config.get<number>('AI_EMBEDDING_DIMENSIONS', 1536);
  }

  async generateEmbedding(text: string, provider?: AiModelProvider): Promise<number[]> {
    const result = await this.llmFactory.getProvider(provider).generateEmbeddings([text]);
    if (!result.embeddings?.[0]) {
      throw new Error('Embedding generation returned empty result');
    }
    return result.embeddings[0];
  }

  async generateEmbeddings(texts: string[], provider?: AiModelProvider): Promise<number[][]> {
    if (texts.length === 0) return [];
    const result = await this.llmFactory.getProvider(provider).generateEmbeddings(texts);
    return result.embeddings;
  }

  async generateWithFallback(text: string): Promise<number[]> {
    const providers = [AiModelProvider.OPENAI, AiModelProvider.GEMINI, AiModelProvider.AZURE_OPENAI];
    for (const provider of providers) {
      try {
        return await this.generateEmbedding(text, provider);
      } catch (error: any) {
        this.logger.warn(`Embedding failed for ${provider}: ${error.message}`);
      }
    }
    throw new Error('All embedding providers failed');
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  getDimensions(): number {
    return this.embeddingDimensions;
  }
}
