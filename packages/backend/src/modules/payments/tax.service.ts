import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  type: string;
  isActive: boolean;
}

export interface TaxCalculationResult {
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalWithTax: number;
}

export interface TaxReportFilters {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  taxType?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateTax(amount: number, taxType?: string): Promise<TaxCalculationResult> {
    const config = await this.getTaxConfig();
    const activeTax = taxType
      ? config.find((t) => t.type === taxType && t.isActive)
      : config.find((t) => t.isActive);

    if (!activeTax) {
      return {
        amount,
        taxRate: 0,
        taxAmount: 0,
        totalWithTax: amount,
      };
    }

    const taxAmount = Math.round(amount * activeTax.rate * 100) / 100;
    const totalWithTax = Math.round((amount + taxAmount) * 100) / 100;

    return {
      amount,
      taxRate: activeTax.rate,
      taxAmount,
      totalWithTax,
    };
  }

  async getTaxConfig(): Promise<TaxConfig[]> {
    try {
      const configs = await (this.prisma as any).taxConfig.findMany({
        where: { isActive: true },
      });
      return configs;
    } catch {
      return [
        {
          id: 'default-vat',
          name: 'VAT',
          rate: 0.15,
          type: 'VAT',
          isActive: true,
        },
      ];
    }
  }

  async updateTaxConfig(id: string, dto: { name?: string; rate?: number; type?: string; isActive?: boolean }) {
    try {
      const existing = await (this.prisma as any).taxConfig.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Tax config ${id} not found`);

      const updated = await (this.prisma as any).taxConfig.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.rate !== undefined && { rate: dto.rate }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          updatedAt: new Date(),
        },
      });

      await this.createAuditLog('TAX_CONFIG_UPDATED', id, existing, dto);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.warn('Tax config table not found, using defaults');
      return { id, name: dto.name || 'VAT', rate: dto.rate || 0.15, type: dto.type || 'VAT', isActive: dto.isActive !== false };
    }
  }

  async calculateInvoiceTax(invoiceId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, discounts: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const subtotal = invoice.subtotal;
    const totalDiscount = invoice.discountAmount || 0;
    const taxableAmount = Math.max(subtotal - totalDiscount, 0);

    const taxConfigs = await this.getTaxConfig();
    const vatConfig = taxConfigs.find((t) => t.type === 'VAT' && t.isActive);
    const vatRate = vatConfig?.rate || 0.15;

    const taxAmount = Math.round(taxableAmount * vatRate * 100) / 100;
    const totalWithTax = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const insuranceCoverage = invoice.insuranceCoverage || 0;
    const finalTotal = Math.max(totalWithTax - insuranceCoverage, 0);

    await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        taxAmount,
        total: finalTotal,
        updatedAt: new Date(),
      },
    });

    return {
      invoiceId,
      subtotal,
      totalDiscount,
      taxableAmount,
      taxRate: vatRate,
      taxAmount,
      totalWithTax,
      insuranceCoverage,
      finalTotal,
    };
  }

  async getTaxReport(filters: TaxReportFilters) {
    const { dateFrom, dateTo, branchId, taxType, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { status: 'COMPLETED' };

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    if (branchId) where.branchId = branchId;

    const payments = await (this.prisma as any).payment.findMany({
      where,
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPayments = await (this.prisma as any).payment.count({ where });

    const reportItems = payments.map((payment: Record<string, unknown>) => {
      const invoice = payment.invoice as Record<string, unknown>;
      return {
        paymentId: payment.id,
        amount: payment.amount,
        taxAmount: invoice?.taxAmount || 0,
        currency: payment.currency,
        method: payment.method,
        createdAt: payment.createdAt,
      };
    });

    const totalAmount = reportItems.reduce(
      (sum: number, item: { amount: number }) => sum + item.amount,
      0,
    );
    const totalTaxCollected = reportItems.reduce(
      (sum: number, item: { taxAmount: number }) => sum + item.taxAmount,
      0,
    );

    return {
      data: reportItems,
      meta: {
        total: totalPayments,
        page,
        limit,
        totalPages: Math.ceil(totalPayments / limit),
      },
      summary: {
        totalAmount,
        totalTaxCollected,
        effectiveTaxRate: totalAmount > 0 ? Math.round((totalTaxCollected / totalAmount) * 100 * 100) / 100 : 0,
        period: { from: dateFrom || null, to: dateTo || null },
      },
    };
  }

  async exemptPatient(invoiceId: string, reason: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const previousTaxAmount = invoice.taxAmount;

    const updated = await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        taxAmount: 0,
        total: invoice.subtotal - (invoice.discountAmount || 0) - (invoice.insuranceCoverage || 0),
        taxExempt: true,
        taxExemptReason: reason,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('TAX_EXEMPTION_APPLIED', invoiceId, previousTaxAmount, {
      reason,
      invoiceNumber: invoice.invoiceNumber,
    });

    return updated;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'TAX',
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
