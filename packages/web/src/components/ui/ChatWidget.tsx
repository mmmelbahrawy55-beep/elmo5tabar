'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiApi, ChatResponse, ConversationSummary } from '@/lib/api/ai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
  referencedDocs?: { title: string; titleAr?: string; relevance: number }[];
}

interface ChatWidgetProps {
  userRole: string;
  language?: 'ar' | 'en';
  onClose?: () => void;
  attachResults?: string[];
}

export default function ChatWidget({ userRole, language = 'ar', onClose, attachResults }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      const data = await aiApi.getConversations(1, 10);
      setConversations(data.items);
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let imageNames: string[] = [];
      if (uploadedImage) {
        const ocrResult = await aiApi.uploadOcr(uploadedImage, language);
        setUploadedImage(null);
      }

      const data: ChatResponse = await aiApi.chat({
        message: userMsg.content,
        conversationId,
        language,
        role: userRole,
        attachResults,
        attachImages: imageNames.length > 0 ? imageNames : undefined,
      });

      setConversationId(data.conversationId);
      setDisclaimer(data.disclaimer);

      const assistantMsg: Message = {
        id: data.messageId,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        suggestions: data.suggestions,
        referencedDocs: data.referencedDocs,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        content: language === 'ar'
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setDisclaimer('');
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const loadConversation = async (id: string) => {
    try {
      const conv = await aiApi.getConversation(id);
      setConversationId(id);
      setMessages(conv.messages.map((m: any) => ({
        id: m.id,
        content: m.content,
        role: m.role === 'USER' ? 'user' : 'assistant',
        timestamp: new Date(m.createdAt),
      })));
      setShowHistory(false);
    } catch { /* ignore */ }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '20px', [isRtl ? 'left' : 'right']: '20px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a5276, #2980b9)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}
        aria-label={language === 'ar' ? 'فتح المساعد الذكي' : 'Open AI Assistant'}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', bottom: '20px', [isRtl ? 'left' : 'right']: '20px',
        width: '380px', height: '600px', borderRadius: '16px',
        background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', direction: dir,
      }}
    >
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #1a5276, #2980b9)',
        color: 'white', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M5 13h14" />
            <path d="M12 13v6" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>
            {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowHistory(!showHistory)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <button onClick={() => { setIsOpen(false); onClose?.(); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {showHistory ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <button onClick={handleNewChat}
            style={{
              width: '100%', padding: '10px', marginBottom: '12px',
              background: '#e8f4f8', border: '1px dashed #2980b9',
              borderRadius: '8px', cursor: 'pointer', color: '#2980b9',
              fontWeight: 500, fontSize: '14px', textAlign: 'center',
            }}>
            {language === 'ar' ? '+ محادثة جديدة' : '+ New Conversation'}
          </button>
          {conversations.map(conv => (
            <div key={conv.id} onClick={() => loadConversation(conv.id)}
              style={{
                padding: '12px', marginBottom: '8px', borderRadius: '8px',
                background: '#f8f9fa', cursor: 'pointer',
                border: '1px solid #eee', transition: 'all 0.2s',
              }}>
              <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>
                {conv.title || (language === 'ar' ? 'محادثة' : 'Conversation')}
              </div>
              {conv.preview && (
                <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.preview}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString()}
                {' | '}{conv.messageCount} {language === 'ar' ? 'رسالة' : 'messages'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#f8f9fa' }}>
            {messages.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M5 13h14" />
                  <path d="M12 13v6" />
                </svg>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                  {language === 'ar' ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
                  {language === 'ar'
                    ? 'يمكنك سؤالي عن التحاليل المخبرية، تفسير النتائج، التعليمات قبل التحليل، أو حجز المواعيد.'
                    : 'Ask me about lab tests, result interpretation, preparation instructions, or appointment booking.'}
                </p>
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    language === 'ar' ? 'اشرح تحليل السكر التراكمي' : 'Explain HbA1c test',
                    language === 'ar' ? 'كيف أستعد لتحليل الدم؟' : 'How to prepare for blood test?',
                    language === 'ar' ? 'ما هي فحوصات الغدة الدرقية؟' : 'What are thyroid tests?',
                    language === 'ar' ? 'أريد حجز موعد' : 'I want to book an appointment',
                  ].map(s => (
                    <button key={s} onClick={() => handleSuggestionClick(s)}
                      style={{
                        padding: '8px 16px', borderRadius: '20px', background: 'white',
                        border: '1px solid #e0e0e0', cursor: 'pointer', fontSize: '12px',
                        color: '#555', textAlign: 'center',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: '12px',
                  background: msg.role === 'user' ? '#2980b9' : 'white',
                  color: msg.role === 'user' ? 'white' : '#333',
                  border: msg.role === 'user' ? 'none' : '1px solid #e0e0e0',
                  fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                  {msg.referencedDocs && msg.referencedDocs.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#f0f7ff', borderRadius: '6px', fontSize: '11px', color: '#666' }}>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                        {language === 'ar' ? 'المصادر:' : 'Sources:'}
                      </div>
                      {msg.referencedDocs.map((doc, i) => (
                        <div key={i} style={{ marginBottom: '2px' }}>
                          {language === 'ar' ? doc.titleAr || doc.title : doc.title}
                          {' '}({Math.round(doc.relevance * 100)}%)
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: '12px', background: 'white',
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2980b9', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2980b9', animation: 'pulse 1.5s infinite 0.3s' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2980b9', animation: 'pulse 1.5s infinite 0.6s' }} />
                  </div>
                </div>
              </div>
            )}

            {disclaimer && messages.length > 0 && (
              <div style={{ padding: '8px 12px', background: '#fff3cd', borderRadius: '8px', fontSize: '11px', color: '#856404', marginTop: '12px', lineHeight: 1.4 }}>
                {disclaimer}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length > 0 && messages[messages.length - 1].suggestions && (
            <div style={{ padding: '8px 16px', background: 'white', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {messages[messages.length - 1].suggestions?.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => handleSuggestionClick(s)}
                    style={{
                      whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '16px',
                      background: '#e8f4f8', border: 'none', cursor: 'pointer',
                      fontSize: '12px', color: '#2980b9', flexShrink: 0,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #eee' }}>
            {uploadedImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '6px 10px', background: '#f0f7ff', borderRadius: '8px', fontSize: '12px' }}>
                <span>{uploadedImage.name}</span>
                <button onClick={() => setUploadedImage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '14px' }}>&times;</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleImageUpload} style={{ display: 'none' }} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '24px',
                  border: '1px solid #ddd', outline: 'none', fontSize: '14px',
                  background: '#f5f6f8',
                }}
              />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: !input.trim() || isLoading ? '#ccc' : '#2980b9',
                  color: 'white', border: 'none', cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
      `}</style>
    </div>
  );
}
