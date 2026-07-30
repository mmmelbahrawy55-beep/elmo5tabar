import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SMSProvider {
  private readonly logger = new Logger(SMSProvider.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly senderNumber: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.provider = this.config.get('SMS_PROVIDER', 'twilio');
    this.apiKey = this.config.get('SMS_API_KEY', '');
    this.apiSecret = this.config.get('SMS_API_SECRET', '');
    this.senderNumber = this.config.get('SMS_SENDER_NUMBER', '+966500000000');
  }

  async send(phone: string, message: string): Promise<boolean> {
    try {
      if (this.provider === 'twilio') {
        return await this.sendViaTwilio(phone, message);
      }
      this.logger.log(`[DEV] SMS to ${phone}: ${message}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      return false;
    }
  }

  private async sendViaTwilio(
    phone: string,
    message: string,
  ): Promise<boolean> {
    const accountSid = this.apiKey;
    const authToken = this.apiSecret;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    await firstValueFrom(
      this.http.post(
        url,
        new URLSearchParams({
          To: phone,
          From: this.senderNumber,
          Body: message,
        }).toString(),
        {
          auth: { username: accountSid, password: authToken },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );
    return true;
  }

  async sendOTP(
    phone: string,
    code: string,
    lang: string = 'ar',
  ): Promise<boolean> {
    const message =
      lang === 'ar'
        ? `رمز التحقق من المختبر: ${code}\nصالح لمدة 5 دقائق.\nلا تشارك هذا الرمز مع أي شخص.`
        : `Your Al Mokhtabar verification code: ${code}\nValid for 5 minutes.\nDo not share this code.`;
    return this.send(phone, message);
  }
}
