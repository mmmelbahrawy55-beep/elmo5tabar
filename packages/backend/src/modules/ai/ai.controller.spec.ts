import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConversationService } from './services/conversation.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { SmartSearchService } from './services/smart-search.service';
import { AiAnalyticsService } from './services/ai-analytics.service';
import { OcrService } from './services/ocr.service';
import { SpeechService } from './services/speech.service';
import { LlmFactory } from './providers/llm.factory';

describe('AiController', () => {
  let controller: AiController;

  const mockAiService = {
    processChat: jest.fn().mockResolvedValue({ response: 'Chat response', conversationId: 'conv-1' }),
    interpretResults: jest.fn().mockResolvedValue({ success: true, interpretation: 'Interpretation' }),
    reindexAll: jest.fn().mockResolvedValue({ processed: 100, failed: 0 }),
  };

  const mockConversationService = {
    listConversations: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    getConversation: jest.fn().mockResolvedValue({ id: 'conv-1', messages: [] }),
    deleteConversation: jest.fn().mockResolvedValue(undefined),
  };

  const mockSmartSearch = { search: jest.fn().mockResolvedValue({ results: [] }) };
  const mockOcr = {
    processImage: jest.fn().mockResolvedValue({ text: 'OCR text' }),
    processPdf: jest.fn().mockResolvedValue({ text: 'PDF text' }),
  };
  const mockSpeech = {
    speechToText: jest.fn().mockResolvedValue({ text: 'Hello', confidence: 0.95 }),
    textToSpeech: jest.fn().mockResolvedValue({ audio: Buffer.from('audio'), mimeType: 'audio/mp3', durationMs: 1000 }),
  };
  const mockAnalytics = {
    logFeedback: jest.fn().mockResolvedValue({ success: true }),
    getDashboardStats: jest.fn().mockResolvedValue({ totalQueries: 500 }),
    getPerformanceReport: jest.fn().mockResolvedValue({ avgLatencyMs: 300 }),
    getFeedbackList: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    resolveFeedback: jest.fn().mockResolvedValue({ success: true }),
  };
  const mockKnowledgeBase = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    findById: jest.fn().mockResolvedValue({ id: 'kb-1' }),
    create: jest.fn().mockResolvedValue({ id: 'kb-1' }),
    update: jest.fn().mockResolvedValue({ id: 'kb-1' }),
    remove: jest.fn().mockResolvedValue(undefined),
    markHelpful: jest.fn().mockResolvedValue(undefined),
    createRelation: jest.fn().mockResolvedValue({ success: true }),
  };
  const mockLlmFactory = {
    getAllProviders: jest.fn().mockReturnValue(['openai', 'anthropic']),
    getActiveProvider: jest.fn().mockReturnValue('openai'),
    setActiveProvider: jest.fn(),
    getProvider: jest.fn().mockReturnValue({ getModels: jest.fn().mockResolvedValue(['gpt-4']) }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: KnowledgeBaseService, useValue: mockKnowledgeBase },
        { provide: SmartSearchService, useValue: mockSmartSearch },
        { provide: AiAnalyticsService, useValue: mockAnalytics },
        { provide: OcrService, useValue: mockOcr },
        { provide: SpeechService, useValue: mockSpeech },
        { provide: LlmFactory, useValue: mockLlmFactory },
      ],
    }).compile();

    controller = module.get(AiController);
    jest.clearAllMocks();
  });

  it('should handle POST /ai/chat', async () => {
    const result = await controller.chat(
      { message: 'Hello', role: 'patient' },
      { user: { id: 'user-1', role: 'patient' } } as any,
    );
    expect(result.response).toBe('Chat response');
  });

  it('should handle POST /ai/interpret', async () => {
    const result = await controller.interpretResults(
      { reportId: 'rpt-1', language: 'en' },
      { user: { id: 'user-1', role: 'doctor' } } as any,
    );
    expect(result.success).toBe(true);
  });

  it('should handle GET /ai/conversations', async () => {
    const result = await controller.listConversations({ user: { id: 'user-1', role: 'patient' } } as any, 1, 20);
    expect(result.data).toBeDefined();
  });

  it('should handle GET /ai/conversations/:id', async () => {
    const result = await controller.getConversation('conv-1', { user: { id: 'user-1' } } as any);
    expect(result.id).toBe('conv-1');
  });

  it('should handle DELETE /ai/conversations/:id', async () => {
    await controller.deleteConversation('conv-1', { user: { id: 'user-1' } } as any);
    expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('conv-1', 'user-1');
  });

  it('should handle POST /ai/search', async () => {
    const result = await controller.search(
      { query: 'blood test', language: 'en' },
      { user: { id: 'user-1', role: 'doctor' } } as any,
    );
    expect(result.results).toBeDefined();
  });

  it('should handle POST /ai/voice', async () => {
    const result = await controller.voice(
      { audio: Buffer.from('test').toString('base64'), language: 'ar' },
      { user: { id: 'user-1', role: 'patient' } } as any,
    );
    expect(result.success).toBe(true);
    expect(result.transcript).toBe('Hello');
  });

  it('should handle POST /ai/voice/stt', async () => {
    const result = await controller.speechToText({ audio: Buffer.from('test').toString('base64'), language: 'en' });
    expect(result.text).toBe('Hello');
  });

  it('should handle POST /ai/voice/tts', async () => {
    const result = await controller.textToSpeech({ text: 'Hello', language: 'en' });
    expect(result.audio).toBeDefined();
  });

  it('should handle POST /ai/feedback/:messageId', async () => {
    const result = await controller.submitFeedback('msg-1', { rating: 5, comment: 'Great' }, { user: { id: 'user-1' } } as any);
    expect(result.success).toBe(true);
  });

  it('should handle CRUD for knowledge base', async () => {
    await controller.listKnowledge({});
    expect(mockKnowledgeBase.findAll).toHaveBeenCalled();

    await controller.getKnowledge('kb-1');
    expect(mockKnowledgeBase.findById).toHaveBeenCalledWith('kb-1');

    await controller.createKnowledge({} as any, { user: { id: 'user-1' } } as any);
    expect(mockKnowledgeBase.create).toHaveBeenCalled();

    await controller.updateKnowledge('kb-1', {} as any);
    expect(mockKnowledgeBase.update).toHaveBeenCalled();

    await controller.deleteKnowledge('kb-1');
    expect(mockKnowledgeBase.remove).toHaveBeenCalledWith('kb-1');
  });

  it('should handle POST /ai/reindex', async () => {
    const result = await controller.reindex({ provider: 'openai' });
    expect(result.processed).toBe(100);
  });

  it('should handle GET /ai/providers', () => {
    const result = controller.getProviders();
    expect(result.providers).toHaveLength(2);
    expect(result.active).toBe('openai');
  });

  it('should handle POST /ai/providers/switch', () => {
    const result = controller.switchProvider({ provider: 'anthropic' });
    expect(result.active).toBe('openai');
  });

  it('should handle GET /ai/analytics/dashboard', async () => {
    const result = await controller.getDashboard({ days: 30 });
    expect(result.totalQueries).toBe(500);
  });

  it('should handle GET /ai/analytics/performance', async () => {
    const result = await controller.getPerformance({ from: '2025-01-01', to: '2025-01-31' });
    expect(result.avgLatencyMs).toBe(300);
  });

  it('should handle GET /ai/health', async () => {
    const result = await controller.healthCheck();
    expect(result.status).toBeDefined();
  });

  it('should handle POST /ai/ocr with file', async () => {
    const file = { originalname: 'report.jpg', path: '/tmp/report.jpg', mimetype: 'image/jpeg' };
    const req = {} as any;
    const result = await controller.processOcr(file, req, 'ar');
    expect(result.success).toBe(true);
  });

  it('should handle POST /ai/ocr without file', async () => {
    const result = await controller.processOcr(null, {} as any, 'en');
    expect(result.success).toBe(false);
  });
});
