import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VoiceCallProvider {
  private readonly logger = new Logger(VoiceCallProvider.name);
  private client: any;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get('TWILIO_AUTH_TOKEN');
    if (accountSid && authToken && typeof require !== 'undefined') {
      try {
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
      } catch { this.logger.warn('Twilio not available, voice disabled'); }
    }
  }

  async makeCall(to: string, message: string, lang: string = 'ar'): Promise<{ success: boolean; callSid?: string; error?: string }> {
    try {
      const from = this.config.getOrThrow('TWILIO_PHONE_NUMBER');
      const twiml = `<Response><Say language="${lang === 'ar' ? 'ar-SA' : 'en-US'}" voice="Polly.Zeina">${this.escapeXml(message)}</Say></Response>`;
      const call = await this.client.calls.create({ twiml, to, from });
      return { success: true, callSid: call.sid };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async makeAppointmentReminder(to: string, patientName: string, date: string, time: string, branch: string, lang: string = 'ar'): Promise<{ success: boolean; callSid?: string }> {
    const message = lang === 'ar'
      ? `مرحباً ${patientName}، تذكير بموعدك في ${branch} يوم ${date} الساعة ${time}. يرجى الحضور قبل الموعد بـ 15 دقيقة. شكراً لاختياركم المختبر.`
      : `Hello ${patientName}, this is a reminder for your appointment at ${branch} on ${date} at ${time}. Please arrive 15 minutes early. Thank you for choosing Al Mokhtabar Laboratory.`;
    return this.makeCall(to, message, lang);
  }

  async makeCriticalResultCall(to: string, patientName: string, doctorName: string, lang: string = 'ar'): Promise<{ success: boolean; callSid?: string }> {
    const message = lang === 'ar'
      ? `عاجل: رسالة من الدكتور ${doctorName} بخصوص نتيجة تحليل المريض ${patientName}. يرجى الاتصال بالمختبر فوراً على الرقم ٩٢٠٠٠٠٠٠٠.`
      : `Urgent message from Dr. ${doctorName} regarding test result for patient ${patientName}. Please call the laboratory immediately at 920000000.`;
    return this.makeCall(to, message, lang);
  }

  async checkCallStatus(callSid: string): Promise<string> {
    try {
      const call = await this.client.calls(callSid).fetch();
      return call.status;
    } catch { return 'unknown'; }
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}
