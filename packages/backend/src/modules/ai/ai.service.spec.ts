import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConversationService } from './services/conversation.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { SmartSearchService } from './services/smart-search.service';
import { OcrService } from './services/ocr.service';
import { RagService } from './rag/rag.service';
import { LlmFactory } from './providers/llm.factory';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('AiService', () => {
  let service: AiService;

  const mockConversationService = {
    processMessage: jest.fn().mockResolvedValue({ response: 'AI response', conversationId: 'conv-1' }),
    listConversations: jest.fn().mockResolvedValue([]),
    getConversation: jest.fn().mockResolvedValue({ id: 'conv-1', messages: [] }),
    deleteConversation: jest.fn().mockResolvedValue(undefined),
  };

  const mockKnowledgeBase = { findAll: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), markHelpful: jest.fn(), createRelation: jest.fn() };
  const mockSmartSearch = { search: jest.fn().mockResolvedValue({ results: [] }) };
  const mockOcr = { processImage: jest.fn().mockResolvedValue({ text: 'OCR text' }), processPdf: jest.fn().mockResolvedValue({ text: 'PDF text' }) };
  const mockRag = { reindexAll: jest.fn().mockResolvedValue({ processed: 100, failed: 0 }) };
  const mockLlmFactory = {
    getProvider: jest.fn().mockReturnValue({
      generateChat: jest.fn().mockResolvedValue({ content: 'Interpretation', model: 'gpt-4', provider: 'openai', usage: { prompt_tokens: 100, completion_tokens: 200 }, latencyMs: 500 }),
      getModels: jest.fn().mockResolvedValue(['gpt-4', 'gpt-3.5-turbo']),
    }),
    getActiveProvider: jest.fn().mockReturnValue('openai'),
    getAllProviders: jest.fn().mockReturnValue(['openai', 'anthropic', 'google']),
    setActiveProvider: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: KnowledgeBaseService, useValue: mockKnowledgeBase },
        { provide: SmartSearchService, useValue: mockSmartSearch },
        { provide: OcrService, useValue: mockOcr },
        { provide: RagService, useValue: mockRag },
        { provide: LlmFactory, useValue: mockLlmFactory },
      ],
    }).compile();

    service = module.get(AiService);
    jest.clearAllMocks();
  });

  describe('processChat', () => {
    it('should process a simple chat message', async () => {
      const result = await service.processChat(
        { message: 'What is my blood test result?', role: 'patient', language: 'en' },
        { id: 'user-1', role: 'patient' },
      );
      expect(result.response).toBe('AI response');
      expect(mockConversationService.processMessage).toHaveBeenCalled();
    });

    it('should attach OCR text when images are provided', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const result = await service.processChat(
        { message: 'Analyze this', role: 'doctor', attachImages: ['lab-report.jpg'], language: 'en' },
        { id: 'user-2', role: 'doctor' },
      );
      expect(mockOcr.processImage).toHaveBeenCalled();
      expect(result.response).toBe('AI response');
    });

    it('should attach result context when report IDs are provided', async () => {
      mockPrismaService.report.findMany.mockResolvedValue([{ id: 'rpt-1', reportNumber: 'RPT-001', items: [{ testNameEn: 'Glucose', value: '5.5', unit: 'mmol/L', referenceRange: '3.9-6.1', isAbnormal: false }] }]);
      const result = await service.processChat(
        { message: 'Interpret my results', role: 'patient', attachResults: ['rpt-1'], language: 'ar' },
        { id: 'user-3', role: 'patient' },
      );
      expect(mockPrismaService.report.findMany).toHaveBeenCalled();
      expect(result.response).toBe('AI response');
    });
  });

  describe('interpretResults', () => {
    it('should interpret lab results and return interpretation', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue({
        id: 'rpt-1',
        reportNumber: 'RPT-001',
        patient: { firstNameEn: 'Ahmed', lastNameEn: 'Ali', firstNameAr: 'أحمد', lastNameAr: 'علي', dateOfBirth: new Date('1990-01-15'), gender: 'MALE' },
        items: [{ testNameEn: 'Glucose', value: '5.5', unit: 'mmol/L', referenceRange: '3.9-6.1', isAbnormal: false }],
        order: { doctor: { user: { profile: { firstNameEn: 'Dr.', lastNameEn: 'Smith' } } } },
      });
      const result = await service.interpretResults('rpt-1', 'en');
      expect(result.success).toBe(true);
      expect(result.interpretation).toBe('Interpretation');
      expect(result.disclaimer).toBeDefined();
    });

    it('should return failure when report not found', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(null);
      const result = await service.interpretResults('unknown', 'ar');
      expect(result.success).toBe(false);
    });

    it('should include focus in prompt when provided', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue({
        id: 'rpt-1',
        patient: { firstNameEn: 'Ahmed', lastNameEn: 'Ali', firstNameAr: 'أحمد', lastNameAr: 'علي', dateOfBirth: new Date('1990-01-15'), gender: 'MALE' },
        items: [],
        order: { doctor: { user: { profile: {} } } },
      });
      const result = await service.interpretResults('rpt-1', 'en', 'Kidney function');
      expect(result.success).toBe(true);
    });
  });

  describe('reindexAll', () => {
    it('should trigger full reindex', async () => {
      const result = await service.reindexAll('openai' as any);
      expect(result.processed).toBe(100);
      expect(mockRag.reindexAll).toHaveBeenCalledWith('openai');
    });
  });

  describe('getProviderStatus', () => {
    it('should return active and available providers', () => {
      const status = service.getProviderStatus();
      expect(status.active).toBe('openai');
      expect(status.available).toContain('openai');
      expect(status.available).toContain('anthropic');
    });
  });
});
