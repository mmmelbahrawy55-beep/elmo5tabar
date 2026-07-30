export interface ChatRequest {
  conversationId?: string;
  message: string;
  language?: 'ar' | 'en';
  role: 'PATIENT' | 'DOCTOR' | 'LAB_TECHNICIAN' | 'RECEPTIONIST' | 'ADMIN';
  attachResults?: string[];
  attachImages?: string[];
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  message: string;
  messageAr?: string;
  timestamp: string;
  referencedDocs: ReferencedDoc[];
  model: string;
  provider: string;
  latencyMs: number;
  suggestions?: string[];
  disclaimer?: string;
}

export interface ReferencedDoc {
  id: string;
  title: string;
  titleAr?: string;
  documentType: string;
  relevance: number;
}

export interface StreamChunk {
  type: 'text' | 'suggestions' | 'disclaimer' | 'done' | 'error';
  content: string;
  conversationId?: string;
  messageId?: string;
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

export interface SearchRequest {
  query: string;
  language?: 'ar' | 'en';
  documentType?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
  documentType: string;
  category?: string;
  relevance: number;
  source?: string;
}

export interface InterpretRequest {
  reportId: string;
  language?: 'ar' | 'en';
  focus?: string;
}

export interface VoiceRequest {
  audio: Buffer;
  language?: 'ar' | 'en';
  conversationId?: string;
  role: string;
}

export interface VoiceResponse {
  text: string;
  audio: Buffer;
  mimeType: string;
  conversationId: string;
}
