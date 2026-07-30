import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ProcessedChunk {
  id: string;
  content: string;
  contentAr?: string;
  chunkIndex: number;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  private readonly CHUNK_SIZE = 512;
  private readonly CHUNK_OVERLAP = 64;

  chunkDocument(
    content: string,
    contentAr: string | undefined,
    metadata: Record<string, unknown>,
  ): ProcessedChunk[] {
    const chunks: ProcessedChunk[] = [];
    const sentences = this.splitIntoSentences(content);
    const sentencesAr = contentAr ? this.splitIntoSentences(contentAr) : [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const tokens = this.estimateTokens(sentence);

      if (currentTokens + tokens > this.CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(this.createChunk(currentChunk, chunks.length, sentencesAr, metadata));
        const overlap = this.getOverlap(currentChunk);
        currentChunk = [...overlap];
        currentTokens = overlap.reduce((s, c) => s + this.estimateTokens(c), 0);
      }

      currentChunk.push(sentence);
      currentTokens += tokens;
    }

    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(currentChunk, chunks.length, sentencesAr, metadata));
    }

    return chunks;
  }

  private createChunk(
    sentences: string[],
    index: number,
    allSentencesAr: string[],
    metadata: Record<string, unknown>,
  ): ProcessedChunk {
    const content = sentences.join(' ');
    const arStart = Math.floor((index * allSentencesAr.length) / Math.max(1, Math.ceil(index + 1)));
    const arEnd = Math.floor(((index + 1) * allSentencesAr.length) / Math.max(1, Math.ceil(index + 1)));
    const contentAr = allSentencesAr.length > 0 ? allSentencesAr.slice(arStart, arEnd).join(' ') : undefined;

    return {
      id: crypto.randomUUID(),
      content,
      contentAr,
      chunkIndex: index,
      tokenCount: this.estimateTokens(content),
      metadata,
    };
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private getOverlap(chunk: string[]): string[] {
    const overlap: string[] = [];
    let tokens = 0;
    for (let i = chunk.length - 1; i >= 0; i--) {
      const t = this.estimateTokens(chunk[i]);
      if (tokens + t > this.CHUNK_OVERLAP) break;
      overlap.unshift(chunk[i]);
      tokens += t;
    }
    return overlap;
  }

  extractTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
