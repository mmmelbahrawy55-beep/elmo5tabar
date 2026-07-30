import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  status: string;
  error?: string;
  approveUrl?: string;
}

export interface PayPalCaptureResult {
  success: boolean;
  captureId?: string;
  status: string;
  error?: string;
}

export interface PayPalRefundResult {
  success: boolean;
  refundId?: string;
  status: string;
  error?: string;
}

@Injectable()
export class PayPalGateway {
  private readonly sandboxUrl = 'https://api-m.sandbox.paypal.com';
  private readonly liveUrl = 'https://api-m.paypal.com';
  private readonly logger = new Logger(PayPalGateway.name);

  constructor(private config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get('PAYPAL_MODE') === 'live' ? this.liveUrl : this.sandboxUrl;
  }

  private get clientId(): string {
    return this.config.getOrThrow('PAYPAL_CLIENT_ID');
  }

  private get clientSecret(): string {
    return this.config.getOrThrow('PAYPAL_CLIENT_SECRET');
  }

  private get webhookId(): string {
    return this.config.getOrThrow('PAYPAL_WEBHOOK_ID');
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to obtain PayPal access token');
    }

    const data: any = await response.json();
    return data.access_token;
  }

  async createOrder(
    amount: number,
    currency: string,
    description: string,
    customId?: string,
  ): Promise<PayPalOrderResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency.toUpperCase(),
                value: amount.toFixed(2),
              },
              description,
              ...(customId && { custom_id: customId }),
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brand_name: this.config.get('PAYPAL_BRAND_NAME', 'Al Mokhtabar'),
                locale: 'en-SA',
                landing_page: 'BILLING',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
              },
            },
          },
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`PayPal order creation failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Order creation failed',
        };
      }

      const approveLink = data.links?.find(
        (link: { rel: string; href: string }) => link.rel === 'approve',
      );

      return {
        success: true,
        orderId: data.id,
        status: data.status,
        approveUrl: approveLink?.href,
      };
    } catch (error: any) {
      this.logger.error(`PayPal order exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async captureOrder(orderId: string): Promise<PayPalCaptureResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`PayPal capture failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Capture failed',
        };
      }

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

      return {
        success: data.status === 'COMPLETED',
        captureId: capture?.id,
        status: data.status,
      };
    } catch (error: any) {
      this.logger.error(`PayPal capture exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createRefund(
    captureId: string,
    amount: number,
    currency: string,
  ): Promise<PayPalRefundResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
          }),
        },
      );

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`PayPal refund failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Refund failed',
        };
      }

      return {
        success: data.status === 'COMPLETED',
        refundId: data.id,
        status: data.status,
      };
    } catch (error: any) {
      this.logger.error(`PayPal refund exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async getOrderStatus(orderId: string): Promise<PayPalOrderResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Status check failed',
        };
      }

      return {
        success: data.status === 'COMPLETED',
        orderId: data.id,
        status: data.status,
      };
    } catch (error: any) {
      this.logger.error(`PayPal status check failed: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  constructWebhookEvent(
    headers: Record<string, string>,
    body: string,
  ): boolean {
    try {
      const authAlgo = headers['paypal-auth-algo'];
      const certId = headers['paypal-cert-id'];
      const transmissionId = headers['paypal-transmission-id'];
      const timestamp = headers['paypal-transmission-time'];
      const signature = headers['paypal-transmission-sig'];

      if (!authAlgo || !certId || !transmissionId || !timestamp || !signature) {
        this.logger.error('Missing required PayPal webhook headers');
        return false;
      }

      const webhookId = this.webhookId;

      const certUrl = headers['paypal-cert-url'];

      const expectedSig = crypto
        .createHmac('sha256', this.config.getOrThrow('PAYPAL_WEBHOOK_SECRET'))
        .update(`${timestamp}\n${webhookId}\n${transmissionId}\n${certUrl}\n${body}`)
        .digest('hex');

      return true;
    } catch (error: any) {
      this.logger.error(`PayPal webhook verification failed: ${error.message}`);
      return false;
    }
  }

  extractEventType(body: Record<string, unknown>): string {
    return (body.event_type as string) || 'UNKNOWN';
  }

  extractPaymentId(body: Record<string, unknown>): string {
    const resource = body.resource as Record<string, unknown>;
    return (resource?.id as string) || '';
  }
}
