import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface WalletTopUpDto {
  patientId: string;
  amount: number;
  paymentMethod: string;
  cardLast4?: string;
  cardBrand?: string;
}

export interface WalletTransactionFilters {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWallet(patientId: string) {
    const existing = await (this.prisma as any).wallet.findFirst({
      where: { patientId },
    });
    if (existing) throw new BadRequestException('Patient already has a wallet');

    const walletNumber = await this.generateWalletNumber();

    const wallet = await (this.prisma as any).wallet.create({
      data: {
        patientId,
        walletNumber,
        balance: 0,
        currency: 'SAR',
        status: 'ACTIVE',
      },
    });

    await this.createAuditLog('WALLET_CREATED', wallet.id, null, {
      patientId,
      walletNumber,
    });

    return wallet;
  }

  async getWallet(patientId: string) {
    const wallet = await (this.prisma as any).wallet.findFirst({
      where: { patientId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!wallet) throw new NotFoundException(`Wallet not found for patient ${patientId}`);
    return wallet;
  }

  async topUp(dto: WalletTopUpDto) {
    const wallet = await (this.prisma as any).wallet.findFirst({
      where: { patientId: dto.patientId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status === 'FROZEN') throw new BadRequestException('Wallet is frozen');
    if (wallet.status === 'CLOSED') throw new BadRequestException('Wallet is closed');

    const transaction = await (this.prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: dto.amount,
        description: `Wallet top-up via ${dto.paymentMethod}`,
        reference: `TOPUP-${Date.now()}`,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          paymentMethod: dto.paymentMethod,
          cardLast4: dto.cardLast4,
          cardBrand: dto.cardBrand,
        }),
      },
    });

    const updatedWallet = await (this.prisma as any).wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: dto.amount } },
    });

    await this.createAuditLog('WALLET_TOPUP', wallet.id, wallet.balance, {
      amount: dto.amount,
      newBalance: updatedWallet.balance,
      paymentMethod: dto.paymentMethod,
    });

    return { wallet: updatedWallet, transaction };
  }

  async deduct(walletId: string, amount: number, description: string, reference?: string) {
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status === 'FROZEN') throw new BadRequestException('Wallet is frozen');
    if (wallet.status === 'CLOSED') throw new BadRequestException('Wallet is closed');
    if (wallet.balance < amount) throw new BadRequestException('Insufficient balance');

    const transaction = await (this.prisma as any).walletTransaction.create({
      data: {
        walletId,
        type: 'DEBIT',
        amount,
        description,
        reference: reference || `DEDUCT-${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    const updatedWallet = await (this.prisma as any).wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } },
    });

    await this.createAuditLog('WALLET_DEDUCTED', walletId, wallet.balance, {
      amount,
      newBalance: updatedWallet.balance,
      description,
    });

    return { wallet: updatedWallet, transaction };
  }

  async transfer(fromWalletId: string, toWalletId: string, amount: number) {
    if (fromWalletId === toWalletId) throw new BadRequestException('Cannot transfer to the same wallet');

    const [fromWallet, toWallet] = await Promise.all([
      (this.prisma as any).wallet.findUnique({ where: { id: fromWalletId } }) as Promise<any>,
      (this.prisma as any).wallet.findUnique({ where: { id: toWalletId } }) as Promise<any>,
    ]);

    if (!fromWallet) throw new NotFoundException('Source wallet not found');
    if (!toWallet) throw new NotFoundException('Destination wallet not found');
    if (fromWallet.status === 'FROZEN') throw new BadRequestException('Source wallet is frozen');
    if (toWallet.status === 'CLOSED') throw new BadRequestException('Destination wallet is closed');
    if (fromWallet.balance < amount) throw new BadRequestException('Insufficient balance');

    const debitTransaction = await (this.prisma as any).walletTransaction.create({
      data: {
        walletId: fromWalletId,
        type: 'TRANSFER_OUT',
        amount,
        description: `Transfer to wallet ${toWallet.walletNumber}`,
        reference: `TRF-${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    const creditTransaction = await (this.prisma as any).walletTransaction.create({
      data: {
        walletId: toWalletId,
        type: 'TRANSFER_IN',
        amount,
        description: `Transfer from wallet ${fromWallet.walletNumber}`,
        reference: `TRF-${Date.now()}`,
        status: 'COMPLETED',
      },
    });

    await Promise.all([
      (this.prisma as any).wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: amount } },
      }),
      (this.prisma as any).wallet.update({
        where: { id: toWalletId },
        data: { balance: { increment: amount } },
      }),
    ]);

    await this.createAuditLog('WALLET_TRANSFER', fromWalletId, fromWallet.balance, {
      amount,
      toWalletId,
      toWalletNumber: toWallet.walletNumber,
    });

    return { debitTransaction, creditTransaction };
  }

  async getTransactions(walletId: string, filters: WalletTransactionFilters) {
    const { type, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const where: Record<string, unknown> = { walletId };

    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [transactions, total] = await Promise.all([
      (this.prisma as any).walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).walletTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async freezeWallet(walletId: string) {
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status === 'CLOSED') throw new BadRequestException('Cannot freeze a closed wallet');
    if (wallet.status === 'FROZEN') throw new BadRequestException('Wallet is already frozen');

    const updated = await (this.prisma as any).wallet.update({
      where: { id: walletId },
      data: { status: 'FROZEN', updatedAt: new Date() },
    });

    await this.createAuditLog('WALLET_FROZEN', walletId, wallet.status, {
      previousBalance: wallet.balance,
    });

    return updated;
  }

  async unfreezeWallet(walletId: string) {
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status !== 'FROZEN') throw new BadRequestException('Wallet is not frozen');

    const updated = await (this.prisma as any).wallet.update({
      where: { id: walletId },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    });

    await this.createAuditLog('WALLET_UNFROZEN', walletId, wallet.status, null);

    return updated;
  }

  async closeWallet(walletId: string) {
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.status === 'CLOSED') throw new BadRequestException('Wallet is already closed');
    if (wallet.balance > 0) {
      throw new BadRequestException('Wallet must have zero balance to close');
    }

    const updated = await (this.prisma as any).wallet.update({
      where: { id: walletId },
      data: { status: 'CLOSED', closedAt: new Date(), updatedAt: new Date() },
    });

    await this.createAuditLog('WALLET_CLOSED', walletId, wallet.status, null);

    return updated;
  }

  async getWalletBalance(patientId: string): Promise<number> {
    const wallet = await (this.prisma as any).wallet.findFirst({
      where: { patientId },
      select: { balance: true },
    });
    return wallet?.balance || 0;
  }

  private async generateWalletNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const lastWallet = await (this.prisma as any).wallet.findFirst({
      where: { walletNumber: { startsWith: `WAL-${year}` } },
      orderBy: { walletNumber: 'desc' },
    });

    let sequence = 1;
    if (lastWallet) {
      const lastNum = parseInt(lastWallet.walletNumber.replace('WAL-', ''), 10);
      sequence = lastNum + 1;
    }

    return `WAL-${year}${sequence.toString().padStart(8, '0')}`;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'WALLET',
          entityId,
          previousState: previousState ? JSON.stringify(previousState) : null,
          newState: JSON.stringify(metadata || {}),
          metadata: JSON.stringify(metadata || {}),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`);
    }
  }
}
