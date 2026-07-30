import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LlmProvider, LlmMessage, LlmCompletionOptions, LlmCompletionResult,
  LlmEmbeddingOptions, LlmEmbeddingResult, LlmStreamChunk, LlmToolCall,
  AiModelProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LlmProvider {
  readonly name = AiModelProvider.OPENAI;
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAIProvider.name);
  private defaultModel: string;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      organization: this.config.get<string>('OPENAI_ORG_ID'),
      baseURL: this.config.get<string>('OPENAI_BASE_URL') || undefined,
    });
    this.defaultModel = this.config.get<string>('OPENAI_MODEL', 'gpt-4o');
  }

  async generateChat(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = options?.model || this.defaultModel;
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content, name: m.name })),
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        tools: options?.tools as any,
        tool_choice: options?.toolChoice as any,
        stop: options?.stop,
      });
      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        toolCalls: (choice.message.tool_calls as any[])?.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
        })) as LlmToolCall[],
        model: response.model,
        provider: AiModelProvider.OPENAI,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI chat error: ${error.message}`);
      throw error;
    }
  }

  async *generateChatStream(messages: LlmMessage[], options?: LlmCompletionOptions): AsyncIterable<LlmStreamChunk> {
    const model = options?.model || this.defaultModel;
    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content, name: m.name })),
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        tools: options?.tools as any,
        tool_choice: options?.toolChoice as any,
        stop: options?.stop,
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        yield {
          content: delta.content || '',
          toolCalls: (delta.tool_calls as any[])?.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
          })) as LlmToolCall[],
          done: chunk.choices[0]?.finish_reason != null,
        };
      }
    } catch (error: any) {
      this.logger.error(`OpenAI stream error: ${error.message}`);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[], options?: LlmEmbeddingOptions): Promise<LlmEmbeddingResult> {
    const start = Date.now();
    const model = options?.model || 'text-embedding-3-small';
    try {
      const response = await this.client.embeddings.create({
        model,
        input: texts,
      });
      return {
        embeddings: response.data.map(d => d.embedding),
        model: response.model,
        provider: AiModelProvider.OPENAI,
        usage: { promptTokens: response.usage?.prompt_tokens || 0, totalTokens: response.usage?.total_tokens || 0 },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI embedding error: ${error.message}`);
      throw error;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const list = await this.client.models.list();
      return list.data.map(m => m.id);
    } catch {
      return [this.defaultModel, 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'text-embedding-3-small'];
    }
  }
}
