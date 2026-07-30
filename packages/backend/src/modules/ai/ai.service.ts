import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { ConversationService } from './services/conversation.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { SmartSearchService } from './services/smart-search.service';
import { OcrService } from './services/ocr.service';
import { RagService } from './rag/rag.service';
import { LlmFactory } from './providers/llm.factory';
import { SystemPrompts } from './prompts/system-prompts';
import { AiModelProvider } from './interfaces/llm-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private conversationService: ConversationService,
    private knowledgeBase: KnowledgeBaseService,
    private smartSearch: SmartSearchService,
    private ocr: OcrService,
    private rag: RagService,
    private llmFactory: LlmFactory,
  ) {}

  async processChat(
    dto: { message: string; conversationId?: string; language?: 'ar' | 'en'; role: string; attachResults?: string[]; attachImages?: string[] },
    user: { id: string; role: string; [key: string]: any },
  ) {
    const language = dto.language || 'ar';

    let ocrText = '';
    if (dto.attachImages?.length) {
      const uploadsDir = 'uploads/ai/ocr';
      for (const filename of dto.attachImages) {
        const filePath = require('path').join(uploadsDir, filename);
        if (require('fs').existsSync(filePath)) {
          const result = await this.ocr.processImage(filePath, language);
          ocrText += result.text + '\n';
        }
      }
    }

    let resultContext = '';
    if (dto.attachResults?.length) {
      const reports = await (this.prisma as any).report.findMany({
        where: { id: { in: dto.attachResults } },
        include: { items: true },
      });
      resultContext = reports.map(r => {
        const items = (r as any).items?.map((i: any) =>
          `${i.testNameEn || i.testNameAr}: ${i.value} ${i.unit || ''} (Range: ${i.referenceRange || 'N/A'})${i.isAbnormal ? ' **ABNORMAL**' : ''}`
        ).join('\n') || '';
        return `Report #${r.reportNumber || r.id}:\n${items}`;
      }).join('\n\n');
    }

    const enrichedMessage = dto.attachResults?.length || ocrText
      ? `${dto.message}\n\n${resultContext ? `Attached Results:\n${resultContext}\n\n` : ''}${ocrText ? `Extracted from Image:\n${ocrText}` : ''}`
      : dto.message;

    return this.conversationService.processMessage(
      dto.conversationId,
      user.id,
      dto.role,
      enrichedMessage,
      language,
      { attachResults: dto.attachResults },
    );
  }

  async interpretResults(
    reportId: string,
    language: 'ar' | 'en',
    focus?: string,
    user?: { id: string; role: string },
  ) {
    const report = await (this.prisma as any).report.findUnique({
      where: { id: reportId },
      include: {
        items: true,
        patient: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true, dateOfBirth: true, gender: true } },
        order: { include: { doctor: { include: { user: { include: { profile: { select: { firstNameEn: true, lastNameEn: true, firstNameAr: true, lastNameAr: true } } } } } } } },
      },
    });

    if (!report) {
      return { success: false, message: 'Report not found' };
    }

    const itemsText = (report as any).items?.map((i: any) =>
      `${i.testNameEn || i.testNameAr}: ${i.value} ${i.unit || ''} (Reference: ${i.referenceRange || 'N/A'})${i.isAbnormal ? ' [ABNORMAL]' : ''}`
    ).join('\n') || 'No test items found';

    const pat = (report as any).patient;
    const patientNameEn = [pat?.firstNameEn, pat?.lastNameEn].filter(Boolean).join(' ') || 'Unknown';
    const patientNameAr = [pat?.firstNameAr, pat?.lastNameAr].filter(Boolean).join(' ') || 'غير معروف';
    const patientInfo = `Patient: ${language === 'ar' ? patientNameAr : patientNameEn}`;
    const focusInstruction = focus ? language === 'ar'
      ? `\nالتركيز الخاص: ${focus}`
      : `\nSpecial focus: ${focus}` : '';

    const systemPrompt = SystemPrompts.getInterpretationPrompt(language);
    const userMessage = language === 'ar'
      ? `الرجاء تفسير نتائج التحاليل التالية:\n\n${patientInfo}\n\nالنتائج:\n${itemsText}${focusInstruction}`
      : `Please interpret the following lab results:\n\n${patientInfo}\n\nResults:\n${itemsText}${focusInstruction}`;

    const provider = this.llmFactory.getProvider();
    const result = await provider.generateChat(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      { temperature: 0.2, maxTokens: 4096 },
    );

    return {
      success: true,
      reportId,
      interpretation: result.content,
      model: result.model,
      provider: result.provider,
      usage: result.usage,
      latencyMs: result.latencyMs,
      disclaimer: language === 'ar'
        ? 'هذا التفسير لأغراض تعليمية فقط وليس بديلاً عن الاستشارة الطبية المتخصصة.'
        : 'This interpretation is for educational purposes only and is not a substitute for professional medical advice.',
    };
  }

  async reindexAll(provider?: AiModelProvider): Promise<{ processed: number; failed: number }> {
    this.logger.log(`Starting full reindex with provider: ${provider || 'default'}`);
    return this.rag.reindexAll(provider);
  }

  getProviderStatus() {
    return {
      active: this.llmFactory.getActiveProvider(),
      available: this.llmFactory.getAllProviders(),
    };
  }
}
