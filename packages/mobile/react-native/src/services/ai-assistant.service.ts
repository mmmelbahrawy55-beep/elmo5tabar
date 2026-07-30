import api from './api';
import { storage, StorageKeys } from './storage.service';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

class AIAssistantService {
  async sendMessage(
    text: string,
    conversationId?: string,
  ): Promise<{ message: Message; conversationId: string }> {
    const response = await api.post('/ai/chat', {
      text,
      conversationId,
    });
    return response.data.data;
  }

  async streamMessage(
    text: string,
    onChunk: (chunk: string) => void,
    conversationId?: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('text', text);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const response = await fetch(api.defaults.baseURL + '/ai/chat/stream', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(await import('./secure-storage.service')).secureStorageService.getTokens}`,
      },
      body: formData,
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        onChunk(chunk);
      }
    }

    return fullContent;
  }

  async voiceQuery(audioBase64: string): Promise<{ text: string; response: Message }> {
    const response = await api.post('/ai/voice', {
      audio: audioBase64,
    });
    return response.data.data;
  }

  async getConversationHistory(): Promise<Conversation[]> {
    const response = await api.get('/ai/conversations');
    const conversations = response.data.data;
    storage.setObject(StorageKeys.AI_CONVERSATIONS, conversations);
    return conversations;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data.data;
  }

  async clearConversation(id: string): Promise<void> {
    await api.delete(`/ai/conversations/${id}`);
  }

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/ai/conversations/${id}`);
  }

  async suggestActions(context: string): Promise<string[]> {
    const response = await api.post('/ai/suggest-actions', { context });
    return response.data.data;
  }

  async analyzeHealthData(dataType: string, dataId: string): Promise<string> {
    const response = await api.post('/ai/analyze', { dataType, dataId });
    return response.data.data.explanation;
  }

  async getCachedConversations(): Promise<Conversation[]> {
    const cached = storage.getObject<Conversation[]>(StorageKeys.AI_CONVERSATIONS);
    return cached ?? [];
  }
}

export const aiAssistantService = new AIAssistantService();
