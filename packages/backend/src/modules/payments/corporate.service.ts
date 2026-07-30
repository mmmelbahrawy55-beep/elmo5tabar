import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface CreateCorporateAccountDto {
  companyName: string;
  companyNameAr?: string;
  contactEmail: string;
  contactPhone?: string;
  taxId?: string;
  creditLimit: number;
  paymentTerms: number;
  currency?: string;
  branchId?: string;
}

export interface CorporateAgingBucket {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
}

export interface CorporateReportFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CorporateService {
  private readonly logger = new Logger(CorporateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAccount(dto: CreateCorporateAccountDto) {
    const accountNumber = await this.generateAccountNumber();

    const account = await (this.prisma as any).corporateAccount.create({
      data: {
        accountNumber,
        companyName: dto.companyName,
        companyNameAr: dto.companyNameAr,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        taxId: dto.taxId,
        creditLimit: dto.creditLimit,
        availableCredit: dto.creditLimit,
        usedCredit: 0,
        paymentTerms: dto.paymentTerms,
        currency: dto.currency || 'SAR',
        status: 'ACTIVE',
        branchId: dto.branchId,
      },
    });

    await this.createAuditLog('CORPORATE_ACCOUNT_CREATED', account.id, null, {
      accountNumber,
      companyName: dto.companyName,
      creditLimit: dto.creditLimit,
    });

    return account;
  }

  async getAccount(id: string) {
    const account = await (this.prisma as any).corporateAccount.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        billingCycles: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!account) throw new NotFoundException(`Corporate account ${id} not found`);
    return account;
  }

  async addInvoiceToAccount(accountId: string, invoiceId: string) {
    const [account, invoice] = await Promise.all([
      (this.prisma as any).corporateAccount.findUnique({ where: { id: accountId } }) as Promise<any>,
      (this.prisma as any).invoice.findUnique({ where: { id: invoiceId } }) as Promise<any>,
    ]);

    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);
    if (account.status !== 'ACTIVE') throw new BadRequestException('Corporate account is not active');

    const existingLink = await (this.prisma as any).corporateInvoice.findFirst({
      where: { accountId, invoiceId },
    });
    if (existingLink) throw new BadRequestException('Invoice already linked to this account');

    if (account.usedCredit + invoice.total > account.creditLimit) {
      throw new BadRequestException(
        `Credit limit exceeded. Available: ${account.availableCredit}, Invoice: ${invoice.total}`,
      );
    }

    const linkedInvoice = await (this.prisma as any).corporateInvoice.create({
      data: {
        accountId,
        invoiceId,
        amount: invoice.total,
        status: 'PENDING',
      },
    });

    await (this.prisma as any).corporateAccount.update({
      where: { id: accountId },
      data: {
        usedCredit: { increment: invoice.total },
        availableCredit: { decrement: invoice.total },
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('INVOICE_ADDED_TO_ACCOUNT', accountId, account.usedCredit, {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      newUsedCredit: account.usedCredit + invoice.total,
    });

    return linkedInvoice;
  }

  async getAccountInvoices(
    accountId: string,
    filters: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number },
  ) {
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { accountId };

    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [invoices, total] = await Promise.all([
      (this.prisma as any).corporateInvoice.findMany({
        where,
        include: { invoice: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).corporateInvoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async closeBillingCycle(accountId: string) {
    const account = await (this.prisma as any).corporateAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);

    const pendingInvoices = await (this.prisma as any).corporateInvoice.findMany({
      where: { accountId, status: 'PENDING' },
      include: { invoice: true },
    });

    const totalAmount = pendingInvoices.reduce(
      (sum: number, ci: { amount: number }) => sum + ci.amount,
      0,
    );

    const billingCycle = await (this.prisma as any).billingCycle.create({
      data: {
        accountId,
        totalAmount,
        invoiceCount: pendingInvoices.length,
        status: 'CLOSED',
        closedAt: new Date(),
        statementData: JSON.stringify({
          invoices: pendingInvoices.map((ci: { invoice: Record<string, unknown>; amount: number }) => ({
            invoiceNumber: ci.invoice.invoiceNumber,
            amount: ci.amount,
          })),
          totalAmount,
        }),
      },
    });

    for (const ci of pendingInvoices) {
      await (this.prisma as any).corporateInvoice.update({
        where: { id: ci.id },
        data: { status: 'BILLED', billedInCycle: billingCycle.id },
      });
    }

    await this.createAuditLog('BILLING_CYCLE_CLOSED', accountId, null, {
      cycleId: billingCycle.id,
      totalAmount,
      invoiceCount: pendingInvoices.length,
    });

    return billingCycle;
  }

  async processPayment(accountId: string, amount: number) {
    const account = await (this.prisma as any).corporateAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');

    const payment = await (this.prisma as any).corporatePayment.create({
      data: {
        accountId,
        amount,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    await (this.prisma as any).corporateAccount.update({
      where: { id: accountId },
      data: {
        usedCredit: { decrement: Math.min(amount, account.usedCredit) },
        availableCredit: { increment: Math.min(amount, account.creditLimit - account.availableCredit) },
        lastPaymentDate: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('CORPORATE_PAYMENT_PROCESSED', accountId, account.usedCredit, {
      amount,
      newAvailableCredit: Math.min(account.availableCredit + amount, account.creditLimit),
    });

    return payment;
  }

  async updateCreditLimit(accountId: string, newLimit: number) {
    const account = await (this.prisma as any).corporateAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);
    if (newLimit < account.usedCredit) {
      throw new BadRequestException('New credit limit cannot be less than used credit');
    }

    const updated = await (this.prisma as any).corporateAccount.update({
      where: { id: accountId },
      data: {
        creditLimit: newLimit,
        availableCredit: newLimit - account.usedCredit,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('CREDIT_LIMIT_UPDATED', accountId, account.creditLimit, {
      newLimit,
      previousLimit: account.creditLimit,
    });

    return updated;
  }

  async suspendAccount(id: string, reason?: string) {
    const account = await (this.prisma as any).corporateAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Corporate account ${id} not found`);
    if (account.status === 'SUSPENDED') throw new BadRequestException('Account is already suspended');

    const updated = await (this.prisma as any).corporateAccount.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: reason || 'Suspended by admin',
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('CORPORATE_ACCOUNT_SUSPENDED', id, account.status, {
      reason: reason || 'Suspended by admin',
    });

    return updated;
  }

  async getAccountAging(accountId: string): Promise<CorporateAgingBucket> {
    const account = await (this.prisma as any).corporateAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Corporate account ${accountId} not found`);

    const now = new Date();
    const invoices = await (this.prisma as any).corporateInvoice.findMany({
      where: { accountId, status: { in: ['PENDING', 'BILLED'] } },
      include: { invoice: true },
    });

    const aging: CorporateAgingBucket = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      days90Plus: 0,
    };

    for (const ci of invoices) {
      const dueDate = new Date(ci.invoice.dueDate);
      const daysSinceDue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysSinceDue <= 0) {
        aging.current += ci.amount;
      } else if (daysSinceDue <= 30) {
        aging.days1To30 += ci.amount;
      } else if (daysSinceDue <= 60) {
        aging.days31To60 += ci.amount;
      } else if (daysSinceDue <= 90) {
        aging.days61To90 += ci.amount;
      } else {
        aging.days90Plus += ci.amount;
      }
    }

    return aging;
  }

  async getCorporateReport(filters: CorporateReportFilters) {
    const { status, search, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [accounts, total] = await Promise.all([
      (this.prisma as any).corporateAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).corporateAccount.count({ where }),
    ]);

    const summary = await (this.prisma as any).corporateAccount.aggregate({
      _sum: { creditLimit: true, usedCredit: true, availableCredit: true },
      _count: true,
    });

    return {
      data: accounts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        totalAccounts: summary._count,
        totalCreditLimit: summary._sum.creditLimit || 0,
        totalUsedCredit: summary._sum.usedCredit || 0,
        totalAvailableCredit: summary._sum.availableCredit || 0,
      },
    };
  }

  private async generateAccountNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const lastAccount = await (this.prisma as any).corporateAccount.findFirst({
      where: { accountNumber: { startsWith: `CORP-${year}` } },
      orderBy: { accountNumber: 'desc' },
    });

    let sequence = 1;
    if (lastAccount) {
      const lastNum = parseInt(lastAccount.accountNumber.replace('CORP-', ''), 10);
      sequence = lastNum + 1;
    }

    return `CORP-${year}${sequence.toString().padStart(8, '0')}`;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'CORPORATE_ACCOUNT',
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
