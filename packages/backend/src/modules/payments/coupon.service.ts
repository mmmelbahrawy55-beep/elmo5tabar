import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Record<string, unknown>;
  discount?: number;
  error?: string;
}

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageLimitPerPatient?: number;
  applicableTests?: string[];
  applicablePackages?: string[];
  excludeItems?: string[];
  startDate?: string;
  expiresAt?: string;
  branchId?: string;
}

export interface UpdateCouponDto {
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageLimitPerPatient?: number;
  applicableTests?: string[];
  applicablePackages?: string[];
  excludeItems?: string[];
  expiresAt?: string;
  isActive?: boolean;
}

export interface CouponStats {
  code: string;
  totalUsage: number;
  totalDiscountGiven: number;
  uniquePatients: number;
  averageDiscount: number;
}

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(code: string, invoiceId?: string): Promise<CouponValidationResult> {
    const coupon = await (this.prisma as any).coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!coupon) return { valid: false, error: 'Coupon not found or inactive' };

    const now = new Date();

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return { valid: false, coupon, error: 'Coupon has expired' };
    }

    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { valid: false, coupon, error: 'Coupon is not yet active' };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, coupon, error: 'Coupon usage limit reached' };
    }

    if (invoiceId) {
      const invoice = await (this.prisma as any).invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      if (invoice) {
        if (coupon.minAmount && invoice.subtotal < coupon.minAmount) {
          return {
            valid: false,
            coupon,
            error: `Minimum amount ${coupon.minAmount} not met. Invoice subtotal: ${invoice.subtotal}`,
          };
        }

        if (coupon.applicableTests && coupon.applicableTests.length > 0) {
          const hasApplicableItem = invoice.items.some(
            (item: { labTestId?: string }) =>
              coupon.applicableTests.includes(item.labTestId),
          );
          if (!hasApplicableItem) {
            return { valid: false, coupon, error: 'Coupon is not applicable to any items in this invoice' };
          }
        }

        if (coupon.excludeItems && coupon.excludeItems.length > 0) {
          const hasExcludedItem = invoice.items.some(
            (item: { labTestId?: string }) =>
              coupon.excludeItems.includes(item.labTestId),
          );
          if (hasExcludedItem) {
            return { valid: false, coupon, error: 'Some items in the invoice are excluded from this coupon' };
          }
        }
      }
    }

    return { valid: true, coupon };
  }

  async applyCoupon(invoiceId: string, code: string) {
    const validation = await this.validateCoupon(code, invoiceId);
    if (!validation.valid) throw new BadRequestException(validation.error);

    const coupon = validation.coupon!;

    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, discounts: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const existingCouponDiscount = invoice.discounts?.find(
      (d: { code: string }) => d.code === code.toUpperCase(),
    );
    if (existingCouponDiscount) throw new BadRequestException('Coupon already applied to this invoice');

    const subtotal = invoice.subtotal;
    let discountAmount: number;

    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round(subtotal * ((coupon.discountValue as number) / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue as number, subtotal);
    }

    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount as number);
    }

    await (this.prisma as any).invoiceDiscount.create({
      data: {
        invoiceId,
        couponId: coupon.id,
        code: code.toUpperCase(),
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        amount: discountAmount,
      },
    });

    const taxAmount = Math.round((subtotal - discountAmount) * 0.15 * 100) / 100;
    const newTotal = subtotal - discountAmount + taxAmount - (invoice.insuranceCoverage || 0);

    await (this.prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        discountAmount: { increment: discountAmount },
        taxAmount,
        total: Math.max(newTotal, 0),
        updatedAt: new Date(),
      },
    });

    await (this.prisma as any).coupon.update({
      where: { id: coupon.id },
      data: { usageCount: { increment: 1 } },
    });

    await this.createAuditLog('COUPON_APPLIED', invoiceId, null, {
      code: code.toUpperCase(),
      discountAmount,
      couponId: coupon.id,
    });

    return {
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      newTotal: Math.max(newTotal, 0),
    };
  }

  async createCoupon(dto: CreateCouponDto) {
    const existing = await (this.prisma as any).coupon.findFirst({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new BadRequestException('Coupon code already exists');

    if (dto.discountType === 'PERCENTAGE' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const coupon = await (this.prisma as any).coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minAmount: dto.minAmount,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        usageLimitPerPatient: dto.usageLimitPerPatient,
        applicableTests: dto.applicableTests ? JSON.stringify(dto.applicableTests) : null,
        applicablePackages: dto.applicablePackages ? JSON.stringify(dto.applicablePackages) : null,
        excludeItems: dto.excludeItems ? JSON.stringify(dto.excludeItems) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: true,
        usageCount: 0,
        branchId: dto.branchId,
      },
    });

    await this.createAuditLog('COUPON_CREATED', coupon.id, null, {
      code: dto.code,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
    });

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await (this.prisma as any).coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);

    if (dto.discountType === 'PERCENTAGE' && dto.discountValue && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minAmount !== undefined && { minAmount: dto.minAmount }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.usageLimitPerPatient !== undefined && { usageLimitPerPatient: dto.usageLimitPerPatient }),
        ...(dto.applicableTests !== undefined && {
          applicableTests: JSON.stringify(dto.applicableTests),
        }),
        ...(dto.applicablePackages !== undefined && {
          applicablePackages: JSON.stringify(dto.applicablePackages),
        }),
        ...(dto.excludeItems !== undefined && {
          excludeItems: JSON.stringify(dto.excludeItems),
        }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('COUPON_UPDATED', id, coupon, dto as Record<string, unknown>);

    return updated;
  }

  async deactivateCoupon(id: string) {
    const coupon = await (this.prisma as any).coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon ${id} not found`);

    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    await this.createAuditLog('COUPON_DEACTIVATED', id, coupon.isActive, { code: coupon.code });

    return updated;
  }

  async getCouponStats(code: string): Promise<CouponStats> {
    const coupon = await (this.prisma as any).coupon.findFirst({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) throw new NotFoundException(`Coupon ${code} not found`);

    const usages = await (this.prisma as any).invoiceDiscount.findMany({
      where: { code: code.toUpperCase() },
    });

    const totalUsage = usages.length;
    const totalDiscountGiven = usages.reduce(
      (sum: number, u: { amount: number }) => sum + u.amount,
      0,
    );
    const uniquePatients = new Set(
      usages.map((u: { invoiceId: string }) => u.invoiceId),
    ).size;

    return {
      code: coupon.code,
      totalUsage,
      totalDiscountGiven,
      uniquePatients,
      averageDiscount: totalUsage > 0 ? Math.round((totalDiscountGiven / totalUsage) * 100) / 100 : 0,
    };
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'COUPON',
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
