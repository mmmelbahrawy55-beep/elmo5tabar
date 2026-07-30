import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('invoices')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create invoice from order' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Invoice already exists' })
  async createInvoice(@Body() body: { orderId: string }) {
    return this.paymentsService.createInvoice(body.orderId);
  }

  @Get('invoices')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({ summary: 'List invoices with filters' })
  @ApiResponse({ status: 200, description: 'Paginated invoices list' })
  async listInvoices(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.listInvoices(pagination, {
      status,
      branchId,
      dateFrom,
      dateTo,
    });
  }

  @Get('invoices/outstanding')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get outstanding invoices with balance > 0' })
  @ApiResponse({ status: 200, description: 'Outstanding invoices' })
  async getOutstandingInvoices(@Query() pagination: PaginationDto) {
    return this.paymentsService.getOutstandingInvoices(pagination);
  }

  @Get('invoices/order/:orderId')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'DOCTOR')
  @ApiOperation({ summary: 'Get invoice for a specific order' })
  @ApiParam({ name: 'orderId' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getInvoiceByOrder(orderId);
  }

  @Get('invoices/:id')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@Param('id') id: string) {
    return this.paymentsService.getInvoice(id);
  }

  @Post('process')
  @Roles('ADMIN', 'RECEPTIONIST', 'CASHIER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment' })
  async processPayment(@Body() dto: ProcessPaymentDto, @Req() req: any) {
    return this.paymentsService.processPayment(dto.invoiceId, dto, req.user?.sub);
  }

  @Get('invoice/:invoiceId/list')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({ summary: 'List payments for an invoice' })
  @ApiParam({ name: 'invoiceId' })
  @ApiResponse({ status: 200, description: 'Payments list' })
  async listPayments(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.listPayments(invoiceId);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Post('refunds')
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a refund' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund' })
  async createRefund(@Body() dto: CreateRefundDto, @Req() req: any) {
    return this.paymentsService.createRefund(dto, req.user?.sub);
  }

  @Get('refunds/:id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get refund by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Refund details' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async getRefund(@Param('id') id: string) {
    return this.paymentsService.getRefund(id);
  }

  @Get('stats/overview')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Payment statistics' })
  async getStats(
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.paymentsService.getPaymentStats(branchId, dateFrom, dateTo);
  }

  @Get('reports/revenue')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get revenue report grouped by time period or branch' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month', 'branch'] })
  @ApiResponse({ status: 200, description: 'Revenue report' })
  async getRevenueReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month' | 'branch',
  ) {
    return this.paymentsService.getRevenueReport(dateFrom, dateTo, groupBy);
  }

  @Get('receipt/:paymentId')
  @Roles('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT')
  @ApiOperation({ summary: 'Generate receipt for a payment' })
  @ApiParam({ name: 'paymentId' })
  @ApiResponse({ status: 200, description: 'Receipt data' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async generateReceipt(@Param('paymentId') paymentId: string) {
    return this.paymentsService.generateReceipt(paymentId);
  }
}
