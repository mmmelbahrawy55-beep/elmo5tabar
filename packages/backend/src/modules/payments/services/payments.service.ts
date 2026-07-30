import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProcessPaymentDto, PaymentMethod } from '../dto/process-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

const TAX_RATE = 0.15;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async createInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            labTest: { select: { id: true, nameAr: true, price: true } },
          },
        },
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true, email: true },
        },
        branch: { select: { id: true, nameAr: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { orderId },
    });

    if (existingInvoice) {
      throw new BadRequestException(`Invoice already exists for order ${orderId}`);
    }

    const subtotal = order.items.reduce(
      (sum, item) => sum + (item.labTest?.price ?? 0) * (item.quantity ?? 1),
      0,
    );
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoiceNumber = await this.generateInvoiceNumber(order.branchId);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        patientId: order.patientId,
        branchId: order.branchId,
        subtotal,
        taxRate: TAX_RATE,
        tax: taxAmount,
        total: totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        branch: { select: { id: true, nameAr: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    await this.cache.invalidatePattern('payments:*');

    this.logger.log(`Invoice created: ${invoiceNumber} for order ${orderId}`);
    return invoice;
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        branch: { select: { id: true, nameAr: true, phone: true } },
        order: {
          include: { items: { include: { labTest: { select: { id: true, nameAr: true } } } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async getInvoiceByOrder(orderId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { orderId },
      include: {
        patient: {
          select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
        },
        branch: { select: { id: true, nameAr: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`No invoice found for order ${orderId}`);
    }

    return invoice;
  }

  async listInvoices(
    pagination: PaginationDto,
    filters?: { status?: string; branchId?: string; dateFrom?: string; dateTo?: string },
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (filters?.status) where.status = filters.status as any;
    if (filters?.branchId) where.branchId = filters.branchId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstNameAr: { contains: search, mode: 'insensitive' } } },
        { patient: { lastNameAr: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          patient: {
            select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
          },
          branch: { select: { id: true, nameAr: true } },
          order: { select: { id: true, orderNumber: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
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

  async processPayment(invoiceId: string, dto: ProcessPaymentDto, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true, branch: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot process payment for a cancelled invoice');
    }

    if (invoice.balanceDue <= 0) {
      throw new BadRequestException('Invoice is fully paid');
    }

    if (dto.amount > invoice.balanceDue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds balance due (${invoice.balanceDue})`,
      );
    }

    const transactionId = dto.transactionId ?? this.generateTransactionId();

    const paymentNumber = `PAY-${Date.now()}`;
    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount: dto.amount,
        method: dto.method,
        transactionId,
        cardLast4: dto.cardLast4,
        cardBrand: dto.cardBrand,
        notes: dto.notes,
        status: 'PAID' as any,
        createdBy: userId,
        paidAt: new Date(),
      },
      include: {
        invoice: true,
      },
    });

    const newPaidAmount = Math.round((invoice.paidAmount + dto.amount) * 100) / 100;
    const newBalanceDue = Math.round((invoice.total - newPaidAmount) * 100) / 100;
    const newStatus = newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        paidAt: newBalanceDue <= 0 ? new Date() : null,
      },
    });

    await this.cache.invalidatePattern('payments:*');

    this.logger.log(
      `Payment processed: ${dto.amount} ${dto.method} for invoice ${invoice.invoiceNumber}`,
    );

    return {
      payment,
      invoice: {
        id: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        paidAmount: newPaidAmount,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
      },
    };
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, paidAmount: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async listPayments(invoiceId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  async createRefund(dto: CreateRefundDto, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { patient: true, payments: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found`);
    }

    if (invoice.paidAmount <= 0) {
      throw new BadRequestException('Cannot refund an invoice with no payments');
    }

    if (dto.amount > invoice.paidAmount) {
      throw new BadRequestException(
        `Refund amount (${dto.amount}) exceeds paid amount (${invoice.paidAmount})`,
      );
    }

    const refund = await this.prisma.refund.create({
      data: {
        refundNumber: `REF-${Date.now()}`,
        invoiceId: dto.invoiceId,
        orderId: invoice.orderId,
        amount: dto.amount,
        reason: dto.reason,
        status: 'PENDING' as any,
        createdBy: userId,
        transactionId: this.generateTransactionId(),
      },
      include: {
        invoice: true,
      },
    });

    const newPaidAmount = Math.round((invoice.paidAmount - dto.amount) * 100) / 100;
    const newBalanceDue = Math.round((invoice.total - newPaidAmount) * 100) / 100;

    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        paidAmount: Math.max(0, newPaidAmount),
        balanceDue: newBalanceDue,
        status: newBalanceDue > 0 ? 'PARTIALLY_PAID' as any : 'PENDING' as any,
      },
    });

    await this.cache.invalidatePattern('payments:*');

    this.logger.log(
      `Refund created: ${dto.amount} for invoice ${invoice.invoiceNumber}`,
    );

    return {
      refund,
      invoice: {
        id: dto.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        paidAmount: Math.max(0, newPaidAmount),
        balanceDue: newBalanceDue,
      },
    };
  }

  async getRefund(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, paidAmount: true },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    return refund;
  }

  async getPaymentStats(branchId?: string, dateFrom?: string, dateTo?: string) {
    const invoiceWhere: Prisma.InvoiceWhereInput = {};
    if (branchId) invoiceWhere.branchId = branchId;
    if (dateFrom || dateTo) {
      invoiceWhere.createdAt = {};
      if (dateFrom) invoiceWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) invoiceWhere.createdAt.lte = new Date(dateTo);
    }

    const paymentWhere: Prisma.PaymentWhereInput = {};
    if (dateFrom || dateTo) {
      paymentWhere.createdAt = {};
      if (dateFrom) paymentWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) paymentWhere.createdAt.lte = new Date(dateTo);
    }

    const [
      totalPayments,
      totalRevenue,
      pendingInvoices,
      paidInvoices,
      totalRefunds,
      byMethod,
    ] = await Promise.all([
      this.prisma.payment.count({ where: { ...paymentWhere, status: 'PAID' as any } }),
      this.prisma.payment.aggregate({
        where: { ...paymentWhere, status: 'PAID' as any },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: { ...invoiceWhere, status: { in: ['PENDING', 'PARTIALLY_PAID'] as any }, balanceDue: { gt: 0 } },
      }),
      this.prisma.invoice.count({ where: { ...invoiceWhere, status: 'PAID' } }),
      this.prisma.refund.aggregate({
        where: { status: { not: 'CANCELLED' as any } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { ...paymentWhere, status: 'PAID' as any },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const revenue = totalRevenue._sum.amount ?? 0;
    const refunded = totalRefunds._sum.amount ?? 0;

    return {
      totalPayments,
      totalRevenue: revenue,
      totalRefunded: refunded,
      netRevenue: Math.round((revenue - refunded) * 100) / 100,
      pendingInvoices,
      paidInvoices,
      refundCount: totalRefunds._count,
      byMethod: byMethod.map((item) => ({
        method: item.method,
        count: item._count,
        total: item._sum.amount ?? 0,
      })),
      dateRange: { from: dateFrom ?? null, to: dateTo ?? null },
    };
  }

  async generateReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const receiptNumber = `RCT-${payment.invoice.invoiceNumber}-${paymentId.slice(-6).toUpperCase()}`;

    return {
      receiptNumber,
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
      },
      invoice: {
        invoiceNumber: payment.invoice.invoiceNumber,
        total: payment.invoice.total,
        paidAmount: payment.invoice.paidAmount,
        balanceDue: payment.invoice.balanceDue,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getOutstandingInvoices(pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      balanceDue: { gt: 0 },
      status: { not: 'CANCELLED' },
    };

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: {
            select: { id: true, firstNameAr: true, lastNameAr: true, phone: true },
          },
          branch: { select: { id: true, nameAr: true } },
          order: { select: { id: true, orderNumber: true } },
          payments: {
            select: { id: true, amount: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.invoice.count({ where }),
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

  async getRevenueReport(
    dateFrom: string,
    dateTo: string,
    groupBy: 'day' | 'week' | 'month' | 'branch' = 'day',
  ) {
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID' as any,
        paidAt: { gte: start, lte: end },
      },
      orderBy: { paidAt: 'asc' },
    });

    let groupedData: Record<string, { total: number; count: number }> = {};

    payments.forEach((payment) => {
      const date = payment.paidAt ? new Date(payment.paidAt) : new Date();
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { total: 0, count: 0 };
      }
      groupedData[key].total += payment.amount;
      groupedData[key].count += 1;
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions: payments.length,
      groupBy,
      dateRange: { from: dateFrom, to: dateTo },
      data: Object.entries(groupedData).map(([key, value]) => ({
        period: key,
        total: Math.round(value.total * 100) / 100,
        count: value.count,
      })),
    };
  }

  private async generateInvoiceNumber(branchId: string): Promise<string> {
    const year = new Date().getFullYear();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.invoice.count({
      where: { createdAt: { gte: todayStart } },
    });

    const sequence = (count + 1).toString().padStart(8, '0');
    return `INV-${year}-${sequence}`;
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }
}
