import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TapPaymentResult {
  success: boolean;
  transactionId?: string;
  status: string;
  error?: string;
  redirectUrl?: string;
  requiresAction?: boolean;
}

export interface TapRefundResult {
  success: boolean;
  refundId?: string;
  status: string;
  error?: string;
}

@Injectable()
export class TapGateway {
  private readonly baseUrl = 'https://api.tap.company/v2';
  private readonly logger = new Logger(TapGateway.name);

  constructor(private config: ConfigService) {}

  private get apiKey(): string {
    return this.config.getOrThrow('TAP_SECRET_KEY');
  }

  private get webhookSecret(): string {
    return this.config.getOrThrow('TAP_WEBHOOK_SECRET');
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createPayment(
    amount: number,
    currency: string,
    customer: { id?: string; email: string; name: string; phone?: string },
    card?: { token?: string; saveCard?: boolean },
    metadata: Record<string, string> = {},
  ): Promise<TapPaymentResult> {
    try {
      const body: Record<string, unknown> = {
        amount: Math.round(amount * 100),
        currency: currency.toUpperCase(),
        customer: {
          email: customer.email,
          name: customer.name,
          ...(customer.phone && { phone: { number: customer.phone } }),
        },
        source: { id: 'src_all' },
        description: metadata.description || 'Payment',
        metadata,
        redirect: { url: this.config.get('TAP_REDIRECT_URL', '') },
        post: { url: this.config.get('TAP_POST_URL', '') },
      };

      if (card?.token) {
        body.source = { id: card.token };
      }

      if (customer.id) {
        (body.customer as Record<string, unknown>).id = customer.id;
      }

      if (card?.saveCard) {
        body.saveCard = true;
      }

      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Tap payment failed: ${data.message || response.statusText}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Payment creation failed',
        };
      }

      return {
        success: true,
        transactionId: data.id,
        status: data.status,
        redirectUrl: data.transaction?.url,
        requiresAction: data.status === 'INITIATED',
      };
    } catch (error: any) {
      this.logger.error(`Tap payment exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<TapPaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/charges/${paymentId}`, {
        method: 'GET',
        headers: this.headers,
      });

      const data: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Failed to retrieve payment status',
        };
      }

      return {
        success: data.status === 'CAPTURED',
        transactionId: data.id,
        status: data.status,
      };
    } catch (error: any) {
      this.logger.error(`Tap status check failed: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createRefund(
    paymentId: string,
    amount?: number,
  ): Promise<TapRefundResult> {
    try {
      const body: Record<string, unknown> = {
        chargeId: paymentId,
      };

      if (amount) {
        body.amount = Math.round(amount * 100);
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Tap refund failed: ${data.message || response.statusText}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.message || 'Refund creation failed',
        };
      }

      return {
        success: true,
        refundId: data.id,
        status: data.status,
      };
    } catch (error: any) {
      this.logger.error(`Tap refund exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createCustomer(
    email: string,
    name: string,
    phone?: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        email,
        name,
        ...(phone && { phone: { number: phone } }),
        metadata,
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Tap customer');
    }
    return data.id;
  }

  async getCustomer(customerId: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: this.headers,
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve Tap customer');
    }
    return data;
  }

  constructWebhookEvent(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      const sig = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
      return sig;
    } catch (error: any) {
      this.logger.error(`Tap webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  extractWebhookEventType(data: Record<string, unknown>): string {
    return (data.type as string) || (data.status as string) || 'UNKNOWN';
  }

  extractPaymentId(data: Record<string, unknown>): string {
    return (data.id as string) || (data.chargeId as string) || '';
  }
}
