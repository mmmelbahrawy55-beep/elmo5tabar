import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators/roles.decorator';
import { Response, Request } from 'express';

import { InvoiceService } from './invoice.service';
import { PaymentsService } from './payments.service';
import { RefundService } from './refund.service';
import { WalletService } from './wallet.service';
import { GiftCardService } from './gift-card.service';
import { InstallmentService } from './installment.service';
import { CorporateService } from './corporate.service';
import { SubscriptionService } from './subscription.service';
import { CouponService } from './coupon.service';
import { TaxService } from './tax.service';
import { FraudDetectionService } from './fraud-detection.service';
import { WebhookService } from './webhook.service';

import {
  InvoiceCreateDto,
  InvoiceQueryDto,
  InvoiceStatusDto,
  VoidInvoiceDto,
  InsuranceCoverageDto,
  PaymentProcessDto,
  PaymentQueryDto,
  PaymentStatsQueryDto,
  RefundProcessDto,
  RefundQueryDto,
  RefundApproveDto,
  WalletCreateDto,
  WalletTopUpDto,
  WalletTransferDto,
  WalletTransactionQueryDto,
  GiftCardPurchaseDto,
  GiftCardRedeemDto,
  InstallmentCreateDto,
  InstallmentQueryDto,
  CorporateCreateDto,
  CorporatePaymentDto,
  CorporateQueryDto,
  SubscriptionCreateDto,
  SubscriptionQueryDto,
  CouponCreateDto,
  CouponValidateDto,
  CouponApplyDto,
  CouponQueryDto,
  TaxConfigUpdateDto,
  TaxReportQueryDto,
  FraudAlertQueryDto,
  InvestigateFraudDto,
  ResolveFraudDto,
} from './dto/index';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentsService: PaymentsService,
    private readonly refundService: RefundService,
    private readonly walletService: WalletService,
    private readonly giftCardService: GiftCardService,
    private readonly installmentService: InstallmentService,
    private readonly corporateService: CorporateService,
    private readonly subscriptionService: SubscriptionService,
    private readonly couponService: CouponService,
    private readonly taxService: TaxService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly webhookService: WebhookService,
  ) {}

  // ════════════════════════════════════════════════════════════════
  // INVOICES
  // ════════════════════════════════════════════════════════════════

  @Post('invoices')
  @Roles('admin', 'receptionist', 'billing')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createInvoice(@Body() dto: InvoiceCreateDto) {
    return this.invoiceService.createInvoice(dto);
  }

  @Get('invoices')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'List invoices with filters' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved' })
  async listInvoices(
    @Query() query: InvoiceQueryDto,
    @CurrentUser() user: any,
  ) {
    const patientId = user.role === 'patient' ? user.sub : query.patientId;
    return this.invoiceService.getPatientInvoices(patientId, {
      status: query.status as any,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('invoices/overdue')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200, description: 'Overdue invoices retrieved' })
  async getOverdueInvoices(@Query() query: InvoiceQueryDto) {
    return this.invoiceService.getOverdueInvoices({
      branchId: query.branchId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('invoices/:id')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@Param('id') id: string) {
    return this.invoiceService.getInvoice(id);
  }

  @Patch('invoices/:id/status')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body() dto: InvoiceStatusDto,
  ) {
    return this.invoiceService.updateInvoiceStatus(id, dto.status as any);
  }

  @Get('invoices/:id/pdf')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'PDF returned' })
  async getInvoicePDF(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.invoiceService.generatePDF(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.html"`);
    return res.send(result.html);
  }

  @Get('invoices/:id/receipt')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'Download payment receipt' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Receipt returned' })
  async getInvoiceReceipt(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const result = await this.invoiceService.generateReceipt(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${id}.html"`);
    return res.send(result.html);
  }

  @Post('invoices/:id/void')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice voided' })
  @ApiResponse({ status: 400, description: 'Cannot void invoice' })
  async voidInvoice(
    @Param('id') id: string,
    @Body() dto: VoidInvoiceDto,
  ) {
    return this.invoiceService.voidInvoice(id, dto.reason);
  }

  @Post('invoices/:id/insurance')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate insurance coverage for invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Insurance coverage calculated' })
  async calculateInsuranceCoverage(
    @Param('id') id: string,
    @Body() dto: InsuranceCoverageDto,
  ) {
    return this.invoiceService.calculateInsurance(id, dto.policyId);
  }

  // ════════════════════════════════════════════════════════════════
  // PAYMENTS
  // ════════════════════════════════════════════════════════════════

  @Post('process')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a payment' })
  @ApiResponse({ status: 201, description: 'Payment processed' })
  @ApiResponse({ status: 400, description: 'Payment failed' })
  async processPayment(@Body() dto: PaymentProcessDto) {
    return this.paymentsService.processPayment(dto);
  }

  @Get()
  @Roles('admin', 'receptionist', 'billing')
  @ApiOperation({ summary: 'List all payments with filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  async listPayments(
    @Query() query: PaymentQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPatientPayments(query.patientId, {
      status: query.status as any,
      method: query.method as any,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('stats')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment stats returned' })
  async getPaymentStats(@Query() query: PaymentStatsQueryDto) {
    return this.paymentsService.getPaymentStats(
      query.branchId,
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('history')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'Get payment history with advanced filters' })
  @ApiResponse({ status: 200, description: 'Payment history returned' })
  async getPaymentHistory(@Query() query: PaymentQueryDto) {
    return this.paymentsService.getPaymentHistory({
      patientId: query.patientId,
      status: query.status as any,
      method: query.method as any,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      branchId: query.branchId,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  // ════════════════════════════════════════════════════════════════
  // REFUNDS
  // ════════════════════════════════════════════════════════════════

  @Post('refunds')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a refund' })
  @ApiResponse({ status: 201, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Refund failed' })
  async processRefund(@Body() dto: RefundProcessDto) {
    return this.refundService.processRefund(dto);
  }

  @Get('refunds')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'List refunds' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved' })
  async listRefunds(@Query() query: RefundQueryDto) {
    return this.refundService.getRefundsByPayment(query.paymentId);
  }

  @Get('refunds/stats')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get refund statistics' })
  @ApiResponse({ status: 200, description: 'Refund stats returned' })
  async getRefundStats(@Query() query: RefundQueryDto) {
    return this.refundService.getRefundStats({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      branchId: query.branchId,
      status: query.status,
    });
  }

  @Get('refunds/:id')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get refund by ID' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund retrieved' })
  async getRefund(@Param('id') id: string) {
    return this.refundService.getRefund(id);
  }

  @Patch('refunds/:id/approve')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a refund' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund approved' })
  async approveRefund(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.refundService.approveRefund(id, user.sub);
  }

  @Patch('refunds/:id/reject')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a refund' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund rejected' })
  async rejectRefund(
    @Param('id') id: string,
    @Body() dto: RefundApproveDto,
  ) {
    return this.refundService.rejectRefund(id, dto.reason || 'Rejected by admin');
  }

  // ════════════════════════════════════════════════════════════════
  // WEBHOOKS
  // ════════════════════════════════════════════════════════════════

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleStripeWebhook(@Req() req: Request) {
    const signature = req.headers['stripe-signature'] as string;
    return this.webhookService.processWebhook('stripe', req.body as any, signature);
  }

  @Post('webhooks/tap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tap Payments webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleTapWebhook(@Req() req: Request) {
    return this.webhookService.processWebhook('tap', req.body as any, '');
  }

  @Post('webhooks/hyperpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'HyperPay webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleHyperPayWebhook(@Req() req: Request) {
    return this.webhookService.processWebhook('hyperpay', req.body as any, '');
  }

  @Post('webhooks/paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayPal webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handlePayPalWebhook(@Req() req: Request) {
    return this.webhookService.processWebhook('paypal', req.body as any, '');
  }

  // ════════════════════════════════════════════════════════════════
  // WALLET
  // ════════════════════════════════════════════════════════════════

  @Post('wallet')
  @Roles('admin', 'receptionist', 'patient')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a patient wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created' })
  async createWallet(
    @Body() dto: WalletCreateDto,
  ) {
    return this.walletService.createWallet(dto.patientId);
  }

  @Get('wallet')
  @Roles('admin', 'receptionist', 'patient')
  @ApiOperation({ summary: 'Get wallet details' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved' })
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.sub);
  }

  @Post('wallet/topup')
  @Roles('admin', 'receptionist', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Top up wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet topped up' })
  async topUpWallet(@Body() dto: WalletTopUpDto) {
    return this.walletService.topUp(dto);
  }

  @Get('wallet/transactions')
  @Roles('admin', 'receptionist', 'patient')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  async getWalletTransactions(
    @Query() query: WalletTransactionQueryDto,
    @CurrentUser() user: any,
  ) {
    const wallet = await this.walletService.getWallet(user.sub);
    return this.walletService.getTransactions(wallet.id, {
      type: query.type,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Post('wallet/transfer')
  @Roles('admin', 'receptionist', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer between wallets' })
  @ApiResponse({ status: 200, description: 'Transfer completed' })
  async transferWallet(@Body() dto: WalletTransferDto) {
    return this.walletService.transfer(dto.fromWalletId, dto.toWalletId, dto.amount);
  }

  // ════════════════════════════════════════════════════════════════
  // GIFT CARDS
  // ════════════════════════════════════════════════════════════════

  @Post('gift-cards')
  @Roles('admin', 'receptionist')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Purchase a gift card' })
  @ApiResponse({ status: 201, description: 'Gift card created' })
  async purchaseGiftCard(@Body() dto: GiftCardPurchaseDto) {
    return this.giftCardService.purchaseGiftCard(dto);
  }

  @Get('gift-cards/:number')
  @Roles('admin', 'receptionist')
  @ApiOperation({ summary: 'Get gift card details' })
  @ApiParam({ name: 'number', description: 'Gift card number' })
  @ApiResponse({ status: 200, description: 'Gift card retrieved' })
  async getGiftCard(@Param('number') number: string) {
    return this.giftCardService.getGiftCard(number);
  }

  @Get('gift-cards/:number/balance')
  @Roles('admin', 'receptionist', 'patient')
  @ApiOperation({ summary: 'Check gift card balance' })
  @ApiParam({ name: 'number', description: 'Gift card number' })
  @ApiResponse({ status: 200, description: 'Balance returned' })
  async getGiftCardBalance(@Param('number') number: string) {
    const balance = await this.giftCardService.getGiftCardBalance(number);
    return { balance };
  }

  @Post('gift-cards/redeem')
  @Roles('admin', 'receptionist', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem gift card' })
  @ApiResponse({ status: 200, description: 'Gift card redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid or depleted card' })
  async redeemGiftCard(
    @Body() dto: GiftCardRedeemDto,
  ) {
    return this.giftCardService.redeemGiftCard(dto.cardCode, dto.amount, dto.patientId);
  }

  @Patch('gift-cards/:number/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate gift card' })
  @ApiParam({ name: 'number', description: 'Gift card number' })
  @ApiResponse({ status: 200, description: 'Card deactivated' })
  async deactivateGiftCard(@Param('number') number: string) {
    return this.giftCardService.deactivateGiftCard(number);
  }

  // ════════════════════════════════════════════════════════════════
  // INSTALLMENTS
  // ════════════════════════════════════════════════════════════════

  @Post('installments')
  @Roles('admin', 'receptionist', 'billing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an installment plan' })
  @ApiResponse({ status: 201, description: 'Installment plan created' })
  async createInstallmentPlan(@Body() dto: InstallmentCreateDto) {
    return this.installmentService.createPlan(dto);
  }

  @Get('installments')
  @Roles('admin', 'billing', 'patient')
  @ApiOperation({ summary: 'List patient installment plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved' })
  async listInstallmentPlans(
    @Query() query: InstallmentQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.installmentService.getPatientPlans(user.sub);
  }

  @Get('installments/:id')
  @Roles('admin', 'billing', 'patient')
  @ApiOperation({ summary: 'Get installment plan details' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan retrieved' })
  async getInstallmentPlan(@Param('id') id: string) {
    return this.installmentService.getPlan(id);
  }

  @Post('installments/:id/pay')
  @Roles('admin', 'billing', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process installment payment' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processInstallmentPayment(
    @Param('id') id: string,
    @Body() body: { installmentNumber: number },
  ) {
    return this.installmentService.processInstallmentPayment(id, body.installmentNumber);
  }

  @Patch('installments/:id/cancel')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel installment plan' })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 200, description: 'Plan cancelled' })
  async cancelInstallmentPlan(@Param('id') id: string) {
    return this.installmentService.cancelPlan(id);
  }

  // ════════════════════════════════════════════════════════════════
  // CORPORATE
  // ════════════════════════════════════════════════════════════════

  @Post('corporate/accounts')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create corporate account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async createCorporateAccount(@Body() dto: CorporateCreateDto) {
    return this.corporateService.createAccount(dto);
  }

  @Get('corporate/accounts')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'List corporate accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved' })
  async listCorporateAccounts(@Query() query: CorporateQueryDto) {
    return this.corporateService.getCorporateReport({
      status: query.status,
      search: query.search,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('corporate/accounts/:id')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get corporate account details' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved' })
  async getCorporateAccount(@Param('id') id: string) {
    return this.corporateService.getAccount(id);
  }

  @Get('corporate/accounts/:id/invoices')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get corporate account invoices' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved' })
  async getCorporateAccountInvoices(
    @Param('id') id: string,
    @Query() query: InvoiceQueryDto,
  ) {
    return this.corporateService.getAccountInvoices(id, {
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Post('corporate/accounts/:id/pay')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process corporate account payment' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async processCorporatePayment(
    @Param('id') id: string,
    @Body() dto: CorporatePaymentDto,
  ) {
    return this.corporateService.processPayment(id, dto.amount);
  }

  @Post('corporate/accounts/:id/close-cycle')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close corporate billing cycle' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Cycle closed' })
  async closeCorporateCycle(@Param('id') id: string) {
    return this.corporateService.closeBillingCycle(id);
  }

  @Post('corporate/accounts/:id/suspend')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend corporate account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account suspended' })
  async suspendCorporateAccount(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.corporateService.suspendAccount(id, body.reason);
  }

  @Get('corporate/accounts/:id/aging')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get corporate aging report' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Aging report returned' })
  async getCorporateAging(@Param('id') id: string) {
    return this.corporateService.getAccountAging(id);
  }

  // ════════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ════════════════════════════════════════════════════════════════

  @Post('subscriptions')
  @Roles('admin', 'receptionist', 'billing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async createSubscription(@Body() dto: SubscriptionCreateDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  @Get('subscriptions')
  @Roles('admin', 'billing', 'patient')
  @ApiOperation({ summary: 'List subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved' })
  async listSubscriptions(
    @CurrentUser() user: any,
  ) {
    return this.subscriptionService.getPatientSubscriptions(user.sub);
  }

  @Get('subscriptions/:id')
  @Roles('admin', 'billing', 'patient')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved' })
  async getSubscription(@Param('id') id: string) {
    return this.subscriptionService.getSubscription(id);
  }

  @Patch('subscriptions/:id/pause')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription paused' })
  async pauseSubscription(@Param('id') id: string) {
    return this.subscriptionService.pauseSubscription(id);
  }

  @Patch('subscriptions/:id/resume')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription resumed' })
  async resumeSubscription(@Param('id') id: string) {
    return this.subscriptionService.resumeSubscription(id);
  }

  @Patch('subscriptions/:id/cancel')
  @Roles('admin', 'billing', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(@Param('id') id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }

  // ════════════════════════════════════════════════════════════════
  // COUPONS
  // ════════════════════════════════════════════════════════════════

  @Post('coupons')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created' })
  async createCoupon(@Body() dto: CouponCreateDto) {
    return this.couponService.createCoupon(dto);
  }

  @Post('coupons/validate')
  @Roles('admin', 'receptionist', 'billing', 'patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({ status: 200, description: 'Coupon valid' })
  @ApiResponse({ status: 400, description: 'Coupon invalid' })
  async validateCoupon(@Body() dto: CouponValidateDto) {
    return this.couponService.validateCoupon(dto.code, dto.invoiceId);
  }

  @Post('coupons/apply')
  @Roles('admin', 'receptionist', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply coupon to invoice' })
  @ApiResponse({ status: 200, description: 'Coupon applied' })
  @ApiResponse({ status: 400, description: 'Cannot apply coupon' })
  async applyCoupon(@Body() dto: CouponApplyDto) {
    return this.couponService.applyCoupon(dto.invoiceId, dto.code);
  }

  @Patch('coupons/:id/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 200, description: 'Coupon deactivated' })
  async deactivateCoupon(@Param('id') id: string) {
    return this.couponService.deactivateCoupon(id);
  }

  // ════════════════════════════════════════════════════════════════
  // TAX
  // ════════════════════════════════════════════════════════════════

  @Get('tax/config')
  @Roles('admin')
  @ApiOperation({ summary: 'Get tax configuration' })
  @ApiResponse({ status: 200, description: 'Tax config returned' })
  async getTaxConfig() {
    return this.taxService.getTaxConfig();
  }

  @Patch('tax/config/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tax configuration' })
  @ApiParam({ name: 'id', description: 'Tax config ID' })
  @ApiResponse({ status: 200, description: 'Tax config updated' })
  async updateTaxConfig(
    @Param('id') id: string,
    @Body() dto: TaxConfigUpdateDto,
  ) {
    return this.taxService.updateTaxConfig(id, dto);
  }

  @Get('tax/report')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get tax report' })
  @ApiResponse({ status: 200, description: 'Tax report returned' })
  async getTaxReport(@Query() query: TaxReportQueryDto) {
    return this.taxService.getTaxReport({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      branchId: query.branchId,
      taxType: query.taxType,
      page: query.page,
      limit: query.limit,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // FRAUD
  // ════════════════════════════════════════════════════════════════

  @Get('fraud/alerts')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'List fraud alerts' })
  @ApiResponse({ status: 200, description: 'Fraud alerts retrieved' })
  async listFraudAlerts(@Query() query: FraudAlertQueryDto) {
    return this.fraudDetectionService.getFraudAlerts({
      riskLevel: query.riskLevel,
      status: query.status,
      patientId: query.patientId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
    });
  }

  @Patch('fraud/alerts/:id/investigate')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark fraud alert as investigating' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert updated' })
  async investigateFraudAlert(
    @Param('id') id: string,
    @Body() dto: InvestigateFraudDto,
    @CurrentUser() user: any,
  ) {
    return this.fraudDetectionService.investigateAlert(id, user.sub, dto.notes);
  }

  @Patch('fraud/alerts/:id/resolve')
  @Roles('admin', 'billing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve fraud alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveFraudAlert(
    @Param('id') id: string,
    @Body() dto: ResolveFraudDto,
  ) {
    return this.fraudDetectionService.resolveAlert(id, dto.resolution);
  }

  @Get('fraud/stats')
  @Roles('admin', 'billing')
  @ApiOperation({ summary: 'Get fraud statistics' })
  @ApiResponse({ status: 200, description: 'Fraud stats returned' })
  async getFraudStats() {
    return this.fraudDetectionService.getFraudStats();
  }
}
