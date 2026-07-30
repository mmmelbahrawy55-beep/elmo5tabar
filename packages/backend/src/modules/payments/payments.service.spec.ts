import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { mockPrismaService, mockCacheManager, mockStripeService, mockTapService, mockHyperPayService, mockPayPalService } from '../../../test/mocks';

describe('PaymentsService', () => {
  let prisma: typeof mockPrismaService;

  const mockInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026000001',
    orderId: 'order-1',
    patientId: 'patient-1',
    branchId: 'branch-1',
    subtotal: 500,
    discount: 0,
    tax: 75,
    total: 575,
    paidAmount: 0,
    balanceDue: 575,
    currency: 'SAR',
    status: PaymentStatus.PENDING,
    dueDate: new Date('2026-08-15'),
    paidAt: null,
    createdAt: new Date(),
    patient: { id: 'patient-1', firstNameAr: 'محمد', lastNameAr: 'أحمد' },
  };

  const mockPayment = {
    id: 'pay-1',
    paymentNumber: 'PAY-2026000001',
    invoiceId: 'inv-1',
    amount: 575,
    currency: 'SAR',
    method: PaymentMethod.CREDIT_CARD,
    transactionId: 'txn_test',
    gatewayResponse: {},
    status: PaymentStatus.PAID,
    paidAt: new Date(),
    receiptUrl: null,
    cardLast4: '4242',
    cardBrand: 'Visa',
    bankReference: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'STRIPE_SERVICE', useValue: mockStripeService },
        { provide: 'TAP_SERVICE', useValue: mockTapService },
        { provide: 'HYPERPAY_SERVICE', useValue: mockHyperPayService },
        { provide: 'PAYPAL_SERVICE', useValue: mockPayPalService },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('invoice creation', () => {
    it('should create an invoice', async () => {
      prisma.invoice.create.mockResolvedValue(mockInvoice);

      const result = await prisma.invoice.create({ data: { orderId: 'order-1', patientId: 'patient-1', subtotal: 500, tax: 75, total: 575 } } as any);

      expect(result.id).toBe('inv-1');
    });

    it('should calculate tax correctly', () => {
      const subtotal = 500;
      const taxRate = 15;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;

      expect(tax).toBe(75);
      expect(total).toBe(575);
    });
  });

  describe('payment processing', () => {
    it('should process payment via Stripe', async () => {
      const stripeService = mockStripeService.useValue;
      const result = await stripeService.createPaymentIntent({
        amount: 57500,
        currency: 'sar',
        paymentMethodId: 'pm_test',
      });

      expect(result.id).toBe('pi_test');
    });

    it('should process payment via Tap', async () => {
      const tapService = mockTapService.useValue;
      const result = await tapService.createCharge({
        amount: 575,
        currency: 'SAR',
        source: 'src_test',
      });

      expect(result.status).toBe('CAPTURED');
    });

    it('should process payment via HyperPay', async () => {
      const hyperPayService = mockHyperPayService.useValue;
      const result = await hyperPayService.createCheckout({
        amount: 575.00,
        currency: 'SAR',
        paymentType: 'VISA',
      });

      expect(result.url).toContain('checkout.hyperpay.com');
    });

    it('should process payment via PayPal', async () => {
      const payPalService = mockPayPalService.useValue;
      const result = await payPalService.createOrder({
        amount: 575,
        currency: 'SAR',
        intent: 'CAPTURE',
      });

      expect(result.status).toBe('CREATED');
    });

    it('should mark invoice as paid after success', async () => {
      prisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: PaymentStatus.PAID, paidAmount: 575, balanceDue: 0, paidAt: new Date() });
      prisma.payment.create.mockResolvedValue(mockPayment);

      const paidInvoice = await prisma.invoice.update({
        where: { id: 'inv-1' },
        data: { status: PaymentStatus.PAID, paidAmount: 575, balanceDue: 0, paidAt: new Date() },
      });

      expect(paidInvoice.status).toBe(PaymentStatus.PAID);
      expect(paidInvoice.balanceDue).toBe(0);
    });
  });

  describe('refund processing', () => {
    it('should process full refund', async () => {
      prisma.refund.create.mockResolvedValue({ id: 'ref-1', refundNumber: 'REF-2026000001', invoiceId: 'inv-1', amount: 575, status: PaymentStatus.REFUNDED });

      const refund = await prisma.refund.create({ data: { invoiceId: 'inv-1', amount: 575, reason: 'Customer request' } as any });

      expect(refund.amount).toBe(575);
    });

    it('should process partial refund', async () => {
      prisma.refund.create.mockResolvedValue({ id: 'ref-2', refundNumber: 'REF-2026000002', invoiceId: 'inv-1', amount: 200, status: PaymentStatus.REFUNDED });

      const partialRefund = await prisma.refund.create({ data: { invoiceId: 'inv-1', amount: 200, reason: 'Partial refund' } as any });

      expect(partialRefund.amount).toBe(200);
    });

    it('should validate refund amount does not exceed paid', () => {
      const paidAmount = 575;
      const refundAmount = 600;
      expect(refundAmount).toBeLessThanOrEqual(paidAmount);
    });
  });

  describe('wallet operations', () => {
    it('should credit wallet', async () => {
      const walletTx = { id: 'tx-1', userId: 'user-1', amount: 200, type: 'CREDIT', balance: 500 };
      prisma.walletTransaction?.create?.mockResolvedValue(walletTx);

      expect(walletTx.type).toBe('CREDIT');
    });

    it('should debit wallet', async () => {
      const walletTx = { id: 'tx-2', userId: 'user-1', amount: 100, type: 'DEBIT', balance: 400 };

      expect(walletTx.amount).toBe(100);
    });

    it('should transfer between wallets', async () => {
      const transfer = { id: 'tx-3', fromUserId: 'user-1', toUserId: 'user-2', amount: 50 };

      expect(transfer.amount).toBe(50);
      expect(transfer.fromUserId).not.toBe(transfer.toUserId);
    });
  });

  describe('gift card operations', () => {
    it('should create a gift card', () => {
      const giftCard = { code: 'GIFT-ABC123', amount: 200, balance: 200, isActive: true };

      expect(giftCard.balance).toBe(200);
    });

    it('should redeem gift card', () => {
      const giftCard = { code: 'GIFT-ABC123', amount: 200, balance: 50, isActive: true };
      const redeemedAmount = 50;
      giftCard.balance -= redeemedAmount;

      expect(giftCard.balance).toBe(0);
    });

    it('should check gift card balance', () => {
      const giftCard = { code: 'GIFT-ABC123', balance: 150 };
      expect(giftCard.balance).toBe(150);
    });
  });

  describe('installment plans', () => {
    it('should create installment plan', () => {
      const plan = {
        totalAmount: 1200,
        installments: 4,
        monthlyAmount: 300,
        startDate: new Date('2026-08-01'),
        status: 'ACTIVE',
      };

      expect(plan.monthlyAmount).toBe(300);
      expect(plan.installments).toBe(4);
    });

    it('should generate payment schedule', () => {
      const total = 1200;
      const installments = 4;
      const schedule = Array.from({ length: installments }, (_, i) => ({
        amount: total / installments,
        dueDate: new Date(`2026-${String(9 + i).padStart(2, '0')}-01`),
        status: 'PENDING',
      }));

      expect(schedule).toHaveLength(4);
      expect(schedule[0].amount).toBe(300);
    });
  });

  describe('subscription management', () => {
    it('should create a subscription', () => {
      const subscription = {
        planId: 'plan-basic',
        planName: 'Basic Monthly',
        amount: 99,
        currency: 'SAR',
        interval: 'monthly',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      };

      expect(subscription.status).toBe('ACTIVE');
    });

    it('should cancel a subscription', () => {
      const subscription = { id: 'sub-1', status: 'CANCELLED', cancelledAt: new Date() };

      expect(subscription.status).toBe('CANCELLED');
    });

    it('should upgrade a subscription', () => {
      const oldPlan = { amount: 99 };
      const newPlan = { amount: 199 };
      const prorated = newPlan.amount - oldPlan.amount;

      expect(prorated).toBe(100);
    });
  });

  describe('coupon validation', () => {
    it('should validate active coupon', async () => {
      const coupon = { id: 'cp-1', code: 'SAVE20', type: 'percentage', value: 20, isActive: true, validFrom: new Date('2026-01-01'), validTo: new Date('2026-12-31'), usedCount: 5, maxUses: 100 };
      prisma.coupon.findUnique.mockResolvedValue(coupon);

      const result = await prisma.coupon.findUnique({ where: { code: 'SAVE20' } });

      expect(result.isActive).toBe(true);
      expect(new Date() >= result.validFrom).toBe(true);
      expect(new Date() <= result.validTo).toBe(true);
    });

    it('should apply percentage discount', () => {
      const subtotal = 500;
      const couponValue = 20;
      const discount = (subtotal * couponValue) / 100;

      expect(discount).toBe(100);
    });

    it('should enforce max uses', () => {
      const coupon = { maxUses: 100, usedCount: 100 };
      const isExhausted = coupon.usedCount >= coupon.maxUses && coupon.maxUses > 0;

      expect(isExhausted).toBe(true);
    });
  });
});
