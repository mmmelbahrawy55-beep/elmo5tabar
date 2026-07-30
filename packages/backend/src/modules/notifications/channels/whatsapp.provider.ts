import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion = 'v18.0';

  constructor(private config: ConfigService, private http: HttpService) {
    this.phoneNumberId = this.config.getOrThrow('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.config.getOrThrow('WHATSAPP_ACCESS_TOKEN');
  }

  async send(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data } = await firstValueFrom(this.http.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        { messaging_product: 'whatsapp', recipient_type: 'individual', to: to.replace(/^\+/, ''), type: 'text', text: { preview_url: false, body } },
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      ));
      return { success: true, messageId: (data as any).messages?.[0]?.id };
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${(error as any).response?.data?.error?.message || (error as Error).message}`);
      return { success: false, error: (error as any).response?.data?.error?.message || (error as Error).message };
    }
  }

  async sendTemplate(to: string, templateName: string, components: any[], lang: string = 'ar'): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data } = await firstValueFrom(this.http.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        { messaging_product: 'whatsapp', recipient_type: 'individual', to: to.replace(/^\+/, ''), type: 'template', template: { name: templateName, language: { code: lang === 'ar' ? 'ar' : 'en' }, components } },
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      ));
      return { success: true, messageId: (data as any).messages?.[0]?.id };
    } catch (error) {
      return { success: false, error: (error as any).response?.data?.error?.message || (error as Error).message };
    }
  }

  async sendMedia(to: string, mediaUrl: string, mediaType: string = 'image', caption?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const body: any = { messaging_product: 'whatsapp', recipient_type: 'individual', to: to.replace(/^\+/, ''), type: mediaType, [mediaType]: { link: mediaUrl } };
    if (caption) body[mediaType].caption = caption;
    try {
      const { data: response } = await firstValueFrom(this.http.post(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`, body, { headers: { Authorization: `Bearer ${this.accessToken}` } }));
      return { success: true, messageId: (response as any).messages?.[0]?.id };
    } catch (error) {
      return { success: false, error: (error as any).response?.data?.error?.message || (error as Error).message };
    }
  }

  async sendMarkdown(to: string, markdown: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.send(to, markdown);
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) return challenge;
    return null;
  }
}
