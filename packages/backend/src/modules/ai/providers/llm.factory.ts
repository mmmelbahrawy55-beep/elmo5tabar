import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, AiModelProvider } from '../interfaces/llm-provider.interface';
import { OpenAIProvider } from './openai.provider';
import { AzureOpenAIProvider } from './azure-openai.provider';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';

@Injectable()
export class LlmFactory {
  private readonly logger = new Logger(LlmFactory.name);
  private readonly providers: Map<AiModelProvider, LlmProvider> = new Map();
  private activeProvider: AiModelProvider;

  constructor(
    private openAI: OpenAIProvider,
    private azureOpenAI: AzureOpenAIProvider,
    private gemini: GeminiProvider,
    private claude: ClaudeProvider,
    private config: ConfigService,
  ) {
    this.providers.set(AiModelProvider.OPENAI, openAI);
    this.providers.set(AiModelProvider.AZURE_OPENAI, azureOpenAI);
    this.providers.set(AiModelProvider.GEMINI, gemini);
    this.providers.set(AiModelProvider.CLAUDE, claude);
    this.activeProvider = this.config.get<AiModelProvider>('AI_PRIMARY_PROVIDER', AiModelProvider.OPENAI);
  }

  getProvider(name?: AiModelProvider): LlmProvider {
    const provider = name || this.activeProvider;
    const instance = this.providers.get(provider);
    if (!instance) {
      this.logger.warn(`Provider ${provider} not found, falling back to ${this.activeProvider}`);
      return this.providers.get(this.activeProvider)!;
    }
    return instance;
  }

  setActiveProvider(provider: AiModelProvider): void {
    if (this.providers.has(provider)) {
      this.activeProvider = provider;
      this.logger.log(`Active AI provider set to ${provider}`);
    }
  }

  getActiveProvider(): AiModelProvider {
    return this.activeProvider;
  }

  getAllProviders(): AiModelProvider[] {
    return Array.from(this.providers.keys());
  }

  async generateWithFallback<T>(
    primaryProvider: AiModelProvider,
    fallbackProvider: AiModelProvider,
    fn: (provider: LlmProvider) => Promise<T>,
  ): Promise<{ result: T; provider: AiModelProvider }> {
    try {
      const result = await fn(this.getProvider(primaryProvider));
      return { result, provider: primaryProvider };
    } catch (error: any) {
      this.logger.warn(`Primary provider ${primaryProvider} failed: ${error.message}, falling back to ${fallbackProvider}`);
      const result = await fn(this.getProvider(fallbackProvider));
      return { result, provider: fallbackProvider };
    }
  }
}
