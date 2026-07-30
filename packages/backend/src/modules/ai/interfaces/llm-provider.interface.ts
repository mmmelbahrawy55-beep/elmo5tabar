export enum AiModelProvider {
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  GEMINI = 'GEMINI',
  CLAUDE = 'CLAUDE',
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LlmCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  tools?: LlmToolDefinition[];
  toolChoice?: 'auto' | 'any' | { type: 'function'; function: { name: string } };
  stop?: string[];
  stream?: boolean;
}

export interface LlmCompletionResult {
  content: string;
  toolCalls?: LlmToolCall[];
  model: string;
  provider: AiModelProvider;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface LlmEmbeddingOptions {
  model?: string;
}

export interface LlmEmbeddingResult {
  embeddings: number[][];
  model: string;
  provider: AiModelProvider;
  usage: { promptTokens: number; totalTokens: number };
  latencyMs: number;
}

export interface LlmStreamChunk {
  content: string;
  toolCalls?: LlmToolCall[];
  done: boolean;
}

export interface LlmProvider {
  readonly name: AiModelProvider;
  generateChat(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult>;
  generateChatStream(messages: LlmMessage[], options?: LlmCompletionOptions): AsyncIterable<LlmStreamChunk>;
  generateEmbeddings(texts: string[], options?: LlmEmbeddingOptions): Promise<LlmEmbeddingResult>;
  getModels(): Promise<string[]>;
}
