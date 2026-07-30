import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CreateInvoiceDto, InvoiceStatus, InvoiceItemInput } from './dto/payment.dto';

const VAT_RATE = 0.15;
const INVOICE_PREFIX = 'INV';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(dto: CreateInvoiceDto) {
    this.logger.log(`Creating invoice for patient ${dto.patientId}`);

    const items = dto.items.map((item) => this.calculateItemSubtotal(item));
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const discountAmount = dto.discountCode ? await this.calculateDiscount(dto.discountCode, subtotal) : 0;
    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
    const taxAmount = Math.round(discountedSubtotal * VAT_RATE * 100) / 100;
    const insuranceCoverage = dto.insurancePolicyId ? await this.calculateInsuranceCoverage(dto.insurancePolicyId, discountedSubtotal) : 0;
    const total = Math.max(discountedSubtotal + taxAmount - insuranceCoverage, 0);
    const invoiceNumber = await this.generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await (this.prisma as any).invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        branchId: dto.branchId,
        doctorId: dto.doctorId,
        orderId: dto.orderId,
        subtotal,
        discountAmount,
        taxAmount,
        insuranceCoverage,
        total,
        currency: 'SAR',
        status: 'PENDING',
        notes: dto.notes,
        language: dto.language || 'en',
        dueDate,
        items: {
          create: dto.items.map((item, index) => ({
            testName: item.testName,
            testNameAr: item.testNameAr,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: items[index].subtotal,
            labTestId: item.labTestId,
            packageId: item.packageId,
            insuranceCovered: item.insuranceCovered || 0,
          })),
        },
      },
      include: { items: true, patient: true },
    });

    if (dto.discountCode) {
      await (this.prisma as any).invoiceDiscount.create({
        data: {
          invoiceId: invoice.id,
          code: dto.discountCode,
          amount: discountAmount,
        },
      }).catch(() => {});
    }

    if (dto.insurancePolicyId) {
      await (this.prisma as any).invoiceInsurance.create({
        data: {
          invoiceId: invoice.id,
          policyId: dto.insurancePolicyId,
          coveredAmount: insuranceCoverage,
        },
      }).catch(() => {});
    }

    await this.createAuditLog('INVOICE_CREATED', invoice.id, null, {
      invoiceNumber,
      total,
      patientId: dto.patientId,
    });

    this.logger.log(`Invoice ${invoiceNumber} created: ${total} SAR`);
    return invoice;
  }

  async getInvoice(id: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id },
      include: {
        items: true,
        patient: true,
        payments: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        discounts: true,
        insurance: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async getPatientInvoices(patientId: string, filters: {
    status?: InvoiceStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { patientId };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [invoices, total] = await Promise.all([
      (this.prisma as any).invoice.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateInvoiceStatus(id: string, newStatus: InvoiceStatus) {
    const invoice = await this.getInvoice(id);
    this.validateStatusTransition(invoice.status, newStatus);

    const updated = await (this.prisma as any).invoice.update({
      where: { id },
      data: { status: newStatus, updatedAt: new Date() },
      include: { items: true },
    });

    await this.createAuditLog('INVOICE_STATUS_CHANGED', id, invoice.status, {
      newStatus,
      invoiceNumber: invoice.invoiceNumber,
    });

    return updated;
  }

  async markAsPaid(invoiceId: string, paymentId: string) {
    const invoice = await this.getInvoice(invoiceId);

    const updated = await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date(), updatedAt: new Date() },
      include: { items: true },
    });

    await this.createAuditLog('INVOICE_MARKED_PAID', invoiceId, invoice.status, {
      paymentId,
      invoiceNumber: invoice.invoiceNumber,
    });

    return updated;
  }

  async calculateInsurance(invoiceId: string, policyId: string) {
    const invoice = await this.getInvoice(invoiceId);
    const policy = await (this.prisma as any).insurancePolicy.findUnique({
      where: { id: policyId },
    }).catch(() => null);

    if (!policy) throw new NotFoundException(`Insurance policy ${policyId} not found`);

    const coveredAmount = Math.min(
      invoice.subtotal * (policy.coveragePercentage / 100),
      policy.maxCoverage || invoice.subtotal,
    );

    return {
      policyId,
      coveragePercentage: policy.coveragePercentage,
      maxCoverage: policy.maxCoverage,
      calculatedCoverage: coveredAmount,
      patientResponsibility: Math.max(invoice.total - coveredAmount, 0),
    };
  }

  async generatePDF(invoiceId: string) {
    const invoice = await this.getInvoice(invoiceId);
    const html = this.renderInvoiceHTML(invoice);
    return { invoiceId, html, format: 'html', generatedAt: new Date() };
  }

  async generateReceipt(paymentId: string) {
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { items: true, patient: true } } },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    const html = this.renderReceiptHTML(payment);
    return { paymentId, html, format: 'html', generatedAt: new Date() };
  }

  async getOverdueInvoices(filters: { branchId?: string; page?: number; limit?: number }) {
    const { branchId, page = 1, limit = 50 } = filters;
    const now = new Date();
    const where: Record<string, unknown> = {
      status: { in: ['PENDING', 'SENT', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    };
    if (branchId) where.branchId = branchId;

    const invoices = await (this.prisma as any).invoice.findMany({
      where,
      include: { items: true, patient: true },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const aged = invoices.map((inv: Record<string, unknown>) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate as string).getTime()) / 86400000);
      let agingBucket: string;
      if (daysOverdue <= 30) agingBucket = '1-30';
      else if (daysOverdue <= 60) agingBucket = '31-60';
      else if (daysOverdue <= 90) agingBucket = '61-90';
      else agingBucket = '120+';
      return { ...inv, daysOverdue, agingBucket };
    });

    const buckets = { '1-30': 0, '31-60': 0, '61-90': 0, '120+': 0 };
    aged.forEach((inv: Record<string, unknown>) => {
      buckets[inv.agingBucket as keyof typeof buckets] += inv.total as number;
    });

    return { data: aged, agingSummary: buckets };
  }

  async voidInvoice(id: string, reason: string) {
    const invoice = await this.getInvoice(id);
    if (invoice.status === 'VOIDED') throw new BadRequestException('Invoice already voided');
    if (invoice.status === 'PAID') {
      const payments = await (this.prisma as any).payment.findMany({
        where: { invoiceId: id, status: 'COMPLETED' },
      });
      if (payments.length > 0) throw new BadRequestException('Cannot void a paid invoice with completed payments. Process a refund first.');
    }

    const updated = await (this.prisma as any).invoice.update({
      where: { id },
      data: { status: 'VOIDED', voidedAt: new Date(), voidReason: reason, updatedAt: new Date() },
      include: { items: true },
    });

    await this.createAuditLog('INVOICE_VOIDED', id, invoice.status, {
      reason,
      invoiceNumber: invoice.invoiceNumber,
    });

    return updated;
  }

  private calculateItemSubtotal(item: InvoiceItemInput) {
    const subtotal = item.quantity * item.unitPrice;
    return { ...item, subtotal };
  }

  private async calculateDiscount(code: string, subtotal: number): Promise<number> {
    const coupon = await (this.prisma as any).coupon.findFirst({
      where: { code, isActive: true, expiresAt: { gt: new Date() } },
    }).catch(() => null);
    if (!coupon) return 0;
    if (coupon.discountType === 'PERCENTAGE') {
      return Math.round(subtotal * (coupon.discountValue / 100) * 100) / 100;
    }
    return Math.min(coupon.discountValue, subtotal);
  }

  private async calculateInsuranceCoverage(policyId: string, amount: number): Promise<number> {
    const policy = await (this.prisma as any).insurancePolicy.findUnique({
      where: { id: policyId },
    }).catch(() => null);
    if (!policy) return 0;
    return Math.min(amount * (policy.coveragePercentage / 100), policy.maxCoverage || amount);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const lastInvoice = await (this.prisma as any).invoice.findFirst({
      where: { invoiceNumber: { startsWith: `${INVOICE_PREFIX}-${year}` } },
      orderBy: { invoiceNumber: 'desc' },
    });
    let sequence = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1], 10);
      sequence = lastNum + 1;
    }
    return `${INVOICE_PREFIX}-${year}${sequence.toString().padStart(8, '0')}`;
  }

  private validateStatusTransition(current: string, next: string) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['PENDING', 'CANCELLED'],
      PENDING: ['SENT', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'VOIDED'],
      SENT: ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'VOIDED'],
      PARTIALLY_PAID: ['PAID', 'OVERDUE', 'VOIDED'],
      OVERDUE: ['PAID', 'PARTIALLY_PAID', 'VOIDED'],
      PAID: ['REFUNDED', 'VOIDED'],
      CANCELLED: [],
      VOIDED: [],
    };
    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(`Invalid status transition: ${current} → ${next}`);
    }
  }

  private renderInvoiceHTML(invoice: Record<string, unknown>): string {
    const items = (invoice.items as Array<Record<string, unknown>>)
      .map(
        (item: Record<string, unknown>) => `
        <tr>
          <td>${item.testName}</td>
          <td>${item.testNameAr}</td>
          <td>${item.quantity}</td>
          <td>${item.unitPrice} SAR</td>
          <td>${item.subtotal} SAR</td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html dir="${invoice.language === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: ${invoice.language === 'ar' ? 'right' : 'left'}; }
  th { background-color: #007bff; color: white; }
  .totals { margin-top: 20px; text-align: ${invoice.language === 'ar' ? 'left' : 'right'}; }
  .totals table { width: 300px; margin-left: auto; }
</style></head>
<body>
  <div class="header">
    <h1>${invoice.language === 'ar' ? 'فاتورة' : 'INVOICE'}</h1>
    <p><strong>${invoice.invoiceNumber}</strong></p>
    <p>${new Date(invoice.createdAt as string).toLocaleDateString('en-SA')}</p>
  </div>
  <p><strong>Patient:</strong> ${(invoice.patient as Record<string, unknown>)?.name || 'N/A'}</p>
  <table>
    <thead>
      <tr>
        <th>${invoice.language === 'ar' ? 'الاسم بالإنجليزية' : 'Test Name'}</th>
        <th>${invoice.language === 'ar' ? 'الاسم بالعربية' : 'Test Name (AR)'}</th>
        <th>${invoice.language === 'ar' ? 'الكمية' : 'Qty'}</th>
        <th>${invoice.language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
        <th>${invoice.language === 'ar' ? 'المجموع' : 'Subtotal'}</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
  <div class="totals">
    <table>
      <tr><td>Subtotal:</td><td>${invoice.subtotal} SAR</td></tr>
      ${Number(invoice.discountAmount) > 0 ? `<tr><td>Discount:</td><td>-${invoice.discountAmount} SAR</td></tr>` : ''}
      <tr><td>VAT (15%):</td><td>${invoice.taxAmount} SAR</td></tr>
      ${Number(invoice.insuranceCoverage) > 0 ? `<tr><td>Insurance:</td><td>-${invoice.insuranceCoverage} SAR</td></tr>` : ''}
      <tr><td><strong>Total:</strong></td><td><strong>${invoice.total} SAR</strong></td></tr>
    </table>
  </div>
</body></html>`;
  }

  private renderReceiptHTML(payment: Record<string, unknown>): string {
    const invoice = payment.invoice as Record<string, unknown>;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; max-width: 400px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 10px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
  .total { font-size: 1.2em; font-weight: bold; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }
</style></head>
<body>
  <div class="header">
    <h2>PAYMENT RECEIPT</h2>
    <p>${payment.id as string}</p>
  </div>
  <p><strong>Date:</strong> ${new Date(payment.createdAt as string).toLocaleString('en-SA')}</p>
  <div class="row"><span>Invoice:</span><span>${(invoice as Record<string, unknown>)?.invoiceNumber || 'N/A'}</span></div>
  <div class="row"><span>Method:</span><span>${payment.method as string}</span></div>
  <div class="row"><span>Status:</span><span>${payment.status as string}</span></div>
  <div class="row total"><span>Amount Paid:</span><span>${payment.amount as number} ${payment.currency as string}</span></div>
</body></html>`;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'INVOICE',
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
