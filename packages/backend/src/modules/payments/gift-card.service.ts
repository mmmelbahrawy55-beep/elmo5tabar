import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import * as crypto from 'crypto';

export interface PurchaseGiftCardDto {
  amount: number;
  currency?: string;
  purchaserName?: string;
  purchaserEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  branchId?: string;
}

export interface GiftCardStats {
  totalPurchased: number;
  totalRedeemed: number;
  totalOutstanding: number;
  totalValuePurchased: number;
  totalValueRedeemed: number;
  totalValueOutstanding: number;
}

@Injectable()
export class GiftCardService {
  private readonly logger = new Logger(GiftCardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async purchaseGiftCard(dto: PurchaseGiftCardDto) {
    const cardNumber = await this.generateCardNumber();
    const rawCode = this.generateCardCode();
    const codeHash = this.hashCode(rawCode);

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const card = await (this.prisma as any).giftCard.create({
      data: {
        cardNumber,
        codeHash,
        amount: dto.amount,
        balance: dto.amount,
        currency: dto.currency || 'SAR',
        purchaserName: dto.purchaserName,
        purchaserEmail: dto.purchaserEmail,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        message: dto.message,
        status: 'ACTIVE',
        expiresAt: expiryDate,
        branchId: dto.branchId,
      },
    });

    await this.createAuditLog('GIFT_CARD_PURCHASED', card.id, null, {
      cardNumber,
      amount: dto.amount,
      purchaserEmail: dto.purchaserEmail,
    });

    return {
      ...card,
      code: rawCode,
    };
  }

  async redeemGiftCard(cardCode: string, amount: number, patientId: string) {
    const card = await this.findCardByCode(cardCode);
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.status !== 'ACTIVE') throw new BadRequestException(`Gift card is ${card.status.toLowerCase()}`);
    if (new Date(card.expiresAt) < new Date()) throw new BadRequestException('Gift card has expired');
    if (card.balance < amount) throw new BadRequestException('Insufficient gift card balance');

    const transaction = await (this.prisma as any).giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        type: 'REDEMPTION',
        amount,
        patientId,
        status: 'COMPLETED',
      },
    });

    const updatedCard = await (this.prisma as any).giftCard.update({
      where: { id: card.id },
      data: {
        balance: { decrement: amount },
        usedAt: card.amount - amount <= 0 ? new Date() : undefined,
        status: card.amount - amount <= 0 ? 'FULLY_USED' : card.status,
      },
    });

    await this.createAuditLog('GIFT_CARD_REDEEMED', card.id, card.balance, {
      amount,
      newBalance: updatedCard.balance,
      patientId,
    });

    return { card: updatedCard, transaction };
  }

  async getGiftCard(cardNumber: string) {
    const card = await (this.prisma as any).giftCard.findUnique({
      where: { cardNumber },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!card) throw new NotFoundException(`Gift card ${cardNumber} not found`);
    return card;
  }

  async getGiftCardBalance(cardCode: string): Promise<number> {
    const card = await this.findCardByCode(cardCode);
    if (!card) throw new NotFoundException('Gift card not found');
    return card.balance;
  }

  async deactivateGiftCard(cardNumber: string) {
    const card = await (this.prisma as any).giftCard.findUnique({
      where: { cardNumber },
    });
    if (!card) throw new NotFoundException(`Gift card ${cardNumber} not found`);

    const updated = await (this.prisma as any).giftCard.update({
      where: { cardNumber },
      data: { status: 'DEACTIVATED', updatedAt: new Date() },
    });

    await this.createAuditLog('GIFT_CARD_DEACTIVATED', card.id, card.status, {
      cardNumber,
      remainingBalance: card.balance,
    });

    return updated;
  }

  async validateGiftCard(cardCode: string): Promise<{
    valid: boolean;
    balance?: number;
    expiresAt?: Date;
    status?: string;
    error?: string;
  }> {
    const card = await this.findCardByCode(cardCode);

    if (!card) return { valid: false, error: 'Gift card not found' };
    if (card.status === 'DEACTIVATED') return { valid: false, status: card.status, error: 'Gift card is deactivated' };
    if (card.status === 'EXPIRED') return { valid: false, status: card.status, error: 'Gift card has expired' };
    if (new Date(card.expiresAt) < new Date()) return { valid: false, status: 'EXPIRED', error: 'Gift card has expired' };
    if (card.balance <= 0) return { valid: false, status: 'FULLY_USED', error: 'Gift card has no remaining balance' };

    return {
      valid: true,
      balance: card.balance,
      expiresAt: card.expiresAt,
      status: card.status,
    };
  }

  async getGiftCardStats(): Promise<GiftCardStats> {
    const allCards = await (this.prisma as any).giftCard.findMany({
      select: { amount: true, balance: true, status: true },
    });

    const totalPurchased = allCards.length;
    const totalRedeemed = allCards.filter((c: { status: string }) => c.status === 'FULLY_USED').length;
    const totalOutstanding = totalPurchased - totalRedeemed;

    const totalValuePurchased = allCards.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0);
    const totalValueOutstanding = allCards.reduce(
      (sum: number, c: { balance: number }) => sum + c.balance,
      0,
    );
    const totalValueRedeemed = totalValuePurchased - totalValueOutstanding;

    return {
      totalPurchased,
      totalRedeemed,
      totalOutstanding,
      totalValuePurchased,
      totalValueRedeemed,
      totalValueOutstanding,
    };
  }

  async generateCardNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const lastCard = await (this.prisma as any).giftCard.findFirst({
      where: { cardNumber: { startsWith: `GC-${year}` } },
      orderBy: { cardNumber: 'desc' },
    });

    let sequence = 1;
    if (lastCard) {
      const lastNum = parseInt(lastCard.cardNumber.replace('GC-', ''), 10);
      sequence = lastNum + 1;
    }

    return `GC-${year}${sequence.toString().padStart(8, '0')}`;
  }

  private generateCardCode(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async findCardByCode(cardCode: string): Promise<any> {
    const codeHash = this.hashCode(cardCode);
    return (this.prisma as any).giftCard.findFirst({
      where: { codeHash },
    });
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'GIFT_CARD',
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
