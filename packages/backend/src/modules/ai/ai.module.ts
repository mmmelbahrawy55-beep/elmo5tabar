import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiGateway } from './ai.gateway';
import { AiService } from './ai.service';

// Providers
import { LlmFactory } from './providers/llm.factory';
import { OpenAIProvider } from './providers/openai.provider';
import { AzureOpenAIProvider } from './providers/azure-openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { ClaudeProvider } from './providers/claude.provider';

// RAG
import { RagService } from './rag/rag.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { DocumentProcessorService } from './rag/document-processor.service';

// Services
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { ConversationService } from './services/conversation.service';
import { SpeechService } from './services/speech.service';
import { OcrService } from './services/ocr.service';
import { SmartSearchService } from './services/smart-search.service';
import { AiAnalyticsService } from './services/ai-analytics.service';

// Guards
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { GuardrailsService } from './prompts/guardrails';

// Passport
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AiController],
  providers: [
    // Core
    AiService, AiGateway,

    // LLM Providers
    LlmFactory, OpenAIProvider, AzureOpenAIProvider, GeminiProvider, ClaudeProvider,

    // RAG
    RagService, EmbeddingsService, DocumentProcessorService,

    // Feature Services
    KnowledgeBaseService, ConversationService, SpeechService,
    OcrService, SmartSearchService, AiAnalyticsService,

    // Guards & Security
    AiRateLimitGuard, GuardrailsService,
  ],
  exports: [AiService, LlmFactory, EmbeddingsService],
})
export class AiModule {}
