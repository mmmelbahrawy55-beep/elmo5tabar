import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PushNotificationProvider {
  private readonly logger = new Logger(PushNotificationProvider.name);
  constructor(private config: ConfigService, private http: HttpService) {}  

  async send(token: string, title: string, body: string, extraData?: Record<string, string>, badge?: number, sound?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const serverKey = this.config.getOrThrow('FCM_SERVER_KEY');
      const { data: response } = await firstValueFrom(this.http.post('https://fcm.googleapis.com/fcm/send',
        { to: token, notification: { title, body, sound: sound || 'default', badge: badge || 1 }, priority: 'high', data: extraData },
        { headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' } },
      ));
      return { success: (response as any).success === 1, messageId: (response as any).message_id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async sendToMultiple(tokens: string[], title: string, body: string, extraData?: Record<string, string>): Promise<{ success: boolean; failedTokens?: string[] }> {
    const results = await Promise.allSettled(tokens.map(token => this.send(token, title, body, extraData)));
    const failures = results.filter(r => r.status === 'rejected').length;
    return { success: failures === 0, failedTokens: tokens.filter((_, i) => results[i].status === 'rejected') };
  }

  async sendToTopic(topic: string, title: string, body: string, extraData?: Record<string, string>): Promise<{ success: boolean }> {
    return { success: false };
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<{ success: number; failure: number }> {
    return { success: 0, failure: tokens.length };
  }

  async sendSilentPayload(token: string, extraData: Record<string, string>): Promise<boolean> {
    return false;
  }
}
