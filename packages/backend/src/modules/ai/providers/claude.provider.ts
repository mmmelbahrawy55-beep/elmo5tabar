import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider, LlmMessage, LlmCompletionOptions, LlmCompletionResult,
  LlmEmbeddingOptions, LlmEmbeddingResult, LlmStreamChunk,
  AiModelProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class ClaudeProvider implements LlmProvider {
  readonly name = AiModelProvider.CLAUDE;
  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeProvider.name);
  private defaultModel: string;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
    this.defaultModel = this.config.get<string>('CLAUDE_MODEL', 'claude-sonnet-4-20250514');
  }

  async generateChat(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = options?.model || this.defaultModel;
    try {
      const systemMsg = messages.find(m => m.role === 'system');
      const nonSystem = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user' as const,
        content: m.content,
      }));
      const response = await this.client.messages.create({
        model,
        system: systemMsg?.content,
        messages: nonSystem as any,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
        top_p: options?.topP,
        stop_sequences: options?.stop,
      });
      const content = response.content.map(c => 'text' in c ? c.text : '').join('');
      return {
        content,
        model: response.model,
        provider: AiModelProvider.CLAUDE,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`Claude chat error: ${error.message}`);
      throw error;
    }
  }

  async *generateChatStream(messages: LlmMessage[], options?: LlmCompletionOptions): AsyncIterable<LlmStreamChunk> {
    const model = options?.model || this.defaultModel;
    try {
      const systemMsg = messages.find(m => m.role === 'system');
      const nonSystem = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user' as const,
        content: m.content,
      }));
      const stream = await this.client.messages.create({
        model,
        system: systemMsg?.content,
        messages: nonSystem as any,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
        top_p: options?.topP,
        stop_sequences: options?.stop,
        stream: true,
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { content: event.delta.text, done: false };
        }
        if (event.type === 'message_delta') {
          yield { content: '', done: true };
        }
      }
    } catch (error: any) {
      this.logger.error(`Claude stream error: ${error.message}`);
      throw error;
    }
  }

  async generateEmbeddings(_texts: string[], _options?: LlmEmbeddingOptions): Promise<LlmEmbeddingResult> {
    const start = Date.now();
    try {
      const response = await this.client.messages.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: `Generate embeddings for the following texts. Return each as a 1536-dimensional vector. Texts: ${_texts.join(' | ')}` }],
        max_tokens: 1,
      });
      return {
        embeddings: [],
        model: this.defaultModel,
        provider: AiModelProvider.CLAUDE,
        usage: { promptTokens: response.usage?.input_tokens || 0, totalTokens: (response.usage?.input_tokens || 0) },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`Claude does not natively support embeddings; falling back. ${error.message}`);
      return { embeddings: [], model: this.defaultModel, provider: AiModelProvider.CLAUDE, usage: { promptTokens: 0, totalTokens: 0 }, latencyMs: Date.now() - start };
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map(m => m.id);
    } catch {
      return [this.defaultModel, 'claude-sonnet-4-20250514', 'claude-3-5-haiku-latest', 'claude-opus-4-20250514'];
    }
  }
}
