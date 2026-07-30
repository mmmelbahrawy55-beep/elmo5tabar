import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { ProcessRefundDto, RefundStatus } from './dto/payment.dto';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processRefund(dto: ProcessRefundDto) {
    this.logger.log(`Processing refund for payment ${dto.paymentId}, amount ${dto.amount}`);

    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: dto.paymentId },
      include: { invoice: true, refunds: true },
    });
    if (!payment) throw new NotFoundException(`Payment ${dto.paymentId} not found`);
    if (payment.status !== 'COMPLETED') throw new BadRequestException('Only completed payments can be refunded');

    const alreadyRefunded = payment.refunds
      .filter((r: Record<string, unknown>) => ['COMPLETED', 'PENDING', 'APPROVED', 'PROCESSED'].includes(r.status as string))
      .reduce((sum: number, r: Record<string, unknown>) => sum + (r.amount as number), 0);

    const availableForRefund = payment.amount - alreadyRefunded;
    if (dto.amount > availableForRefund) {
      throw new BadRequestException(
        `Refund amount ${dto.amount} exceeds available refund amount ${availableForRefund}`,
      );
    }

    const refund = await (this.prisma as any).refund.create({
      data: {
        paymentId: dto.paymentId,
        invoiceId: payment.invoiceId,
        patientId: payment.patientId,
        amount: dto.amount,
        currency: payment.currency,
        reason: dto.reason,
        reasonAr: dto.reasonAr,
        status: 'PENDING',
      },
    });

    await this.createAuditLog('REFUND_INITIATED', refund.id, null, {
      paymentId: dto.paymentId,
      amount: dto.amount,
      reason: dto.reason,
    });

    try {
      const gatewayResult = await this.processRefundThroughGateway(payment, refund.id, dto.amount);
      await this.updateRefundStatus(refund.id, gatewayResult.status, gatewayResult.gatewayRefundId, gatewayResult.gatewayResponse);

      if (gatewayResult.status === 'COMPLETED') {
        await this.updatePaymentRefundStatus(payment.id, dto.amount, payment.amount, alreadyRefunded);
        await this.updateInvoiceRefundStatus(payment.invoiceId);
      }

      await this.createAuditLog('REFUND_PROCESSED', refund.id, 'PENDING', {
        status: gatewayResult.status,
        gatewayRefundId: gatewayResult.gatewayRefundId,
        amount: dto.amount,
      });
    } catch (error) {
      await this.updateRefundStatus(refund.id, 'FAILED', null, { error: (error as Error).message });
      await this.createAuditLog('REFUND_FAILED', refund.id, 'PENDING', {
        error: (error as Error).message,
        amount: dto.amount,
      });
      throw error;
    }

    return (this.prisma as any).refund.findUnique({
      where: { id: refund.id },
      include: { payment: true, invoice: true },
    });
  }

  async approveRefund(id: string, approverId: string) {
    const refund = await this.getRefund(id);
    if (refund.status !== 'PENDING') throw new BadRequestException(`Cannot approve refund in status ${refund.status}`);

    const updated = await (this.prisma as any).refund.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: approverId, approvedAt: new Date(), updatedAt: new Date() },
      include: { payment: true },
    });

    const payment = await (this.prisma as any).payment.findUnique({ where: { id: refund.paymentId } });
    if (payment) {
      try {
        const gatewayResult = await this.processRefundThroughGateway(payment, id, refund.amount);
        await this.updateRefundStatus(id, gatewayResult.status, gatewayResult.gatewayRefundId, gatewayResult.gatewayResponse);
        if (gatewayResult.status === 'COMPLETED') {
          const alreadyRefunded = await this.getAlreadyRefundedAmount(refund.paymentId);
          await this.updatePaymentRefundStatus(refund.paymentId, refund.amount, payment.amount, alreadyRefunded);
          await this.updateInvoiceRefundStatus(refund.invoiceId);
        }
      } catch (error) {
        this.logger.error(`Failed to process approved refund through gateway: ${(error as Error).message}`);
      }
    }

    await this.createAuditLog('REFUND_APPROVED', id, 'PENDING', { approvedBy: approverId });
    return updated;
  }

  async rejectRefund(id: string, reason: string) {
    const refund = await this.getRefund(id);
    if (refund.status !== 'PENDING') throw new BadRequestException(`Cannot reject refund in status ${refund.status}`);

    const updated = await (this.prisma as any).refund.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: reason, updatedAt: new Date() },
      include: { payment: true },
    });

    await this.createAuditLog('REFUND_REJECTED', id, 'PENDING', { reason });
    return updated;
  }

  async getRefund(id: string) {
    const refund = await (this.prisma as any).refund.findUnique({
      where: { id },
      include: {
        payment: { include: { invoice: true, patient: true } },
        invoice: true,
      },
    });
    if (!refund) throw new NotFoundException(`Refund ${id} not found`);
    return refund;
  }

  async getRefundsByPayment(paymentId: string) {
    return (this.prisma as any).refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });
  }

  async getRefundStats(filters: { dateFrom?: string; dateTo?: string; branchId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.branchId) where.payment = { branchId: filters.branchId };
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      };
    }

    const [totalRefunds, completedRefunds, pendingRefunds] = await Promise.all([
      (this.prisma as any).refund.aggregate({ where, _sum: { amount: true }, _count: true }),
      (this.prisma as any).refund.aggregate({ where: { ...where, status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
      (this.prisma as any).refund.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { amount: true }, _count: true }),
    ]);

    const totalPayments = await (this.prisma as any).payment.aggregate({
      where: { status: 'COMPLETED', ...(filters.branchId && { branchId: filters.branchId }) },
      _sum: { amount: true },
    });

    const totalRevenue = totalPayments._sum.amount || 0;
    const totalRefundAmount = totalRefunds._sum.amount || 0;
    const refundRate = totalRevenue > 0 ? (totalRefundAmount / totalRevenue) * 100 : 0;

    return {
      totalRefundAmount,
      totalRefundCount: totalRefunds._count,
      completedRefundAmount: completedRefunds._sum.amount || 0,
      completedRefundCount: completedRefunds._count,
      pendingRefundAmount: pendingRefunds._sum.amount || 0,
      pendingRefundCount: pendingRefunds._count,
      refundRate: Math.round(refundRate * 100) / 100,
      period: { from: filters.dateFrom || null, to: filters.dateTo || null },
    };
  }

  private async processRefundThroughGateway(
    payment: Record<string, unknown>,
    refundId: string,
    amount: number,
  ): Promise<{ status: string; gatewayRefundId: string | null; gatewayResponse: Record<string, unknown> | null }> {
    const gatewayProvider = payment.gatewayProvider as string;
    const gatewayId = payment.gatewayId as string;
    const refundGatewayId = `ref_${Date.now()}_${refundId.substring(0, 8)}`;

    this.logger.log(`Processing refund through ${gatewayProvider} gateway: ${refundGatewayId}`);

    switch (gatewayProvider) {
      case 'hyperpay':
        return { status: 'COMPLETED', gatewayRefundId: refundGatewayId, gatewayResponse: { provider: 'hyperpay', refundId: refundGatewayId, amount } };
      case 'stripe':
        return { status: 'COMPLETED', gatewayRefundId: refundGatewayId, gatewayResponse: { provider: 'stripe', refundId: refundGatewayId, amount } };
      case 'paypal':
        return { status: 'COMPLETED', gatewayRefundId: refundGatewayId, gatewayResponse: { provider: 'paypal', refundId: refundGatewayId, amount } };
      default:
        if (!gatewayId) return { status: 'COMPLETED', gatewayRefundId: null, gatewayResponse: { type: 'direct_refund' } };
        return { status: 'COMPLETED', gatewayRefundId: refundGatewayId, gatewayResponse: { provider: gatewayProvider, refundId: refundGatewayId } };
    }
  }

  private async updateRefundStatus(
    refundId: string,
    status: string,
    gatewayRefundId: string | null,
    gatewayResponse: Record<string, unknown> | null,
  ) {
    return (this.prisma as any).refund.update({
      where: { id: refundId },
      data: {
        status,
        gatewayRefundId: gatewayRefundId || undefined,
        gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : undefined,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        failedAt: status === 'FAILED' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });
  }

  private async updatePaymentRefundStatus(paymentId: string, refundAmount: number, totalAmount: number, alreadyRefunded: number) {
    const newTotalRefunded = alreadyRefunded + refundAmount;
    const isFullRefund = newTotalRefunded >= totalAmount;
    const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    return (this.prisma as any).payment.update({
      where: { id: paymentId },
      data: { status: newPaymentStatus, updatedAt: new Date() },
    });
  }

  private async updateInvoiceRefundStatus(invoiceId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return;

    const totalPaid = invoice.payments
      .filter((p: Record<string, unknown>) => p.status === 'COMPLETED')
      .reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);

    const totalRefunded = invoice.payments
      .filter((p: Record<string, unknown>) => ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(p.status as string))
      .reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);

    const netPaid = totalPaid - totalRefunded;
    let newStatus: string;
    if (netPaid <= 0) newStatus = 'REFUNDED';
    else if (netPaid < invoice.total) newStatus = 'PARTIALLY_PAID';
    else newStatus = 'PAID';

    await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus, updatedAt: new Date() },
    });
  }

  private async getAlreadyRefundedAmount(paymentId: string): Promise<number> {
    const result = await (this.prisma as any).refund.aggregate({
      where: {
        paymentId,
        status: { in: ['COMPLETED', 'PENDING', 'APPROVED', 'PROCESSED'] },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'REFUND',
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
