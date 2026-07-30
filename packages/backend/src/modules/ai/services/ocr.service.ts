import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmFactory } from '../providers/llm.factory';
import { AiModelProvider } from '../interfaces/llm-provider.interface';
import * as path from 'path';
import * as fs from 'fs';

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
  language: string;
  processingTimeMs: number;
}

export interface OcrBlock {
  text: string;
  confidence: number;
  type: 'text' | 'table' | 'header' | 'footer';
  boundingBox?: { x: number; y: number; w: number; h: number };
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private tesseract: any = null;
  private tesseractInitialized = false;

  constructor(
    private config: ConfigService,
    private llmFactory: LlmFactory,
  ) {}

  private async getTesseract(): Promise<any> {
    if (!this.tesseractInitialized) {
      try {
        const Tesseract = await import('tesseract.js');
        this.tesseract = Tesseract.default || Tesseract;
        this.tesseractInitialized = true;
      } catch {
        this.logger.warn('tesseract.js not available, OCR will fall back to LLM-based extraction');
        return null;
      }
    }
    return this.tesseract;
  }

  async processImage(imagePath: string, language?: 'ar' | 'en'): Promise<OcrResult> {
    const start = Date.now();
    const tessLang = language === 'ar' ? 'ara+eng' : 'eng';

    const tess = await this.getTesseract();
    if (tess) {
      try {
        const result = await tess.recognize(imagePath, tessLang, {
          logger: (m: any) => m.status === 'recognizing text' && this.logger.debug(`OCR: ${Math.round(m.progress * 100)}%`),
        });
        return {
          text: result.data.text,
          confidence: result.data.confidence / 100,
          blocks: (result.data.blocks || []).map((b: any) => ({
            text: b.text,
            confidence: b.confidence / 100,
            type: b.blockType === 1 ? 'header' : b.blockType === 2 ? 'text' : 'text',
            boundingBox: b.bbox ? { x: b.bbox.x0, y: b.bbox.y0, w: b.bbox.x1 - b.bbox.x0, h: b.bbox.y1 - b.bbox.y0 } : undefined,
          })),
          language: language || 'en',
          processingTimeMs: Date.now() - start,
        };
      } catch (error: any) {
        this.logger.error(`Tesseract OCR failed: ${error.message}, falling back to LLM`);
      }
    }

    return this.llmBasedOcr(imagePath, language);
  }

  private async llmBasedOcr(imagePath: string, language?: 'ar' | 'en'): Promise<OcrResult> {
    const start = Date.now();
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const provider = this.llmFactory.getProvider(AiModelProvider.OPENAI);
      const systemMsg = language === 'ar'
        ? 'أنت نظام تعرّف بصري على المستندات. استخرج كل النصوص من هذه الصورة بدقة. حافظ على تنسيق الجداول والأرقام.'
        : 'You are an OCR document processing system. Extract all text from this image accurately. Preserve table formatting and numbers.';
      const userMsg = `[IMAGE: data:${mimeType};base64,${base64.slice(0, 50)}...]\nExtract all text from this laboratory report image:`;

      const result = await provider.generateChat([
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ], { temperature: 0.1, maxTokens: 4096 });

      return {
        text: result.content,
        confidence: 0.8,
        blocks: [{ text: result.content, confidence: 0.8, type: 'text' }],
        language: language || 'en',
        processingTimeMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`LLM OCR failed: ${error.message}`);
      return { text: '', confidence: 0, blocks: [], language: language || 'en', processingTimeMs: Date.now() - start };
    }
  }

  async processPdf(pdfPath: string, language?: 'ar' | 'en'): Promise<OcrResult> {
    try {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(pdfBuffer);
      return {
        text: data.text,
        confidence: 0.9,
        blocks: [{ text: data.text, confidence: 0.9, type: 'text' }],
        language: language || 'en',
        processingTimeMs: 0,
      };
    } catch (error: any) {
      this.logger.error(`PDF parse failed: ${error.message}, falling back to image OCR`);
      return this.processImage(pdfPath, language);
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.bmp': 'image/bmp', '.webp': 'image/webp',
      '.pdf': 'application/pdf', '.tiff': 'image/tiff',
    };
    return types[ext] || 'image/png';
  }
}
