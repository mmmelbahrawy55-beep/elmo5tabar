import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import {
  ProcessPaymentDto,
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processPayment(dto: ProcessPaymentDto) {
    this.logger.log(`Processing payment for invoice ${dto.invoiceId}, amount ${dto.amount} ${dto.currency || 'SAR'}`);

    if (dto.idempotencyKey) {
      const existing = await this.validateIdempotencyKey(dto.idempotencyKey);
      if (existing) throw new ConflictException('Payment already processed with this idempotency key');
    }

    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { items: true, payments: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
    if (invoice.status === 'PAID' || invoice.status === 'VOIDED' || invoice.status === 'CANCELLED') {
      throw new BadRequestException(`Invoice ${invoice.invoiceNumber} is not payable (status: ${invoice.status})`);
    }

    const totalPaid = invoice.payments
      .filter((p: Record<string, unknown>) => ['COMPLETED', 'PENDING', 'PROCESSING'].includes(p.status as string))
      .reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);
    const remainingAmount = invoice.total - totalPaid;
    if (dto.amount > remainingAmount) {
      throw new BadRequestException(`Payment amount ${dto.amount} exceeds remaining balance ${remainingAmount}`);
    }

    const payment = await (this.prisma as any).payment.create({
      data: {
        invoiceId: dto.invoiceId,
        patientId: invoice.patientId,
        method: dto.method,
        amount: dto.amount,
        currency: dto.currency || 'SAR',
        status: 'PENDING',
        cardLast4: dto.cardLast4,
        cardBrand: dto.cardBrand,
        description: dto.description,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        idempotencyKey: dto.idempotencyKey,
        branchId: dto.branchId || invoice.branchId,
      },
    });

    await this.createAuditLog('PAYMENT_INITIATED', payment.id, null, {
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      method: dto.method,
    });

    try {
      const gatewayResult = await this.routeToGateway(dto, payment.id);
      await this.updatePaymentStatus(payment.id, gatewayResult.status, gatewayResult.gatewayId, gatewayResult.gatewayResponse);
      await this.updateInvoiceAfterPayment(dto.invoiceId);
      await this.createAuditLog('PAYMENT_COMPLETED', payment.id, 'PENDING', {
        gatewayId: gatewayResult.gatewayId,
        method: dto.method,
        amount: dto.amount,
      });
    } catch (error) {
      await this.updatePaymentStatus(payment.id, 'FAILED', null, { error: (error as Error).message });
      await this.createAuditLog('PAYMENT_FAILED', payment.id, 'PENDING', {
        error: (error as Error).message,
        method: dto.method,
      });
      throw error;
    }

    return (this.prisma as any).payment.findUnique({
      where: { id: payment.id },
      include: { invoice: true, patient: true },
    });
  }

  async getPayment(id: string) {
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id },
      include: {
        invoice: { include: { items: true } },
        patient: true,
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  async getPatientPayments(patientId: string, filters: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, method, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { patientId };
    if (status) where.status = status;
    if (method) where.method = method;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [payments, total] = await Promise.all([
      (this.prisma as any).payment.findMany({
        where,
        include: { invoice: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPaymentByGatewayId(gatewayId: string) {
    const payment = await (this.prisma as any).payment.findFirst({
      where: { gatewayId },
      include: { invoice: true, patient: true },
    });
    if (!payment) throw new NotFoundException(`Payment with gateway ID ${gatewayId} not found`);
    return payment;
  }

  async getPaymentStats(branchId?: string, dateFrom?: string, dateTo?: string) {
    const where: Record<string, unknown> = { status: 'COMPLETED' };
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const payments = await (this.prisma as any).payment.findMany({
      where,
      select: { amount: true, method: true, currency: true, createdAt: true },
    });

    const totalRevenue = payments.reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);
    const byMethod: Record<string, number> = {};
    payments.forEach((p: Record<string, unknown>) => {
      const method = p.method as string;
      byMethod[method] = (byMethod[method] || 0) + (p.amount as number);
    });

    const totalRefunds = await (this.prisma as any).refund.aggregate({
      where: {
        status: 'COMPLETED',
        ...(branchId && { payment: { branchId } }),
      },
      _sum: { amount: true },
    });

    const netRevenue = totalRevenue - (totalRefunds._sum.amount || 0);
    const transactionCount = payments.length;
    const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      totalRevenue,
      netRevenue,
      totalRefunds: totalRefunds._sum.amount || 0,
      transactionCount,
      averageTransaction: Math.round(averageTransaction * 100) / 100,
      byMethod,
      period: { from: dateFrom || null, to: dateTo || null },
    };
  }

  async processWebhook(provider: string, eventType: string, payload: Record<string, unknown>) {
    this.logger.log(`Processing webhook from ${provider}: ${eventType}`);

    await this.createAuditLog('WEBHOOK_RECEIVED', null, null, {
      provider,
      eventType,
      payload: JSON.stringify(payload).substring(0, 1000),
    });

    const gatewayId = this.extractGatewayId(provider, payload);
    if (!gatewayId) throw new BadRequestException('Could not extract gateway ID from webhook');

    const payment = await this.getPaymentByGatewayId(gatewayId);

    switch (provider) {
      case 'hyperpay':
        return this.handleHyperPayWebhook(eventType, payload, payment);
      case 'stripe':
        return this.handleStripeWebhook(eventType, payload, payment);
      case 'paypal':
        return this.handlePayPalWebhook(eventType, payload, payment);
      default:
        this.logger.warn(`Unknown webhook provider: ${provider}`);
        return { processed: false, reason: 'Unknown provider' };
    }
  }

  async validateIdempotencyKey(key: string): Promise<boolean> {
    const existing = await (this.prisma as any).payment.findFirst({
      where: { idempotencyKey: key },
    });
    return !!existing;
  }

  async getPaymentHistory(filters: {
    patientId?: string;
    status?: PaymentStatus;
    method?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, ...whereFilters } = filters;
    const where: Record<string, unknown> = {};

    if (whereFilters.patientId) where.patientId = whereFilters.patientId;
    if (whereFilters.status) where.status = whereFilters.status;
    if (whereFilters.method) where.method = whereFilters.method;
    if (whereFilters.branchId) where.branchId = whereFilters.branchId;
    if (whereFilters.dateFrom || whereFilters.dateTo) {
      where.createdAt = {
        ...(whereFilters.dateFrom && { gte: new Date(whereFilters.dateFrom) }),
        ...(whereFilters.dateTo && { lte: new Date(whereFilters.dateTo) }),
      };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { gatewayId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await Promise.all([
      (this.prisma as any).payment.findMany({
        where,
        include: { invoice: true, patient: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async routeToGateway(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    switch (dto.method) {
      case PaymentMethod.CASH:
        return { status: 'COMPLETED', gatewayId: null, gatewayResponse: { type: 'cash_payment' } };

      case PaymentMethod.VISA:
      case PaymentMethod.MASTERCARD:
      case PaymentMethod.AMEX:
        return this.processCardPayment(dto, paymentId);

      case PaymentMethod.APPLE_PAY:
      case PaymentMethod.GOOGLE_PAY:
        return this.processMobilePayment(dto, paymentId);

      case PaymentMethod.PAYPAL:
        return this.processPayPalPayment(dto, paymentId);

      case PaymentMethod.WALLET:
        return this.processWalletPayment(dto, paymentId);

      case PaymentMethod.INSTALLMENT:
        return this.processInstallmentPayment(dto, paymentId);

      case PaymentMethod.GIFT_CARD:
        return this.processGiftCardPayment(dto, paymentId);

      case PaymentMethod.CORPORATE_BILLING:
        return this.processCorporateBilling(dto, paymentId);

      case PaymentMethod.INSURANCE:
        return this.processInsuranceClaim(dto, paymentId);

      case PaymentMethod.STC_PAY:
      case PaymentMethod.BANK_TRANSFER:
        return this.processBankTransfer(dto, paymentId);

      case PaymentMethod.TAMARA:
      case PaymentMethod.TABBY:
        return this.processBNPL(dto, paymentId);

      default:
        throw new BadRequestException(`Unsupported payment method: ${dto.method}`);
    }
  }

  private async processCardPayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    this.logger.log(`Processing card payment via Tap/HyperPay: ${paymentId}`);
    const gatewayPaymentId = `hp_${Date.now()}_${paymentId.substring(0, 8)}`;

    await (this.prisma as any).payment.update({
      where: { id: paymentId },
      data: { gatewayId: gatewayPaymentId, gatewayProvider: 'hyperpay', status: 'PROCESSING' },
    });

    return {
      status: 'COMPLETED',
      gatewayId: gatewayPaymentId,
      gatewayResponse: { provider: 'hyperpay', transactionId: gatewayPaymentId },
    };
  }

  private async processMobilePayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    this.logger.log(`Processing mobile payment: ${paymentId}`);
    const gatewayPaymentId = `stripe_${Date.now()}_${paymentId.substring(0, 8)}`;
    return {
      status: 'COMPLETED',
      gatewayId: gatewayPaymentId,
      gatewayResponse: { provider: 'stripe', type: dto.method, transactionId: gatewayPaymentId },
    };
  }

  private async processPayPalPayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    this.logger.log(`Processing PayPal payment: ${paymentId}`);
    const gatewayPaymentId = `pp_${Date.now()}_${paymentId.substring(0, 8)}`;
    return {
      status: 'COMPLETED',
      gatewayId: gatewayPaymentId,
      gatewayResponse: { provider: 'paypal', transactionId: gatewayPaymentId },
    };
  }

  private async processWalletPayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    if (!dto.walletId) throw new BadRequestException('Wallet ID required for wallet payment');
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException(`Wallet ${dto.walletId} not found`);
    if (wallet.balance < dto.amount) throw new BadRequestException('Insufficient wallet balance');

    await (this.prisma as any).wallet.update({
      where: { id: dto.walletId },
      data: { balance: { decrement: dto.amount } },
    });

    await (this.prisma as any).walletTransaction.create({
      data: { walletId: dto.walletId, type: 'DEBIT', amount: dto.amount, paymentId },
    });

    return { status: 'COMPLETED', gatewayId: null, gatewayResponse: { type: 'wallet_deduction' } };
  }

  private async processInstallmentPayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    if (!dto.installmentPlanId) throw new BadRequestException('Installment plan ID required');
    return {
      status: 'COMPLETED',
      gatewayId: `inst_${paymentId.substring(0, 8)}`,
      gatewayResponse: { type: 'installment', planId: dto.installmentPlanId },
    };
  }

  private async processGiftCardPayment(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    if (!dto.giftCardCode) throw new BadRequestException('Gift card code required');
    const card = await (this.prisma as any).giftCard.findFirst({
      where: { code: dto.giftCardCode, isActive: true },
    });
    if (!card) throw new NotFoundException('Gift card not found or inactive');
    if (card.balance < dto.amount) throw new BadRequestException('Insufficient gift card balance');

    await (this.prisma as any).giftCard.update({
      where: { id: card.id },
      data: { balance: { decrement: dto.amount } },
    });

    return { status: 'COMPLETED', gatewayId: null, gatewayResponse: { type: 'gift_card', code: dto.giftCardCode } };
  }

  private async processCorporateBilling(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    if (!dto.corporateAccountId) throw new BadRequestException('Corporate account ID required');
    const account = await (this.prisma as any).corporateAccount.findUnique({
      where: { id: dto.corporateAccountId },
    });
    if (!account) throw new NotFoundException(`Corporate account ${dto.corporateAccountId} not found`);
    if (account.usedCredit + dto.amount > account.creditLimit) {
      throw new BadRequestException('Credit limit exceeded');
    }

    await (this.prisma as any).corporateAccount.update({
      where: { id: dto.corporateAccountId },
      data: { usedCredit: { increment: dto.amount } },
    });

    return {
      status: 'COMPLETED',
      gatewayId: null,
      gatewayResponse: { type: 'corporate_billing', accountId: dto.corporateAccountId },
    };
  }

  private async processInsuranceClaim(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    if (!dto.insurancePolicyId) throw new BadRequestException('Insurance policy ID required');
    return {
      status: 'PENDING',
      gatewayId: `ins_claim_${paymentId.substring(0, 8)}`,
      gatewayResponse: { type: 'insurance_claim', policyId: dto.insurancePolicyId },
    };
  }

  private async processBankTransfer(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    return {
      status: 'PENDING',
      gatewayId: `bt_${Date.now()}_${paymentId.substring(0, 8)}`,
      gatewayResponse: { type: 'bank_transfer' },
    };
  }

  private async processBNPL(
    dto: ProcessPaymentDto,
    paymentId: string,
  ): Promise<{ status: string; gatewayId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    return {
      status: 'COMPLETED',
      gatewayId: `bnpl_${Date.now()}_${paymentId.substring(0, 8)}`,
      gatewayResponse: { type: 'bnpl', provider: dto.method },
    };
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: string,
    gatewayId: string | null,
    gatewayResponse: Record<string, unknown> | null,
  ) {
    return (this.prisma as any).payment.update({
      where: { id: paymentId },
      data: {
        status,
        gatewayId: gatewayId || undefined,
        gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        failedAt: status === 'FAILED' ? new Date() : undefined,
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
      data: { status: newStatus, paidAt: totalPaid >= invoice.total ? new Date() : undefined, updatedAt: new Date() },
    });
  }

  private extractGatewayId(provider: string, payload: Record<string, unknown>): string | null {
    if (provider === 'hyperpay') return (payload.id as string) || (payload.merchantTransactionId as string) || null;
    if (provider === 'stripe') return (payload.id as string) || ((payload.data as Record<string, unknown>)?.object as Record<string, unknown>)?.id as string || null;
    if (provider === 'paypal') return (payload.id as string) || ((payload.resource as Record<string, unknown>)?.id as string) || null;
    return null;
  }

  private async handleHyperPayWebhook(eventType: string, payload: Record<string, unknown>, payment: Record<string, unknown>) {
    const statusMap: Record<string, string> = { 'payment.success': 'COMPLETED', 'payment.failed': 'FAILED', 'payment.cancelled': 'CANCELLED' };
    const newStatus = statusMap[eventType] || payment.status as string;
    await this.updatePaymentStatus(payment.id as string, newStatus, payload.id as string, payload);
    if (newStatus === 'COMPLETED') await this.updateInvoiceAfterPayment(payment.invoiceId as string);
    return { processed: true, status: newStatus };
  }

  private async handleStripeWebhook(eventType: string, payload: Record<string, unknown>, payment: Record<string, unknown>) {
    const statusMap: Record<string, string> = { 'payment_intent.succeeded': 'COMPLETED', 'payment_intent.payment_failed': 'FAILED' };
    const newStatus = statusMap[eventType] || payment.status as string;
    await this.updatePaymentStatus(payment.id as string, newStatus, ((payload.data as Record<string, unknown>)?.object as Record<string, unknown>)?.id as string || payload.id as string, payload);
    if (newStatus === 'COMPLETED') await this.updateInvoiceAfterPayment(payment.invoiceId as string);
    return { processed: true, status: newStatus };
  }

  private async handlePayPalWebhook(eventType: string, payload: Record<string, unknown>, payment: Record<string, unknown>) {
    const statusMap: Record<string, string> = { 'PAYMENT.CAPTURE.COMPLETED': 'COMPLETED', 'PAYMENT.CAPTURE.DENIED': 'FAILED' };
    const newStatus = statusMap[eventType] || payment.status as string;
    await this.updatePaymentStatus(payment.id as string, newStatus, (payload.resource as Record<string, unknown>)?.id as string || payload.id as string, payload);
    if (newStatus === 'COMPLETED') await this.updateInvoiceAfterPayment(payment.invoiceId as string);
    return { processed: true, status: newStatus };
  }

  private async createAuditLog(action: string, entityId: string | null, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'PAYMENT',
          entityId: entityId || 'system',
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
