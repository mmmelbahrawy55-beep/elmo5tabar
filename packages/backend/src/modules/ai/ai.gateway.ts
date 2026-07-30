import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationService } from './services/conversation.service';
import { SpeechService } from './services/speech.service';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  language?: 'ar' | 'en';
}

@WebSocketGateway({
  namespace: '/ai',
  cors: { origin: '*', credentials: true },
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private conversationService: ConversationService,
    private speechService: SpeechService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = process.env.JWT_SECRET || 'default-secret';
      const payload = jwt.verify(token as string, secret) as any;
      client.userId = payload.sub || payload.id;
      client.userRole = payload.role || 'PATIENT';
      client.language = (client.handshake.query?.language as any) || 'ar';
      this.connectedClients.set(client.id, client);
      client.join(`user:${client.userId}`);
      this.server.to(`user:${client.userId}`).emit('connected', { userId: client.userId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('chat:message')
  async handleChatMessage(
    @MessageBody() data: { message: string; conversationId?: string; language?: 'ar' | 'en'; attachResults?: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const language = data.language || client.language || 'ar';
      const result = await this.conversationService.processMessage(
        data.conversationId,
        client.userId!,
        client.userRole!,
        data.message,
        language,
        { attachResults: data.attachResults },
      );

      client.emit('chat:response', {
        conversationId: result.conversationId,
        messageId: result.messageId,
        message: result.response,
        referencedDocs: result.referencedDocs,
        latencyMs: result.latencyMs,
        suggestions: result.suggestions,
        disclaimer: result.disclaimer,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'An error occurred' });
    }
  }

  @SubscribeMessage('chat:stream')
  async handleStreamMessage(
    @MessageBody() data: { message: string; conversationId?: string; language?: 'ar' | 'en' },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const language = data.language || client.language || 'ar';
      const result = await this.conversationService.processMessage(
        data.conversationId,
        client.userId!,
        client.userRole!,
        data.message,
        language,
      );

      const words = result.response.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ');
        client.emit('chat:stream', { type: 'text', content: chunk, done: false });
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      client.emit('chat:stream', { type: 'suggestions', content: result.suggestions, done: false });
      client.emit('chat:stream', { type: 'disclaimer', content: result.disclaimer, done: false });
      client.emit('chat:stream', {
        type: 'done', content: '', conversationId: result.conversationId,
        messageId: result.messageId, done: true,
      });
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'An error occurred' });
    }
  }

  @SubscribeMessage('voice:input')
  async handleVoiceInput(
    @MessageBody() data: { audio: string; language?: 'ar' | 'en'; conversationId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const audioBuffer = Buffer.from(data.audio, 'base64');
      const sttResult = await this.speechService.speechToText(audioBuffer, data.language || client.language);

      if (!sttResult.text) {
        client.emit('voice:error', { message: 'Could not recognize speech' });
        return;
      }

      client.emit('voice:transcript', { text: sttResult.text, confidence: sttResult.confidence });

      const chatResult = await this.conversationService.processMessage(
        data.conversationId,
        client.userId!,
        client.userRole!,
        sttResult.text,
        data.language || client.language || 'ar',
      );

      const ttsResult = await this.speechService.textToSpeech(chatResult.response, data.language || client.language);

      client.emit('voice:response', {
        text: chatResult.response,
        audio: ttsResult.audio.toString('base64'),
        mimeType: ttsResult.mimeType,
        conversationId: chatResult.conversationId,
        messageId: chatResult.messageId,
      });
    } catch (error: any) {
      client.emit('voice:error', { message: error.message || 'Voice processing failed' });
    }
  }

  @SubscribeMessage('conversation:history')
  async handleHistory(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const conversation = await this.conversationService.getConversation(data.conversationId, client.userId);
      client.emit('conversation:history', conversation);
    } catch (error: any) {
      client.emit('conversation:error', { message: error.message });
    }
  }

  @SubscribeMessage('conversation:list')
  async handleList(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const result = await this.conversationService.listConversations(client.userId!, data.page, data.limit);
    client.emit('conversation:list', result);
  }

  @SubscribeMessage('conversation:delete')
  async handleDelete(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      await this.conversationService.deleteConversation(data.conversationId, client.userId!);
      client.emit('conversation:deleted', { conversationId: data.conversationId });
    } catch (error: any) {
      client.emit('conversation:error', { message: error.message });
    }
  }

  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }
}
