import api from '../api';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  language?: 'ar' | 'en';
  role: string;
  attachResults?: string[];
  attachImages?: string[];
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
  referencedDocs: { id: string; title: string; titleAr?: string; documentType: string; relevance: number }[];
  model: string;
  provider: string;
  latencyMs: number;
  suggestions: string[];
  disclaimer: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  language: string;
  messageCount: number;
  lastMessageAt: string;
  status: string;
  preview?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  score: number;
  url?: string;
}

export const aiApi = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    const res = await api.post('/ai/chat', data);
    return res.data;
  },

  interpretResults: async (reportId: string, language?: 'ar' | 'en', focus?: string) => {
    const res = await api.post('/ai/interpret', { reportId, language, focus });
    return res.data;
  },

  getConversations: async (page = 1, limit = 20) => {
    const res = await api.get('/ai/conversations', { params: { page, limit } });
    return res.data;
  },

  getConversation: async (id: string) => {
    const res = await api.get(`/ai/conversations/${id}`);
    return res.data;
  },

  deleteConversation: async (id: string) => {
    await api.delete(`/ai/conversations/${id}`);
  },

  search: async (query: string, options?: { language?: string; types?: string[]; page?: number; limit?: number }) => {
    const res = await api.post('/ai/search', { query, ...options });
    return res.data;
  },

  voice: async (audio: string, role: string, language?: 'ar' | 'en', conversationId?: string) => {
    const res = await api.post('/ai/voice', { audio, role, language, conversationId });
    return res.data;
  },

  speechToText: async (audio: string, language?: 'ar' | 'en') => {
    const res = await api.post('/ai/voice/stt', { audio, language });
    return res.data;
  },

  textToSpeech: async (text: string, language?: 'ar' | 'en') => {
    const res = await api.post('/ai/voice/tts', { text, language });
    return res.data;
  },

  uploadOcr: async (file: File, language?: 'ar' | 'en') => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/ai/ocr', form, {
      params: { language },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  submitFeedback: async (messageId: string, rating: string, comment?: string) => {
    const res = await api.post(`/ai/feedback/${messageId}`, { rating, comment });
    return res.data;
  },

  getDashboard: async (days = 30) => {
    const res = await api.get('/ai/analytics/dashboard', { params: { days } });
    return res.data;
  },

  getPerformance: async (from: string, to: string) => {
    const res = await api.get('/ai/analytics/performance', { params: { from, to } });
    return res.data;
  },

  getProviders: async () => {
    const res = await api.get('/ai/providers');
    return res.data;
  },

  switchProvider: async (provider: string) => {
    const res = await api.post('/ai/providers/switch', { provider });
    return res.data;
  },

  healthCheck: async () => {
    const res = await api.get('/ai/health');
    return res.data;
  },
};
