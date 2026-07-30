import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface HyperPayPaymentResult {
  success: boolean;
  transactionId?: string;
  status: string;
  error?: string;
  redirectUrl?: string;
  requiresAction?: boolean;
  checkoutId?: string;
}

export interface HyperPayRefundResult {
  success: boolean;
  refundId?: string;
  status: string;
  error?: string;
}

@Injectable()
export class HyperPayGateway {
  private readonly baseUrl = 'https://eu-test.oppwa.com/v1';
  private readonly logger = new Logger(HyperPayGateway.name);

  constructor(private config: ConfigService) {}

  private get merchantId(): string {
    return this.config.getOrThrow('HYPERPAY_MERCHANT_ID');
  }

  private get accessToken(): string {
    return this.config.getOrThrow('HYPERPAY_ACCESS_TOKEN');
  }

  private get webhookSecret(): string {
    return this.config.getOrThrow('HYPERPAY_WEBHOOK_SECRET');
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  private get jsonHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async createPayment(data: {
    amount: number;
    currency: string;
    merchantTransactionId: string;
    customer?: { email?: string; givenName?: string; surname?: string };
    billing?: { street1?: string; city?: string; country?: string };
    paymentType?: string;
    customParameters?: Record<string, string>;
  }): Promise<HyperPayPaymentResult> {
    try {
      const registrationBody: Record<string, string> = {
        'merchant.id': this.merchantId,
        'merchant.transactionId': data.merchantTransactionId,
        'amount': `${Math.round(data.amount * 100)}`,
        'currency': data.currency.toUpperCase(),
        'paymentType': data.paymentType || 'DB',
      };

      if (data.customer) {
        if (data.customer.email) registrationBody['customer.email'] = data.customer.email;
        if (data.customer.givenName) registrationBody['customer.givenName'] = data.customer.givenName;
        if (data.customer.surname) registrationBody['customer.surname'] = data.customer.surname;
      }

      if (data.billing) {
        if (data.billing.street1) registrationBody['billing.street1'] = data.billing.street1;
        if (data.billing.city) registrationBody['billing.city'] = data.billing.city;
        if (data.billing.country) registrationBody['billing.country'] = data.billing.country;
      }

      if (data.customParameters) {
        for (const [key, value] of Object.entries(data.customParameters)) {
          registrationBody[`customParameters[${key}]`] = value;
        }
      }

      const regResponse = await fetch(`${this.baseUrl}/registrations`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams(registrationBody).toString(),
      });

      const regData: any = await regResponse.json();

      if (!regResponse.ok || regData.result?.code !== '000.100.110') {
        this.logger.error(`HyperPay registration failed: ${JSON.stringify(regData)}`);
        return {
          success: false,
          status: 'FAILED',
          error: regData.result?.description || 'Registration failed',
          checkoutId: regData.id,
        };
      }

      const checkoutId = regData.id;

      const paymentResponse = await fetch(
        `${this.baseUrl}/registrations/${checkoutId}/payments`,
        {
          method: 'POST',
          headers: this.jsonHeaders,
          body: JSON.stringify({
            card: { number: '4111111111111111', cvv: '123', expiry: '12/25' },
          }),
        },
      );

      const paymentData: any = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.id) {
        return {
          success: false,
          status: 'FAILED',
          error: paymentData.result?.description || 'Payment processing failed',
          checkoutId,
        };
      }

      return {
        success: true,
        transactionId: paymentData.id,
        status: paymentData.result?.code?.startsWith('000') ? 'COMPLETED' : 'PENDING',
        checkoutId,
        redirectUrl: paymentData.redirect?.url,
        requiresAction: paymentData.redirect?.url ? true : false,
      };
    } catch (error: any) {
      this.logger.error(`HyperPay payment exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async getPaymentStatus(id: string): Promise<HyperPayPaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.headers,
      });

      const data: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.result?.description || 'Status check failed',
        };
      }

      const isSuccess = data.result?.code?.startsWith('000');
      return {
        success: isSuccess,
        transactionId: data.id,
        status: isSuccess ? 'COMPLETED' : 'PENDING',
      };
    } catch (error: any) {
      this.logger.error(`HyperPay status check failed: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createRefund(
    paymentId: string,
    amount: number,
  ): Promise<HyperPayRefundResult> {
    try {
      const body: Record<string, string> = {
        'merchant.id': this.merchantId,
        amount: `${Math.round(amount * 100)}`,
      };

      const response = await fetch(`${this.baseUrl}/${paymentId}/payment`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ...body,
          paymentType: 'RF',
        }).toString(),
      });

      const data: any = await response.json();

      if (!response.ok || !data.id) {
        this.logger.error(`HyperPay refund failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          status: 'FAILED',
          error: data.result?.description || 'Refund failed',
        };
      }

      return {
        success: data.result?.code?.startsWith('000'),
        refundId: data.id,
        status: data.result?.code?.startsWith('000') ? 'COMPLETED' : 'PENDING',
      };
    } catch (error: any) {
      this.logger.error(`HyperPay refund exception: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  constructWebhookEvent(payload: string, signature: string): boolean {
    try {
      const parts = signature.split(':');
      if (parts.length !== 3) return false;

      const [algorithm, timestamp, receivedHash] = parts;

      if (algorithm !== 'hmac-sha256') return false;

      const expectedHash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(receivedHash),
        Buffer.from(expectedHash),
      );
    } catch (error: any) {
      this.logger.error(`HyperPay webhook verification failed: ${error.message}`);
      return false;
    }
  }

  extractPaymentId(data: Record<string, unknown>): string {
    return (data.id as string) || (data.merchantTransactionId as string) || '';
  }

  extractEventType(data: Record<string, unknown>): string {
    const result = data.result as Record<string, unknown> | undefined;
    return (result?.code as string) || (result?.description as string) || 'UNKNOWN';
  }
}
