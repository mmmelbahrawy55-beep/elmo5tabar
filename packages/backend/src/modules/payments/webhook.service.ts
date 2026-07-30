import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { TapGateway } from './gateways/tap.gateway';
import { HyperPayGateway } from './gateways/hyperpay.gateway';
import { PayPalGateway } from './gateways/paypal.gateway';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeGateway: StripeGateway,
    private readonly tapGateway: TapGateway,
    private readonly hyperPayGateway: HyperPayGateway,
    private readonly paypalGateway: PayPalGateway,
  ) {}

  async processWebhook(
    provider: string,
    payload: Buffer | string,
    signature: string,
    headers?: Record<string, string>,
  ) {
    const rawPayload = typeof payload === 'string' ? payload : payload.toString();
    const eventId = this.extractEventId(provider, rawPayload);

    const isDuplicate = await this.checkIdempotency(eventId);
    if (isDuplicate) {
      this.logger.warn(`Duplicate webhook event ignored: ${eventId}`);
      return { processed: false, reason: 'duplicate_event' };
    }

    const isValid = await this.validateSignature(provider, rawPayload, signature, headers);
    if (!isValid) {
      this.logger.error(`Invalid webhook signature from ${provider}`);
      await this.logWebhook(provider, 'INVALID_SIGNATURE', rawPayload, 'FAILED');
      throw new BadRequestException('Invalid webhook signature');
    }

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(rawPayload);
    } catch {
      parsedPayload = {};
    }

    let result: Record<string, unknown>;

    switch (provider.toLowerCase()) {
      case 'stripe':
        result = await this.handleStripeWebhook(parsedPayload);
        break;
      case 'tap':
        result = await this.handleTapWebhook(parsedPayload);
        break;
      case 'hyperpay':
        result = await this.handleHyperPayWebhook(parsedPayload);
        break;
      case 'paypal':
        result = await this.handlePayPalWebhook(headers || {}, rawPayload);
        break;
      default:
        this.logger.warn(`Unknown webhook provider: ${provider}`);
        result = { processed: false, reason: 'unknown_provider' };
    }

    await this.logWebhook(provider, this.extractEventType(provider, rawPayload), rawPayload, 'PROCESSED');

    return { eventId, ...result };
  }

  async handleStripeWebhook(event: Record<string, unknown>) {
    const eventType = event.type as string;
    const data = event.data as Record<string, unknown>;
    const object = data?.object as Record<string, unknown>;

    this.logger.log(`Processing Stripe event: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded':
        return this.handleStripePaymentSucceeded(object);
      case 'payment_intent.payment_failed':
        return this.handleStripePaymentFailed(object);
      case 'charge.refunded':
        return this.handleStripeChargeRefunded(object);
      case 'charge.dispute.created':
        return this.handleStripeDisputeCreated(object);
      default:
        this.logger.log(`Unhandled Stripe event: ${eventType}`);
        return { processed: false, reason: 'unhandled_event_type' };
    }
  }

  private async handleStripePaymentSucceeded(paymentIntent: Record<string, unknown>) {
    const payment = await this.findPaymentByGatewayId(paymentIntent.id as string, 'stripe');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    await this.updatePaymentStatus(payment.id, 'COMPLETED', {
      stripePaymentIntentId: paymentIntent.id,
      amount: (paymentIntent.amount as number) / 100,
    });

    await this.updateInvoiceAfterPayment(payment.invoiceId as string);

    await this.createAuditLog('WEBHOOK_STRIPE_PAYMENT_SUCCEEDED', payment.id, payment.status, {
      paymentIntentId: paymentIntent.id,
    });

    return { processed: true, paymentId: payment.id };
  }

  private async handleStripePaymentFailed(paymentIntent: Record<string, unknown>) {
    const payment = await this.findPaymentByGatewayId(paymentIntent.id as string, 'stripe');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    await this.updatePaymentStatus(payment.id, 'FAILED', {
      stripePaymentIntentId: paymentIntent.id,
      error: (paymentIntent.last_payment_error as Record<string, unknown>)?.message,
    });

    await this.createAuditLog('WEBHOOK_STRIPE_PAYMENT_FAILED', payment.id, payment.status, {
      paymentIntentId: paymentIntent.id,
    });

    return { processed: true, paymentId: payment.id };
  }

  private async handleStripeChargeRefunded(charge: Record<string, unknown>) {
    const paymentIntentId = charge.payment_intent as string;
    const payment = await this.findPaymentByGatewayId(paymentIntentId, 'stripe');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    const refunds = charge.refunds as Record<string, unknown>;
    const data = refunds?.data as Array<Record<string, unknown>>;
    const lastRefund = data?.[0];

    if (lastRefund) {
      await (this.prisma as any).refund.upsert({
        where: { gatewayRefundId: lastRefund.id as string },
        create: {
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          patientId: payment.patientId,
          amount: (lastRefund.amount as number) / 100,
          currency: 'SAR',
          status: 'COMPLETED',
          gatewayRefundId: lastRefund.id as string,
          reason: 'Stripe refund',
        },
        update: { status: 'COMPLETED' },
      });
    }

    await this.createAuditLog('WEBHOOK_STRIPE_CHARGE_REFUNDED', payment.id, payment.status, {
      chargeId: charge.id,
    });

    return { processed: true, paymentId: payment.id };
  }

  private async handleStripeDisputeCreated(dispute: Record<string, unknown>) {
    const paymentIntentId = dispute.payment_intent as string;
    const payment = await this.findPaymentByGatewayId(paymentIntentId, 'stripe');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    await this.updatePaymentStatus(payment.id, 'DISPUTED', {
      disputeId: dispute.id,
      reason: dispute.reason,
    });

    await this.createAuditLog('WEBHOOK_STRIPE_DISPUTE_CREATED', payment.id, payment.status, {
      disputeId: dispute.id,
    });

    return { processed: true, paymentId: payment.id };
  }

  async handleTapWebhook(data: Record<string, unknown>) {
    const eventType = this.tapGateway.extractWebhookEventType(data);
    const paymentId = this.tapGateway.extractPaymentId(data);

    this.logger.log(`Processing Tap event: ${eventType} for payment: ${paymentId}`);

    const payment = await this.findPaymentByGatewayId(paymentId, 'tap');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    const statusMap: Record<string, string> = {
      CAPTURED: 'COMPLETED',
      AUTHORIZED: 'COMPLETED',
      FAILED: 'FAILED',
      DECLINED: 'FAILED',
      CANCELLED: 'CANCELLED',
      REFUNDED: 'REFUNDED',
    };

    const newStatus = statusMap[eventType] || payment.status as string;

    if (newStatus !== payment.status) {
      await this.updatePaymentStatus(payment.id, newStatus, data);
      if (newStatus === 'COMPLETED') {
        await this.updateInvoiceAfterPayment(payment.invoiceId as string);
      }
    }

    await this.createAuditLog(`WEBHOOK_TAP_${eventType}`, payment.id, payment.status, data);

    return { processed: true, paymentId: payment.id, status: newStatus };
  }

  async handleHyperPayWebhook(data: Record<string, unknown>) {
    const resultCode = this.hyperPayGateway.extractEventType(data);
    const paymentId = this.hyperPayGateway.extractPaymentId(data);

    this.logger.log(`Processing HyperPay event: ${resultCode} for payment: ${paymentId}`);

    const payment = await this.findPaymentByGatewayId(paymentId, 'hyperpay');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    const isSuccess = resultCode.startsWith('000');
    const isPending = resultCode.startsWith('800');
    const isFailed = resultCode.startsWith('900') || resultCode.startsWith('000.100.300');

    let newStatus: string;
    if (isSuccess) newStatus = 'COMPLETED';
    else if (isPending) newStatus = 'PROCESSING';
    else if (isFailed) newStatus = 'FAILED';
    else newStatus = payment.status as string;

    if (newStatus !== payment.status) {
      await this.updatePaymentStatus(payment.id, newStatus, data);
      if (newStatus === 'COMPLETED') {
        await this.updateInvoiceAfterPayment(payment.invoiceId as string);
      }
    }

    await this.createAuditLog('WEBHOOK_HYPERPAY_STATUS_CHANGED', payment.id, payment.status, data);

    return { processed: true, paymentId: payment.id, status: newStatus };
  }

  async handlePayPalWebhook(headers: Record<string, string>, body: string) {
    const parsedBody = JSON.parse(body) as Record<string, unknown>;
    const eventType = this.paypalGateway.extractEventType(parsedBody);
    const paymentId = this.paypalGateway.extractPaymentId(parsedBody);

    this.logger.log(`Processing PayPal event: ${eventType} for payment: ${paymentId}`);

    const payment = await this.findPaymentByGatewayId(paymentId, 'paypal');
    if (!payment) return { processed: false, reason: 'payment_not_found' };

    const statusMap: Record<string, string> = {
      'PAYMENT.CAPTURE.COMPLETED': 'COMPLETED',
      'PAYMENT.CAPTURE.DENIED': 'FAILED',
      'PAYMENT.CAPTURE.REFUNDED': 'REFUNDED',
      'PAYMENT.CAPTURE.PENDING': 'PROCESSING',
    };

    const newStatus = statusMap[eventType] || payment.status as string;

    if (newStatus !== payment.status) {
      await this.updatePaymentStatus(payment.id, newStatus, parsedBody);
      if (newStatus === 'COMPLETED') {
        await this.updateInvoiceAfterPayment(payment.invoiceId as string);
      }
    }

    await this.createAuditLog(`WEBHOOK_PAYPAL_${eventType}`, payment.id, payment.status, parsedBody);

    return { processed: true, paymentId: payment.id, status: newStatus };
  }

  async validateSignature(
    provider: string,
    payload: string,
    signature: string,
    headers?: Record<string, string>,
  ): Promise<boolean> {
    try {
      switch (provider.toLowerCase()) {
        case 'stripe':
          await this.stripeGateway.constructWebhookEvent(Buffer.from(payload), signature);
          return true;
        case 'tap':
          return this.tapGateway.constructWebhookEvent(payload, signature);
        case 'hyperpay':
          return this.hyperPayGateway.constructWebhookEvent(payload, signature);
        case 'paypal':
          return this.paypalGateway.constructWebhookEvent(headers || {}, payload);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Signature validation failed for ${provider}: ${(error as Error).message}`);
      return false;
    }
  }

  async checkIdempotency(eventId: string): Promise<boolean> {
    if (!eventId) return false;

    const existing = await (this.prisma as any).paymentWebhook.findFirst({
      where: { eventId, status: 'PROCESSED' },
    });

    return !!existing;
  }

  async logWebhook(
    provider: string,
    eventType: string,
    payload: string,
    status: string,
  ) {
    try {
      const eventId = this.extractEventId(provider, payload);

      await (this.prisma as any).paymentWebhook.create({
        data: {
          provider,
          eventType,
          eventId,
          payload: payload.substring(0, 5000),
          status,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log webhook: ${(error as Error).message}`);
    }
  }

  async retryFailedWebhooks() {
    const failedWebhooks = await (this.prisma as any).paymentWebhook.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    this.logger.log(`Retrying ${failedWebhooks.length} failed webhooks`);

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const webhook of failedWebhooks) {
      try {
        await this.processWebhook(
          webhook.provider,
          webhook.payload,
          '',
        );
        results.push({ id: webhook.id, success: true });
      } catch (error) {
        results.push({
          id: webhook.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      retried: failedWebhooks.length,
      results,
    };
  }

  private extractEventId(provider: string, payload: string): string {
    try {
      const parsed = JSON.parse(payload);
      switch (provider.toLowerCase()) {
        case 'stripe':
          return parsed.id || '';
        case 'tap':
          return parsed.id || parsed.data?.id || '';
        case 'hyperpay':
          return parsed.id || parsed.merchantTransactionId || '';
        case 'paypal':
          return parsed.id || '';
        default:
          return '';
      }
    } catch {
      return '';
    }
  }

  private extractEventType(provider: string, payload: string): string {
    try {
      const parsed = JSON.parse(payload);
      switch (provider.toLowerCase()) {
        case 'stripe':
          return parsed.type || '';
        case 'tap':
          return parsed.type || parsed.status || '';
        case 'hyperpay':
          return parsed.result?.code || '';
        case 'paypal':
          return parsed.event_type || '';
        default:
          return '';
      }
    } catch {
      return '';
    }
  }

  private async findPaymentByGatewayId(gatewayId: string, provider: string) {
    return (this.prisma as any).payment.findFirst({
      where: { gatewayId, gatewayProvider: provider },
    });
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: string,
    metadata?: Record<string, unknown>,
  ) {
    return (this.prisma as any).payment.update({
      where: { id: paymentId },
      data: {
        status,
        gatewayResponse: metadata ? JSON.stringify(metadata) : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        failedAt: status === 'FAILED' ? new Date() : undefined,
        disputedAt: status === 'DISPUTED' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });
  }

  private async updateInvoiceAfterPayment(invoiceId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return;

    const totalPaid = invoice.payments
      .filter((p: Record<string, unknown>) => p.status === 'COMPLETED')
      .reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);

    let newStatus: string;
    if (totalPaid >= invoice.total) newStatus = 'PAID';
    else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID';
    else return;

    await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAt: totalPaid >= invoice.total ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'WEBHOOK',
          entityId,
          previousState: previousState ? JSON.stringify(previousState) : null,
          newState: JSON.stringify(metadata),
          metadata: JSON.stringify(metadata),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`);
    }
  }
}
