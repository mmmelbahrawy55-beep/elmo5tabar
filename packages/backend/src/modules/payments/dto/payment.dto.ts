import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  IsPositive,
  IsBoolean,
  MaxLength,
  Matches,
  IsObject,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'CASH',
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  PAYPAL = 'PAYPAL',
  WALLET = 'WALLET',
  INSTALLMENT = 'INSTALLMENT',
  GIFT_CARD = 'GIFT_CARD',
  CORPORATE_BILLING = 'CORPORATE_BILLING',
  INSURANCE = 'INSURANCE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  STC_PAY = 'STC_PAY',
  TAMARA = 'TAMARA',
  TABBY = 'TABBY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class InvoiceItemInput {
  @IsOptional()
  @IsUUID()
  labTestId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsString()
  @MaxLength(255)
  testName: string;

  @IsString()
  @MaxLength(255)
  testNameAr: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCovered?: number;
}

export class ProcessPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  cardToken?: string;

  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;

  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  giftCardCode?: string;

  @IsOptional()
  @IsString()
  installmentPlanId?: string;

  @IsOptional()
  @IsUUID()
  corporateAccountId?: string;

  @IsOptional()
  @IsUUID()
  insurancePolicyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  patientName?: string;

  @IsOptional()
  @IsString()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CreateInvoiceDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInput)
  @ArrayMinSize(1)
  items: InvoiceItemInput[];

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsUUID()
  insurancePolicyId?: string;

  @IsOptional()
  @IsUUID()
  corporateAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class ProcessRefundDto {
  @IsUUID()
  paymentId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonAr?: string;

  @IsOptional()
  @IsUUID()
  approverId?: string;
}

export class InvoiceQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class PaymentQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class RefundQueryDto {
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class WebhookDto {
  @IsString()
  provider: string;

  @IsString()
  eventType: string;

  @IsObject()
  payload: Record<string, unknown>;

  @IsString()
  signature: string;

  @IsString()
  eventId: string;
}

export class ApplyCouponDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsUUID()
  invoiceId: string;
}

export class ApplyDiscountDto {
  @IsUUID()
  invoiceId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @IsPositive()
  discountValue: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
