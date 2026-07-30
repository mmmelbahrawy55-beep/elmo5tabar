import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: string;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  status: string;
  error?: string;
}

@Injectable()
export class StripeGateway {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
    paymentMethodTypes: string[] = ['card'],
  ): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata,
        payment_method_types: paymentMethodTypes as any,
        automatic_payment_methods: { enabled: true },
      });
      return {
        success: true,
        transactionId: intent.id,
        status: intent.status,
        clientSecret: intent.client_secret,
      };
    } catch (error) {
      this.logger.error(`Stripe payment intent failed: ${error.message}`);
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : {},
      );
      return {
        success: intent.status === 'succeeded',
        transactionId: intent.id,
        status: intent.status,
      };
    } catch (error) {
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      return { success: true, refundId: refund.id, status: refund.status };
    } catch (error) {
      return { success: false, status: 'FAILED', error: error.message };
    }
  }

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer.id;
  }

  async createSetupIntent(customerId: string): Promise<string> {
    const intent = await this.stripe.setupIntents.create({
      customer: customerId,
    });
    return intent.client_secret;
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
