import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  LlmProvider, LlmMessage, LlmCompletionOptions, LlmCompletionResult,
  LlmEmbeddingOptions, LlmEmbeddingResult, LlmStreamChunk,
  AiModelProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = AiModelProvider.GEMINI;
  private readonly client: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiProvider.name);
  private defaultModel: string;

  constructor(private config: ConfigService) {
    this.client = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY', ''));
    this.defaultModel = this.config.get<string>('GEMINI_MODEL', 'gemini-1.5-pro');
  }

  private getModel(modelName?: string): GenerativeModel {
    return this.client.getGenerativeModel({ model: modelName || this.defaultModel });
  }

  async generateChat(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const start = Date.now();
    const model = this.getModel(options?.model);
    try {
      const systemMsg = messages.find(m => m.role === 'system');
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const lastMsg = history.pop();
      const chat = model.startChat({
        history: systemMsg ? [{ role: 'user', parts: [{ text: systemMsg.content }] },
          { role: 'model', parts: [{ text: 'Understood.' }] }, ...history.slice(0, -1)] as any : history as any,
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? 4096,
          topP: options?.topP,
          stopSequences: options?.stop,
        },
      });
      const result = await chat.sendMessage(lastMsg?.parts?.[0]?.text || '');
      const response = result.response;
      return {
        content: response.text(),
        model: model.model,
        provider: AiModelProvider.GEMINI,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`Gemini chat error: ${error.message}`);
      throw error;
    }
  }

  async *generateChatStream(messages: LlmMessage[], options?: LlmCompletionOptions): AsyncIterable<LlmStreamChunk> {
    const model = this.getModel(options?.model);
    try {
      const systemMsg = messages.find(m => m.role === 'system');
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const lastMsg = history.pop();
      const chat = model.startChat({
        history: systemMsg ? [{ role: 'user', parts: [{ text: systemMsg.content }] },
          { role: 'model', parts: [{ text: 'Understood.' }] }, ...history.slice(0, -1)] as any : history as any,
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? 4096,
          topP: options?.topP,
        },
      });
      const result = await chat.sendMessageStream(lastMsg?.parts?.[0]?.text || '');
      for await (const chunk of result.stream) {
        yield { content: chunk.text(), done: false };
      }
      yield { content: '', done: true };
    } catch (error: any) {
      this.logger.error(`Gemini stream error: ${error.message}`);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[], _options?: LlmEmbeddingOptions): Promise<LlmEmbeddingResult> {
    const start = Date.now();
    try {
      const model = this.client.getGenerativeModel({ model: 'text-embedding-004' });
      const results = await Promise.all(texts.map(t => model.embedContent(t)));
      return {
        embeddings: results.map(r => r.embedding.values),
        model: 'text-embedding-004',
        provider: AiModelProvider.GEMINI,
        usage: { promptTokens: texts.reduce((s, t) => s + t.length, 0), totalTokens: texts.reduce((s, t) => s + t.length, 0) },
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      this.logger.error(`Gemini embedding error: ${error.message}`);
      throw error;
    }
  }

  async getModels(): Promise<string[]> {
    return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-pro-exp', 'text-embedding-004'];
  }
}
