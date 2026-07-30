'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/design-system/layout/Card';
import { Button } from '@/design-system/primitives/Button';
import { LoadingSpinner } from '@/design-system/feedback/Alert';
import { cn, formatDateTime } from '@/lib/utils';
import { aiApi, ChatResponse } from '@/lib/api/ai';
import VoiceAssistant from '@/components/ui/VoiceAssistant';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
  referencedDocs?: { title: string; titleAr?: string; relevance: number }[];
}

export default function PatientAIPage() {
  const { locale } = useParams();
  const isRtl = locale === 'ar';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [disclaimer, setDisclaimer] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { loadConversations(); }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await aiApi.getConversations(1, 20);
      setConversations(data.items);
    } catch { /* ignore */ }
    setLoadingConvs(false);
  };

  const handleSend = async (overrideMessage?: string) => {
    const msg = (overrideMessage || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(), content: msg, role: 'user', timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data: ChatResponse = await aiApi.chat({
        message: msg, conversationId, language: isRtl ? 'ar' : 'en', role: 'PATIENT',
      });
      setConversationId(data.conversationId);
      setDisclaimer(data.disclaimer);

      setMessages(prev => [...prev, {
        id: data.messageId, content: data.response, role: 'assistant',
        timestamp: new Date(), suggestions: data.suggestions,
        referencedDocs: data.referencedDocs,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        content: isRtl ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred.',
        role: 'assistant', timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoiceResponse = (text: string, _audioBase64: string) => {
    handleSend(text);
  };

  const handleNewChat = () => {
    setMessages([]); setConversationId(undefined); setDisclaimer(''); setShowHistory(false);
  };

  const loadConversation = async (id: string) => {
    try {
      const conv = await aiApi.getConversation(id);
      setConversationId(id);
      setMessages(conv.messages.map((m: any) => ({
        id: m.id, content: m.content,
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        timestamp: new Date(m.createdAt),
      })));
      setShowHistory(false);
    } catch { /* ignore */ }
  };

  const suggestions = [
    isRtl ? 'اشرح تحليل السكر التراكمي' : 'Explain HbA1c test',
    isRtl ? 'كيف أستعد لتحليل الدم؟' : 'How to prepare for blood test?',
    isRtl ? 'ما هي فحوصات الغدة الدرقية؟' : 'What are thyroid function tests?',
    isRtl ? 'متى تظهر نتائج التحاليل؟' : 'When do test results appear?',
  ];

  return (
    <div className="container mx-auto p-4 md:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {isRtl ? 'المساعد الذكي' : 'AI Assistant'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRtl ? 'اسأل عن التحاليل، تفسير النتائج، ونصائح الرعاية الصحية' : 'Ask about tests, result interpretation, and health tips'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="hidden lg:block lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{isRtl ? 'المحادثات السابقة' : 'Conversations'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 border-b">
                <button onClick={handleNewChat}
                  className="w-full py-2 px-3 bg-blue-50 text-blue-600 border border-dashed border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  {isRtl ? '+ محادثة جديدة' : '+ New Conversation'}
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                {loadingConvs ? (
                  <div className="flex justify-center p-6"><LoadingSpinner /></div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    {isRtl ? 'لا توجد محادثات سابقة' : 'No conversations yet'}
                  </div>
                ) : conversations.map((conv: any) => (
                  <div key={conv.id} onClick={() => loadConversation(conv.id)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${conv.id === conversationId ? 'bg-blue-50' : ''}`}>
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {conv.title || (isRtl ? 'محادثة' : 'Conversation')}
                    </div>
                    {conv.preview && (
                      <div className="text-xs text-gray-500 truncate mt-1">{conv.preview}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {conv.messageCount} {isRtl ? 'رسائل' : 'messages'}
                      {' | '}{conv.lastMessageAt ? formatDateTime(conv.lastMessageAt) : ''}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {conversationId
                    ? (isRtl ? 'المحادثة الحالية' : 'Current Conversation')
                    : (isRtl ? 'محادثة جديدة' : 'New Conversation')}
                </CardTitle>
                <div className="flex gap-2">
                  <button onClick={() => setShowVoice(!showVoice)}
                    className={`p-2 rounded-lg transition-colors ${showVoice ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    title={isRtl ? 'المساعد الصوتي' : 'Voice Assistant'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </button>
                  <button onClick={() => setShowHistory(!showHistory)}
                    className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 lg:hidden">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: '#f8f9fa' }}>
              {showVoice && (
                <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
                  <VoiceAssistant
                    userRole="PATIENT"
                    language={isRtl ? 'ar' : 'en'}
                    conversationId={conversationId}
                    onResponse={handleVoiceResponse}
                  />
                </div>
              )}

              {showHistory && (
                <div className="mb-4 lg:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">{isRtl ? 'المحادثات' : 'Conversations'}</h3>
                    <button onClick={handleNewChat} className="text-sm text-blue-600 font-medium">{isRtl ? '+ جديد' : '+ New'}</button>
                  </div>
                  {conversations.slice(0, 5).map((conv: any) => (
                    <div key={conv.id} onClick={() => loadConversation(conv.id)}
                      className="p-3 bg-white rounded-lg border border-gray-200 mb-2 cursor-pointer hover:border-blue-300 transition-colors">
                      <div className="font-medium text-sm">{conv.title || (isRtl ? 'محادثة' : 'Conversation')}</div>
                      <div className="text-xs text-gray-500 mt-1">{conv.messageCount} msgs</div>
                    </div>
                  ))}
                </div>
              )}

              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2980b9" strokeWidth="1.5">
                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                      <path d="M5 13h14" /><path d="M12 13v6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {isRtl ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    {isRtl
                      ? 'يمكنك سؤالي عن أي شيء يتعلق بالتحاليل المخبرية، تفسير النتائج، أو نصائح الرعاية الصحية.'
                      : 'Ask me anything about lab tests, result interpretation, or health tips.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => handleSend(s)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-bl-md'
                    }`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      {msg.referencedDocs && msg.referencedDocs.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-400/30">
                          <div className="text-xs opacity-70 mb-1">
                            {isRtl ? 'المصادر:' : 'Sources:'}
                          </div>
                          {msg.referencedDocs.map((doc, i) => (
                            <div key={i} className="text-xs opacity-60">
                              {isRtl ? doc.titleAr || doc.title : doc.title} ({Math.round(doc.relevance * 100)}%)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {disclaimer && messages.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 leading-relaxed">{disclaimer}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4 bg-white flex-shrink-0">
              <div className="flex gap-3 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRtl ? 'اكتب سؤالك هنا...' : 'Type your question...'}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                />
                <button onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={`p-3 rounded-xl transition-all ${
                    !input.trim() || isLoading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
