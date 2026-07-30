import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GuardrailResult {
  blocked: boolean;
  reason?: string;
  response?: string;
  risk: 'none' | 'low' | 'medium' | 'high';
}

@Injectable()
export class GuardrailsService {
  private readonly logger = new Logger(GuardrailsService.name);

  private readonly blockedPatterns: RegExp[] = [
    /\b(diagnose|diagnosis|diagnostic)\s+(me|my|myself)\b/i,
    /\b(prescribe|prescription|prescribing)\b/i,
    /\b(self[- ]?medicate|self[- ]?medication)\b/i,
    /\b(how\s+to\s+)(abort|terminate|induce)\b/i,
    /\b(suicide|kill\s+myself|harm\s+myself)\b/i,
    /\b(illegal\s+drugs|illicit\s+substances?|buy\s+.*drugs)\b/i,
    /\b(bypass|hack|crack|exploit)\s+(the\s+)?(system|security|password)\b/i,
    /\b(protected\s+health\s+information|phi)\s+(of|for)\s+(another|someone\s+else)\b/i,
  ];

  private readonly highRiskPatterns: RegExp[] = [
    /\b(emergency|urgent|immediate|critical)\s+(care|treatment|help|assistance)\b/i,
    /\b(heart\s+attack|stroke|seizure|anaphylaxis|unconscious)\b/i,
    /\b(bleeding|hemorrhage|poisoning|overdose)\b/i,
    /\b(chest\s+pain|difficulty\s+breathing|shortness\s+of\s+breath)\b/i,
  ];

  private readonly promptInjectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|commands|directions)/i,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|commands|directions)/i,
    /you\s+are\s+(now|not)\s+(an?\s+)?(AI|assistant|chatbot|bot)/i,
    /act\s+as\s+(if\s+)?you\s+are/i,
    /new\s+(instructions|commands|directions|rules)/i,
    /system\s+(prompt|message|instruction)/i,
    /do\s+not\s+(follow|obey|listen)/i,
    /override\s+(instructions|commands|protocol)/i,
  ];

  constructor(private config: ConfigService) {}

  async check(message: string, _language?: 'ar' | 'en'): Promise<GuardrailResult> {
    const trimmed = message.trim().toLowerCase();

    for (const pattern of this.promptInjectionPatterns) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Prompt injection detected: ${message.slice(0, 100)}`);
        return {
          blocked: true,
          reason: 'Prompt injection attempt detected',
          risk: 'high',
          response: _language === 'ar'
            ? 'عذراً، لا يمكنني معالجة هذا الطلب. يرجى طرح سؤالك بطريقة مباشرة.'
            : 'Sorry, I cannot process this request. Please ask your question directly.',
        };
      }
    }

    for (const pattern of this.blockedPatterns) {
      if (pattern.test(trimmed)) {
        this.logger.warn(`Blocked pattern matched: ${pattern}`);
        return {
          blocked: true,
          reason: `Content blocked by policy: ${pattern}`,
          risk: 'medium',
          response: _language === 'ar'
            ? 'عذراً، لا يمكنني تقديم تشخيصات طبية أو وصفات علاجية. هذه المعلومات لأغراض تعليمية فقط. يُرجى استشارة طبيبك للحصول على التشخيص والعلاج المناسبين.'
            : 'Sorry, I cannot provide medical diagnoses or prescriptions. This information is for educational purposes only. Please consult your physician for proper diagnosis and treatment.',
        };
      }
    }

    for (const pattern of this.highRiskPatterns) {
      if (pattern.test(trimmed)) {
        return {
          blocked: false,
          reason: `High-risk medical situation detected`,
          risk: 'high',
          response: undefined,
        };
      }
    }

    return { blocked: false, risk: 'none' };
  }

  isPromptInjection(message: string): boolean {
    return this.promptInjectionPatterns.some(p => p.test(message.toLowerCase()));
  }
}
