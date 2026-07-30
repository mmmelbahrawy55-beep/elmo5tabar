import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { LlmFactory } from '../providers/llm.factory';
import { RagService, RagContext } from '../rag/rag.service';
import { SystemPrompts } from '../prompts/system-prompts';
import { GuardrailsService } from '../prompts/guardrails';
import { LlmMessage, AiModelProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_HISTORY = 20;
  private readonly MAX_CONTEXT_TOKENS = 8000;

  constructor(
    private prisma: PrismaService,
    private llmFactory: LlmFactory,
    private rag: RagService,
    private guardrails: GuardrailsService,
  ) {}

  async createConversation(userId: string, userRole: string, language: string, title?: string) {
    return this.prisma.aiConversation.create({
      data: { userId, userRole, language, title: title || null },
    });
  }

  async getConversation(id: string, userId?: string) {
    const where: any = { id, deletedAt: null };
    if (userId) where.userId = userId;
    const conv = await this.prisma.aiConversation.findFirst({
      where,
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async listConversations(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where: { userId, deletedAt: null },
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, language: true, messageCount: true,
          lastMessageAt: true, status: true, createdAt: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } },
        },
      }),
      this.prisma.aiConversation.count({ where: { userId, deletedAt: null } }),
    ]);
    return {
      items: items.map(i => ({ ...i, preview: i.messages[0]?.content?.slice(0, 150) || null, messages: undefined })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  async processMessage(
    conversationId: string | undefined,
    userId: string,
    userRole: string,
    message: string,
    language: 'ar' | 'en',
    options?: { attachResults?: string[]; provider?: AiModelProvider; model?: string },
  ) {
    const systemPrompt = SystemPrompts.getPrompt(userRole, language);
    const guardrailResult = await this.guardrails.check(message, language);
    if (guardrailResult.blocked) {
      return {
        response: guardrailResult.response,
        shouldBlock: true,
        conversationId: conversationId || '',
        messageId: '',
        referencedDocs: [],
        model: '',
        provider: '',
        latencyMs: 0,
      };
    }

    let conversation = conversationId
      ? await this.prisma.aiConversation.findFirst({ where: { id: conversationId, userId, deletedAt: null } })
      : null;

    if (!conversation) {
      conversation = await this.createConversation(userId, userRole, language);
    }

    const history = await this.getConversationHistory(conversation.id);
    const ragContext = await this.rag.retrieveRelevantContext(message, { language });

    const provider = options?.provider || this.llmFactory.getActiveProvider();
    const llm = this.llmFactory.getProvider(provider);

    const messages: LlmMessage[] = [
      { role: 'system', content: this.buildSystemPrompt(systemPrompt, userRole, ragContext, language) },
      ...history,
      { role: 'user', content: this.enrichUserMessage(message, language, ragContext) },
    ];

    const start = Date.now();
    let result;
    try {
      result = await llm.generateChat(messages, {
        model: options?.model,
        temperature: 0.3,
        maxTokens: 2048,
      });
    } catch (error: any) {
      const fallback = await this.llmFactory.generateWithFallback(
        this.llmFactory.getActiveProvider(),
        provider === AiModelProvider.OPENAI ? AiModelProvider.CLAUDE : AiModelProvider.OPENAI,
        (p) => p.generateChat(messages, { temperature: 0.3, maxTokens: 2048 }),
      );
      result = fallback.result;
    }

    const latencyMs = Date.now() - start;

    const userMsg = await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
        tokensIn: 0,
        tokensOut: 0,
        model: result.model,
        provider: result.provider,
        latencyMs: 0,
        referencedDocs: ragContext.chunks.map(c => c.knowledgeBaseId),
      },
    });

    const assistantMsg = await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: result.content,
        tokensIn: result.usage.promptTokens,
        tokensOut: result.usage.completionTokens,
        model: result.model,
        provider: result.provider,
        latencyMs,
        referencedDocs: ragContext.chunks.map(c => c.knowledgeBaseId),
      },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
        title: conversation.messageCount === 0 ? await this.generateTitle(message) : undefined,
      },
    });

    await this.logAnalytics({
      conversationId: conversation.id, userId, userRole, query: message,
      queryLanguage: language, response: result.content, model: result.model,
      provider: result.provider, latencyMs, tokensIn: result.usage.promptTokens,
      tokensOut: result.usage.completionTokens, retrievedDocs: ragContext.chunks.length,
      hadKnowledge: ragContext.chunks.length > 0,
    });

    return {
      response: result.content,
      conversationId: conversation.id,
      messageId: assistantMsg.id,
      referencedDocs: ragContext.chunks.map(c => ({
        id: c.knowledgeBaseId,
        title: c.metadata.title,
        titleAr: c.metadata.titleAr,
        documentType: c.metadata.documentType,
        relevance: c.score,
      })),
      model: result.model,
      provider: result.provider,
      latencyMs,
      suggestions: await this.generateSuggestions(message, language, ragContext),
      disclaimer: language === 'ar'
        ? 'هذه المعلومات لأغراض تعليمية فقط وليست بديلاً عن الاستشارة الطبية المتخصصة. يُرجى استشارة طبيبك المعتمد.'
        : 'This information is for educational purposes only and is not a substitute for professional medical advice. Please consult your physician.',
    };
  }

  private buildSystemPrompt(basePrompt: string, userRole: string, ragContext: RagContext, language: 'ar' | 'en'): string {
    const roleContext = this.getRoleContext(userRole, language);
    const ragSection = ragContext.chunks.length > 0
      ? (language === 'ar'
        ? `\nالمعلومات المرجعية المتاحة:\n${ragContext.combinedContextAr}\n`
        : `\nAvailable reference information:\n${ragContext.combinedContext}\n`)
      : '';
    return `${basePrompt}\n\n${roleContext}${ragSection}\n\n${language === 'ar' ? 'يجب عليك الرد باللغة العربية.' : 'You must respond in English.'}`;
  }

  private enrichUserMessage(message: string, _language: 'ar' | 'en', _ragContext: RagContext): string {
    return message;
  }

  private getRoleContext(role: string, language: 'ar' | 'en'): string {
    const contexts: Record<string, string> = {
      PATIENT: language === 'ar'
        ? 'أنت تتحدث مع مريض. استخدم لغة بسيطة وواضحة. تجنب المصطلحات الطبية المعقدة دون شرحها. قدم معلومات مفيدة ومطمئنة.'
        : 'You are speaking with a patient. Use simple, clear language. Avoid complex medical terms without explanation. Provide helpful and reassuring information.',
      DOCTOR: language === 'ar'
        ? 'أنت تتحدث مع طبيب. يمكنك استخدام المصطلحات الطبية المتخصصة. قدم معلومات دقيقة ومفصلة مع الاستشهادات العلمية.'
        : 'You are speaking with a doctor. You may use specialized medical terminology. Provide precise, detailed information with scientific references.',
      LAB_TECHNICIAN: language === 'ar'
        ? 'أنت تتحدث مع فني مختبر. ركز على الجوانب الفنية للتحاليل، معايير الجودة، وإجراءات التشغيل.'
        : 'You are speaking with a lab technician. Focus on technical aspects of tests, quality standards, and operating procedures.',
      RECEPTIONIST: language === 'ar'
        ? 'أنت تتحدث مع موظف استقبال. قدم معلومات عن المواعيد، التحضير للتحاليل، وإجراءات التسجيل.'
        : 'You are speaking with a receptionist. Provide information about appointments, test preparation, and registration procedures.',
      ADMIN: language === 'ar'
        ? 'أنت تتحدث مع مدير المختبر. قدم معلومات إدارية، إحصائيات، تقارير أداء، وتوصيات تشغيلية.'
        : 'You are speaking with a lab administrator. Provide administrative information, statistics, performance reports, and operational recommendations.',
    };
    return contexts[role] || contexts.PATIENT;
  }

  private async getConversationHistory(conversationId: string): Promise<LlmMessage[]> {
    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: this.MAX_HISTORY,
      select: { role: true, content: true },
    });
    return messages.map(m => ({
      role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));
  }

  private async generateTitle(message: string): Promise<string> {
    const titles: string[] = [
      message.slice(0, 60), message.split(' ').slice(0, 8).join(' '),
    ];
    return titles[0].length < 10 ? 'استشارة طبية' : titles[0];
  }

  private async generateSuggestions(_query: string, _language: 'ar' | 'en', _rag: RagContext): Promise<string[]> {
    return _language === 'ar'
      ? ['اشرح تحليل السكر التراكمي', 'كيف أستعد لتحليل الدم؟', 'ما هي فحوصات الغدة الدرقية؟']
      : ['Explain HbA1c test', 'How to prepare for a blood test?', 'What are thyroid function tests?'];
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, userId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    await this.prisma.aiConversation.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' as any } });
  }

  private async logAnalytics(data: {
    conversationId: string; userId: string; userRole: string;
    query: string; queryLanguage: string; response: string;
    model: string; provider: AiModelProvider; latencyMs: number;
    tokensIn: number; tokensOut: number; retrievedDocs: number; hadKnowledge: boolean;
  }) {
    try {
      await this.prisma.aiAnalytics.create({
        data: {
          conversationId: data.conversationId,
          userId: data.userId,
          userRole: data.userRole,
          query: data.query,
          queryLanguage: data.queryLanguage,
          response: data.response,
          model: data.model,
          provider: data.provider,
          latencyMs: data.latencyMs,
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
          costUsd: this.estimateCost(data.provider, data.tokensIn, data.tokensOut),
          retrievedDocs: data.retrievedDocs,
          hadKnowledge: data.hadKnowledge,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to log analytics: ${error.message}`);
    }
  }

  private estimateCost(provider: AiModelProvider, tokensIn: number, tokensOut: number): number {
    const rates: Record<string, { in: number; out: number }> = {
      OPENAI: { in: 0.0000025, out: 0.00001 },
      AZURE_OPENAI: { in: 0.0000025, out: 0.00001 },
      GEMINI: { in: 0.00000125, out: 0.000005 },
      CLAUDE: { in: 0.000003, out: 0.000015 },
    };
    const rate = rates[provider] || rates.OPENAI;
    return (tokensIn * rate.in) + (tokensOut * rate.out);
  }
}
