import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface CreateSubscriptionDto {
  patientId: string;
  packageId: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  amount: number;
  currency?: string;
  startDate?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
  branchId?: string;
}

export interface SubscriptionStats {
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  totalMRR: number;
  churnedThisMonth: number;
  newThisMonth: number;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(dto: CreateSubscriptionDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const nextBillingDate = this.calculateNextBillingDate(startDate, dto.billingCycle);

    const subscription = await (this.prisma as any).subscription.create({
      data: {
        patientId: dto.patientId,
        packageId: dto.packageId,
        billingCycle: dto.billingCycle,
        amount: dto.amount,
        currency: dto.currency || 'SAR',
        status: 'ACTIVE',
        startDate,
        nextBillingDate,
        paymentMethod: dto.paymentMethod,
        autoRenew: dto.autoRenew !== false,
        branchId: dto.branchId,
      },
    });

    await (this.prisma as any).subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: dto.amount,
        status: 'PENDING',
        billingPeriodStart: startDate,
        billingPeriodEnd: nextBillingDate,
      },
    });

    await this.createAuditLog('SUBSCRIPTION_CREATED', subscription.id, null, {
      patientId: dto.patientId,
      packageId: dto.packageId,
      amount: dto.amount,
      billingCycle: dto.billingCycle,
    });

    return subscription;
  }

  async processRenewal(subscriptionId: string) {
    const subscription = await (this.prisma as any).subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    if (subscription.status !== 'ACTIVE') throw new BadRequestException('Subscription is not active');

    const billingRecord = await (this.prisma as any).subscriptionPayment.findFirst({
      where: {
        subscriptionId,
        status: 'PENDING',
      },
    });

    if (!billingRecord) throw new BadRequestException('No pending billing record');

    const nextBillingDate = this.calculateNextBillingDate(
      new Date(subscription.nextBillingDate),
      subscription.billingCycle,
    );

    try {
      await (this.prisma as any).subscriptionPayment.update({
        where: { id: billingRecord.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      const newBillingRecord = await (this.prisma as any).subscriptionPayment.create({
        data: {
          subscriptionId,
          amount: subscription.amount,
          status: 'PENDING',
          billingPeriodStart: subscription.nextBillingDate,
          billingPeriodEnd: nextBillingDate,
        },
      });

      await (this.prisma as any).subscription.update({
        where: { id: subscriptionId },
        data: {
          nextBillingDate,
          lastBillingDate: new Date(),
          renewalCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      await this.createAuditLog('SUBSCRIPTION_RENEWED', subscriptionId, subscription.status, {
        amount: subscription.amount,
        nextBillingDate,
      });

      return { success: true, nextBillingDate, billingRecordId: newBillingRecord.id };
    } catch (error) {
      this.logger.error(`Subscription renewal failed for ${subscriptionId}: ${(error as Error).message}`);

      await (this.prisma as any).subscriptionPayment.update({
        where: { id: billingRecord.id },
        data: { status: 'FAILED' },
      });

      await (this.prisma as any).subscription.update({
        where: { id: subscriptionId },
        data: {
          failedRenewals: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async pauseSubscription(id: string) {
    const subscription = await (this.prisma as any).subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException(`Subscription ${id} not found`);
    if (subscription.status !== 'ACTIVE') throw new BadRequestException('Only active subscriptions can be paused');

    const updated = await (this.prisma as any).subscription.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        previousStatus: subscription.status,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('SUBSCRIPTION_PAUSED', id, subscription.status, null);

    return updated;
  }

  async resumeSubscription(id: string) {
    const subscription = await (this.prisma as any).subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException(`Subscription ${id} not found`);
    if (subscription.status !== 'PAUSED') throw new BadRequestException('Subscription is not paused');

    const nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      subscription.billingCycle,
    );

    const updated = await (this.prisma as any).subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        resumedAt: new Date(),
        nextBillingDate,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('SUBSCRIPTION_RESUMED', id, subscription.status, {
      nextBillingDate,
    });

    return updated;
  }

  async cancelSubscription(id: string) {
    const subscription = await (this.prisma as any).subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException(`Subscription ${id} not found`);
    if (subscription.status === 'CANCELLED') throw new BadRequestException('Subscription is already cancelled');

    const proration = this.calculateProration(subscription);

    await (this.prisma as any).subscriptionPayment.updateMany({
      where: { subscriptionId: id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    const updated = await (this.prisma as any).subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'User cancelled',
        prorationAmount: proration.amount,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('SUBSCRIPTION_CANCELLED', id, subscription.status, {
      prorationAmount: proration.amount,
      refundAmount: proration.refund,
    });

    return { subscription: updated, proration };
  }

  async getSubscription(id: string) {
    const subscription = await (this.prisma as any).subscription.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { createdAt: 'desc' } },
        patient: true,
        package: true,
      },
    });
    if (!subscription) throw new NotFoundException(`Subscription ${id} not found`);
    return subscription;
  }

  async getPatientSubscriptions(patientId: string) {
    const subscriptions = await (this.prisma as any).subscription.findMany({
      where: { patientId },
      include: {
        package: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return subscriptions;
  }

  async checkDueSubscriptions() {
    const now = new Date();

    const dueSubscriptions = await (this.prisma as any).subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: now },
      },
    });

    this.logger.log(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

    const results: Array<{ subscriptionId: string; success: boolean; error?: string }> = [];

    for (const subscription of dueSubscriptions) {
      try {
        await this.processRenewal(subscription.id);
        results.push({ subscriptionId: subscription.id, success: true });
      } catch (error) {
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      checkedAt: now,
      totalDue: dueSubscriptions.length,
      results,
    };
  }

  async getSubscriptionStats(): Promise<SubscriptionStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [active, paused, cancelled, mrrResult, churnedThisMonth, newThisMonth] = await Promise.all([
      (this.prisma as any).subscription.count({ where: { status: 'ACTIVE' } }),
      (this.prisma as any).subscription.count({ where: { status: 'PAUSED' } }),
      (this.prisma as any).subscription.count({ where: { status: 'CANCELLED' } }),
      (this.prisma as any).subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      (this.prisma as any).subscription.count({
        where: {
          status: 'CANCELLED',
          cancelledAt: { gte: monthStart },
        },
      }),
      (this.prisma as any).subscription.count({
        where: {
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    const totalMRR = mrrResult._sum.amount || 0;

    return {
      activeSubscriptions: active,
      pausedSubscriptions: paused,
      cancelledSubscriptions: cancelled,
      totalMRR,
      churnedThisMonth,
      newThisMonth,
    };
  }

  private calculateNextBillingDate(fromDate: Date, billingCycle: string): Date {
    const next = new Date(fromDate);
    switch (billingCycle) {
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private calculateProration(subscription: Record<string, unknown>): { amount: number; refund: number } {
    const startDate = new Date(subscription.startDate as string);
    const nextBillingDate = new Date(subscription.nextBillingDate as string);
    const now = new Date();

    const totalPeriod = nextBillingDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const remaining = Math.max(totalPeriod - elapsed, 0);

    const dailyRate = (subscription.amount as number) / (totalPeriod / (24 * 60 * 60 * 1000));
    const remainingDays = remaining / (24 * 60 * 60 * 1000);
    const refund = Math.round(dailyRate * remainingDays * 100) / 100;

    return {
      amount: subscription.amount as number,
      refund,
    };
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'SUBSCRIPTION',
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
