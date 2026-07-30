import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../services/payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPaymentsService = {
    createInvoice: jest.fn().mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-001' }),
    listInvoices: jest.fn().mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20 } }),
    getOutstandingInvoices: jest.fn().mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 20 } }),
    getInvoiceByOrder: jest.fn().mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-001' }),
    getInvoice: jest.fn().mockResolvedValue({ id: 'inv-1', total: 575 }),
    processPayment: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'COMPLETED' }),
    listPayments: jest.fn().mockResolvedValue([{ id: 'pay-1', amount: 575 }]),
    getPayment: jest.fn().mockResolvedValue({ id: 'pay-1', amount: 575 }),
    createRefund: jest.fn().mockResolvedValue({ id: 'ref-1', status: 'COMPLETED' }),
    getRefund: jest.fn().mockResolvedValue({ id: 'ref-1', amount: 100 }),
    getPaymentStats: jest.fn().mockResolvedValue({ totalRevenue: 100000, totalTransactions: 500 }),
    getRevenueReport: jest.fn().mockResolvedValue({ data: [], summary: { totalRevenue: 100000 } }),
    generateReceipt: jest.fn().mockResolvedValue({ receiptNumber: 'RCT-001', pdfUrl: 'http://example.com/receipt.pdf' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get(PaymentsController);
    jest.clearAllMocks();
  });

  it('should POST /payments/invoices', async () => {
    const result = await controller.createInvoice({ orderId: 'ord-1' });
    expect(result.id).toBeDefined();
  });

  it('should GET /payments/invoices', async () => {
    const result = await controller.listInvoices({ page: 1, limit: 20 }, 'PENDING', 'b-1', '2025-01-01', '2025-01-31');
    expect(result.data).toBeDefined();
  });

  it('should GET /payments/invoices/outstanding', async () => {
    const result = await controller.getOutstandingInvoices({ page: 1, limit: 20 });
    expect(result.data).toBeDefined();
  });

  it('should GET /payments/invoices/order/:orderId', async () => {
    const result = await controller.getInvoiceByOrder('ord-1');
    expect(result.id).toBe('inv-1');
  });

  it('should GET /payments/invoices/:id', async () => {
    const result = await controller.getInvoice('inv-1');
    expect(result.total).toBe(575);
  });

  it('should POST /payments/process', async () => {
    const result = await controller.processPayment({ invoiceId: 'inv-1', method: 'CREDIT_CARD', amount: 575, stripePaymentMethodId: 'pm_test' }, { user: { sub: 'user-1' } });
    expect(result.status).toBe('COMPLETED');
  });

  it('should GET /payments/invoice/:invoiceId/list', async () => {
    const result = await controller.listPayments('inv-1');
    expect(result).toHaveLength(1);
  });

  it('should GET /payments/:id', async () => {
    const result = await controller.getPayment('pay-1');
    expect(result.amount).toBe(575);
  });

  it('should POST /payments/refunds', async () => {
    const result = await controller.createRefund({ invoiceId: 'inv-1', amount: 100, reason: 'Partial' }, { user: { sub: 'user-1' } });
    expect(result.status).toBe('COMPLETED');
  });

  it('should GET /payments/refunds/:id', async () => {
    const result = await controller.getRefund('ref-1');
    expect(result.amount).toBe(100);
  });

  it('should GET /payments/stats/overview', async () => {
    const result = await controller.getStats('b-1', '2025-01-01', '2025-01-31');
    expect(result.totalRevenue).toBe(100000);
  });

  it('should GET /payments/reports/revenue', async () => {
    const result = await controller.getRevenueReport('2025-01-01', '2025-01-31', 'day');
    expect(result.summary).toBeDefined();
  });

  it('should GET /payments/receipt/:paymentId', async () => {
    const result = await controller.generateReceipt('pay-1');
    expect(result.receiptNumber).toBeDefined();
  });
});
