import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';

export interface InstallmentPlanDto {
  patientId: string;
  invoiceId: string;
  totalAmount: number;
  numberOfInstallments: number;
  interestRate?: number;
  downPayment?: number;
  firstPaymentDate?: string;
  currency?: string;
  branchId?: string;
}

export interface InstallmentPlanStats {
  activePlans: number;
  overduePlans: number;
  completedPlans: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
}

@Injectable()
export class InstallmentService {
  private readonly logger = new Logger(InstallmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPlan(dto: InstallmentPlanDto) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);

    const existingPlan = await (this.prisma as any).installmentPlan.findFirst({
      where: { invoiceId: dto.invoiceId, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (existingPlan) throw new BadRequestException('Installment plan already exists for this invoice');

    const principalAmount = dto.totalAmount - (dto.downPayment || 0);
    const interestRate = dto.interestRate || 0;
    const totalInterest = principalAmount * (interestRate / 100);
    const totalWithInterest = principalAmount + totalInterest;
    const monthlyAmount = Math.round((totalWithInterest / dto.numberOfInstallments) * 100) / 100;

    const firstPaymentDate = dto.firstPaymentDate
      ? new Date(dto.firstPaymentDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const plan = await (this.prisma as any).installmentPlan.create({
      data: {
        patientId: dto.patientId,
        invoiceId: dto.invoiceId,
        totalAmount: dto.totalAmount,
        principalAmount,
        interestRate,
        totalInterest,
        monthlyAmount,
        numberOfInstallments: dto.numberOfInstallments,
        remainingInstallments: dto.numberOfInstallments,
        downPayment: dto.downPayment || 0,
        status: 'ACTIVE',
        firstPaymentDate,
        nextPaymentDate: firstPaymentDate,
        currency: dto.currency || 'SAR',
        branchId: dto.branchId,
      },
    });

    const schedule = await this.generateSchedule(plan, firstPaymentDate);

    await this.createAuditLog('INSTALLMENT_PLAN_CREATED', plan.id, null, {
      patientId: dto.patientId,
      invoiceId: dto.invoiceId,
      totalAmount: dto.totalAmount,
      numberOfInstallments: dto.numberOfInstallments,
      monthlyAmount,
    });

    return { plan, schedule };
  }

  async getPlan(id: string) {
    const plan = await (this.prisma as any).installmentPlan.findUnique({
      where: { id },
      include: {
        schedule: { orderBy: { installmentNumber: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        patient: true,
        invoice: true,
      },
    });
    if (!plan) throw new NotFoundException(`Installment plan ${id} not found`);
    return plan;
  }

  async processInstallmentPayment(planId: string, installmentNumber: number) {
    const plan = await this.getPlan(planId);
    if (plan.status !== 'ACTIVE') throw new BadRequestException('Plan is not active');

    const installment = await (this.prisma as any).installmentSchedule.findFirst({
      where: { planId, installmentNumber },
    });
    if (!installment) throw new NotFoundException(`Installment #${installmentNumber} not found`);
    if (installment.status === 'PAID') throw new BadRequestException(`Installment #${installmentNumber} is already paid`);

    const payment = await (this.prisma as any).payment.create({
      data: {
        invoiceId: plan.invoiceId,
        patientId: plan.patientId,
        method: 'INSTALLMENT',
        amount: installment.amount,
        currency: plan.currency,
        status: 'COMPLETED',
        installmentPlanId: planId,
        description: `Installment #${installmentNumber} payment`,
      },
    });

    await (this.prisma as any).installmentSchedule.update({
      where: { id: installment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentId: payment.id,
      },
    });

    const paidCount = await (this.prisma as any).installmentSchedule.count({
      where: { planId, status: 'PAID' },
    });

    const newStatus = paidCount >= plan.numberOfInstallments ? 'COMPLETED' : 'ACTIVE';

    const nextInstallment = await (this.prisma as any).installmentSchedule.findFirst({
      where: { planId, status: 'PENDING' },
      orderBy: { installmentNumber: 'asc' },
    });

    await (this.prisma as any).installmentPlan.update({
      where: { id: planId },
      data: {
        status: newStatus,
        remainingInstallments: plan.numberOfInstallments - paidCount,
        lastPaymentDate: new Date(),
        nextPaymentDate: nextInstallment?.dueDate || null,
        completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('INSTALLMENT_PAID', planId, installment.status, {
      installmentNumber,
      amount: installment.amount,
      paymentId: payment.id,
    });

    return { payment, planStatus: newStatus };
  }

  async getPatientPlans(patientId: string) {
    const plans = await (this.prisma as any).installmentPlan.findMany({
      where: { patientId },
      include: {
        schedule: { orderBy: { installmentNumber: 'asc' } },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return plans;
  }

  async overdueCheck() {
    const now = new Date();

    const overdueInstallments = await (this.prisma as any).installmentSchedule.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      include: { plan: true },
    });

    const lateFeeRate = 0.02;

    for (const installment of overdueInstallments) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(installment.dueDate).getTime()) / (24 * 60 * 60 * 1000),
      );

      if (daysOverdue > 0) {
        const lateFee = Math.round(installment.amount * lateFeeRate * 100) / 100;

        await (this.prisma as any).installmentSchedule.update({
          where: { id: installment.id },
          data: {
            lateFee: { increment: lateFee },
            daysOverdue,
            updatedAt: now,
          },
        });

        this.logger.warn(
          `Overdue installment #${installment.installmentNumber} for plan ${installment.planId}: ${daysOverdue} days late, late fee: ${lateFee}`,
        );
      }

      if (daysOverdue >= 90) {
        await (this.prisma as any).installmentPlan.update({
          where: { id: installment.planId },
          data: {
            status: 'DEFAULTED',
            updatedAt: now,
          },
        });

        this.logger.warn(`Plan ${installment.planId} marked as DEFAULTED: 90+ days overdue`);

        await this.createAuditLog('INSTALLMENT_PLAN_DEFAULTED', installment.planId, 'ACTIVE', {
          daysOverdue,
          installmentNumber: installment.installmentNumber,
        });
      } else if (daysOverdue >= 30) {
        await (this.prisma as any).installmentPlan.update({
          where: { id: installment.planId },
          data: {
            status: 'OVERDUE',
            updatedAt: now,
          },
        });
      }
    }

    return {
      checkedAt: now,
      overdueCount: overdueInstallments.length,
    };
  }

  async cancelPlan(planId: string) {
    const plan = await this.getPlan(planId);
    if (plan.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed plan');
    if (plan.status === 'CANCELLED') throw new BadRequestException('Plan is already cancelled');

    const unpaidCount = await (this.prisma as any).installmentSchedule.count({
      where: { planId, status: 'PENDING' },
    });

    if (unpaidCount < plan.numberOfInstallments) {
      throw new BadRequestException(
        'Cannot cancel plan with already-paid installments. All paid amounts must be refunded first.',
      );
    }

    await (this.prisma as any).installmentSchedule.updateMany({
      where: { planId, status: 'PENDING' },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });

    const updated = await (this.prisma as any).installmentPlan.update({
      where: { id: planId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        remainingInstallments: 0,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog('INSTALLMENT_PLAN_CANCELLED', planId, plan.status, {
      cancelledInstallments: unpaidCount,
    });

    return updated;
  }

  async getPlanStats(): Promise<InstallmentPlanStats> {
    const [activePlans, overduePlans, completedPlans, outstandingResult, overdueAmountResult] =
      await Promise.all([
        (this.prisma as any).installmentPlan.count({ where: { status: 'ACTIVE' } }),
        (this.prisma as any).installmentPlan.count({ where: { status: 'OVERDUE' } }),
        (this.prisma as any).installmentPlan.count({ where: { status: 'COMPLETED' } }),
        (this.prisma as any).installmentSchedule.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true },
        }),
        (this.prisma as any).installmentSchedule.aggregate({
          where: { status: 'PENDING', dueDate: { lt: new Date() } },
          _sum: { amount: true },
        }),
      ]);

    return {
      activePlans,
      overduePlans,
      completedPlans,
      totalOutstanding: outstandingResult._sum.amount || 0,
      totalOverdueAmount: overdueAmountResult._sum.amount || 0,
    };
  }

  private async generateSchedule(
    plan: Record<string, unknown>,
    firstPaymentDate: Date,
  ): Promise<Array<Record<string, unknown>>> {
    const monthlyAmount = plan.monthlyAmount as number;
    const numberOfInstallments = plan.numberOfInstallments as number;
    const schedule: Array<Record<string, unknown>> = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const installment = await (this.prisma as any).installmentSchedule.create({
        data: {
          planId: plan.id,
          installmentNumber: i,
          amount: monthlyAmount,
          dueDate,
          status: 'PENDING',
        },
      });

      schedule.push(installment);
    }

    return schedule;
  }

  private async createAuditLog(action: string, entityId: string, previousState: unknown, metadata: Record<string, unknown>) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action,
          entityType: 'INSTALLMENT',
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
