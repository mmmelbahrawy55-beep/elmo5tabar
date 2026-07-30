import {
  Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Req,
  HttpCode, HttpStatus, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { AiService } from './ai.service';
import { ConversationService } from './services/conversation.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { SmartSearchService } from './services/smart-search.service';
import { AiAnalyticsService } from './services/ai-analytics.service';
import { OcrService } from './services/ocr.service';
import { SpeechService } from './services/speech.service';
import { LlmFactory } from './providers/llm.factory';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import {
  ChatRequestDto, InterpretResultsDto, SearchRequestDto,
  KnowledgeBaseCreateDto, KnowledgeBaseUpdateDto, VoiceRequestDto,
  FeedbackDto, ReindexDto, ProviderSwitchDto, AnalyticsQueryDto,
} from './dto/ai.dto';
import { AiModelProvider } from './interfaces/llm-provider.interface';
import * as path from 'path';
import * as fs from 'fs';

interface RequestWithUser extends Request {
  user?: { id: string; role: string; [key: string]: any };
}

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private aiService: AiService,
    private conversationService: ConversationService,
    private knowledgeBase: KnowledgeBaseService,
    private smartSearch: SmartSearchService,
    private analytics: AiAnalyticsService,
    private ocr: OcrService,
    private speech: SpeechService,
    private llmFactory: LlmFactory,
  ) {}

  @Post('chat')
  @UseGuards(AiRateLimitGuard)
  @ApiOperation({ summary: 'Send a chat message to the AI assistant' })
  async chat(@Body() dto: ChatRequestDto, @Req() req: RequestWithUser) {
    return this.aiService.processChat(dto, req.user!);
  }

  @Post('interpret')
  @ApiOperation({ summary: 'Interpret laboratory test results' })
  async interpretResults(@Body() dto: InterpretResultsDto, @Req() req: RequestWithUser) {
    return this.aiService.interpretResults(dto.reportId, dto.language || 'ar', dto.focus, req.user!);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  async listConversations(
    @Req() req: RequestWithUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationService.listConversations(req.user!.id, page, limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details with messages' })
  async getConversation(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.conversationService.getConversation(id, req.user!.id);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.conversationService.deleteConversation(id, req.user!.id);
  }

  @Post('search')
  @ApiOperation({ summary: 'Smart search across lab data and knowledge base' })
  async search(@Body() dto: SearchRequestDto, @Req() req: RequestWithUser) {
    return this.smartSearch.search(dto.query, {
      language: dto.language,
      role: dto.role || req.user?.role,
      types: dto.types,
      userId: req.user?.id,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('voice')
  @ApiConsumes('application/json')
  @ApiOperation({ summary: 'Process voice input (STT + AI + TTS)' })
  async voice(@Body() dto: VoiceRequestDto, @Req() req: RequestWithUser) {
    const audioBuffer = Buffer.from(dto.audio, 'base64');
    const sttResult = await this.speech.speechToText(audioBuffer, dto.language);
    if (!sttResult.text) {
      return { success: false, message: 'Could not recognize speech' };
    }
    const chatResult = await this.aiService.processChat(
      { message: sttResult.text, language: dto.language, conversationId: dto.conversationId, role: dto.role },
      req.user!,
    );
    const ttsResult = await this.speech.textToSpeech(chatResult.response, dto.language);
    return {
      success: true,
      transcript: sttResult.text,
      confidence: sttResult.confidence,
      response: chatResult.response,
      audio: ttsResult.audio.toString('base64'),
      mimeType: ttsResult.mimeType,
      conversationId: chatResult.conversationId,
    };
  }

  @Post('voice/stt')
  @ApiOperation({ summary: 'Speech-to-text only' })
  async speechToText(@Body() dto: { audio: string; language?: 'ar' | 'en' }) {
    const audioBuffer = Buffer.from(dto.audio, 'base64');
    return this.speech.speechToText(audioBuffer, dto.language);
  }

  @Post('voice/tts')
  @ApiOperation({ summary: 'Text-to-speech only' })
  async textToSpeech(@Body() dto: { text: string; language?: 'ar' | 'en' }) {
    const result = await this.speech.textToSpeech(dto.text, dto.language);
    return {
      audio: result.audio.toString('base64'),
      mimeType: result.mimeType,
      durationMs: result.durationMs,
    };
  }

  @Post('ocr')
  @UseInterceptors(FileInterceptor('file', { dest: 'uploads/ai/ocr' }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Extract text from lab report image/PDF via OCR' })
  async processOcr(
    @UploadedFile() file: any,
    @Req() req: RequestWithUser,
    @Query('language') language?: 'ar' | 'en',
  ) {
    if (!file) return { success: false, message: 'No file uploaded' };
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === '.pdf';
    const result = isPdf
      ? await this.ocr.processPdf(file.path, language)
      : await this.ocr.processImage(file.path, language);
    fs.unlink(file.path, () => {});
    return { success: true, ...result };
  }

  @Post('feedback/:messageId')
  @ApiOperation({ summary: 'Submit feedback for an AI response' })
  async submitFeedback(
    @Param('messageId') messageId: string,
    @Body() dto: FeedbackDto,
    @Req() req: RequestWithUser,
  ) {
    return this.analytics.logFeedback(messageId, req.user!.id, dto.rating, dto.comment);
  }

  // =============== Knowledge Base Management ===============

  @Get('knowledge')
  @ApiOperation({ summary: 'List knowledge base entries' })
  async listKnowledge(
    @Query('documentType') documentType?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('language') language?: string,
  ) {
    return this.knowledgeBase.findAll({ documentType, category, search, page, limit, language });
  }

  @Get('knowledge/:id')
  @ApiOperation({ summary: 'Get knowledge base entry' })
  async getKnowledge(@Param('id') id: string) {
    return this.knowledgeBase.findById(id);
  }

  @Post('knowledge')
  @ApiOperation({ summary: 'Create knowledge base entry' })
  async createKnowledge(@Body() dto: KnowledgeBaseCreateDto, @Req() req: RequestWithUser) {
    return this.knowledgeBase.create({ ...dto, authorId: req.user!.id });
  }

  @Put('knowledge/:id')
  @ApiOperation({ summary: 'Update knowledge base entry' })
  async updateKnowledge(@Param('id') id: string, @Body() dto: KnowledgeBaseUpdateDto) {
    return this.knowledgeBase.update(id, dto);
  }

  @Delete('knowledge/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete knowledge base entry' })
  async deleteKnowledge(@Param('id') id: string) {
    await this.knowledgeBase.remove(id);
  }

  @Post('knowledge/:id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark knowledge base entry as helpful' })
  async markHelpful(@Param('id') id: string) {
    await this.knowledgeBase.markHelpful(id);
  }

  @Post('knowledge/:sourceId/relate/:targetId')
  @ApiOperation({ summary: 'Create relation between knowledge entries' })
  async createRelation(
    @Param('sourceId') sourceId: string,
    @Param('targetId') targetId: string,
    @Body('relationType') relationType: string,
    @Body('weight') weight?: number,
  ) {
    return this.knowledgeBase.createRelation(sourceId, targetId, relationType, weight);
  }

  // =============== RAG / Vector Index Management ===============

  @Post('reindex')
  @ApiOperation({ summary: 'Reindex all knowledge base entries to vector store' })
  async reindex(@Body() dto: ReindexDto) {
    return this.aiService.reindexAll(dto.provider as AiModelProvider);
  }

  // =============== Provider Management ===============

  @Get('providers')
  @ApiOperation({ summary: 'List available AI providers' })
  getProviders() {
    return { providers: this.llmFactory.getAllProviders(), active: this.llmFactory.getActiveProvider() };
  }

  @Post('providers/switch')
  @ApiOperation({ summary: 'Switch active AI provider' })
  switchProvider(@Body() dto: ProviderSwitchDto) {
    this.llmFactory.setActiveProvider(dto.provider as AiModelProvider);
    return { active: this.llmFactory.getActiveProvider() };
  }

  // =============== Analytics ===============

  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get AI assistant analytics dashboard' })
  async getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getDashboardStats(query.days || 30);
  }

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get AI performance report' })
  async getPerformance(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getPerformanceReport(
      query.from || new Date(Date.now() - 30 * 86400000).toISOString(),
      query.to || new Date().toISOString(),
    );
  }

  @Get('analytics/feedback')
  @ApiOperation({ summary: 'Get AI feedback list' })
  async getFeedback(@Query('page') page?: number, @Query('limit') limit?: number, @Query('resolved') resolved?: string) {
    return this.analytics.getFeedbackList(page, limit, resolved === 'true' ? true : resolved === 'false' ? false : undefined);
  }

  @Put('analytics/feedback/:id/resolve')
  @ApiOperation({ summary: 'Resolve a feedback entry' })
  async resolveFeedback(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.analytics.resolveFeedback(id, req.user!.id);
  }

  // =============== Health ===============

  @Get('health')
  @ApiOperation({ summary: 'AI module health check' })
  async healthCheck() {
    const provider = this.llmFactory.getActiveProvider();
    try {
      const models = await this.llmFactory.getProvider().getModels();
      return {
        status: 'operational',
        activeProvider: provider,
        availableModels: models.slice(0, 5),
        connectedUsers: 0,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return { status: 'degraded', activeProvider: provider, timestamp: new Date().toISOString() };
    }
  }
}
