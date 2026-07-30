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
  Max,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Invoice DTOs ───────────────────────────────────────────────

export class InvoiceCreateItemDto {
  @IsOptional()
  @IsUUID()
  labTestId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  testName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  testNameAr: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCovered?: number;
}

export class InvoiceCreateDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty()
  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiProperty({ type: [InvoiceCreateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceCreateItemDto)
  @ArrayMinSize(1)
  items: InvoiceCreateItemDto[];

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

export class InvoiceQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;

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

export class InvoiceStatusDto {
  @ApiProperty()
  @IsString()
  status: string;
}

export class VoidInvoiceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class InsuranceCoverageDto {
  @ApiProperty()
  @IsUUID()
  policyId: string;

  @IsOptional()
  @IsNumber()
  coveragePercentage?: number;
}

// ─── Payment DTOs ───────────────────────────────────────────────

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

export class PaymentProcessDto {
  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty()
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

export class PaymentQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  method?: string;

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

export class PaymentStatsQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

// ─── Refund DTOs ────────────────────────────────────────────────

export class RefundProcessDto {
  @ApiProperty()
  @IsUUID()
  paymentId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
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

export class RefundQueryDto {
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

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
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class RefundApproveDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ─── Wallet DTOs ────────────────────────────────────────────────

export class WalletCreateDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;
}

export class WalletTopUpDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;
}

export class WalletTransferDto {
  @ApiProperty()
  @IsUUID()
  fromWalletId: string;

  @ApiProperty()
  @IsUUID()
  toWalletId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class WalletTransactionQueryDto {
  @IsOptional()
  @IsUUID()
  walletId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Gift Card DTOs ─────────────────────────────────────────────

export class GiftCardPurchaseDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  purchaserName?: string;

  @IsOptional()
  @IsEmail()
  purchaserEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class GiftCardRedeemDto {
  @ApiProperty()
  @IsString()
  cardCode: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsUUID()
  patientId: string;
}

// ─── Installment DTOs ───────────────────────────────────────────

export class InstallmentCreateDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  @Min(2)
  @Max(24)
  numberOfInstallments: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsOptional()
  @IsString()
  firstPaymentDate?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class InstallmentQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Corporate DTOs ─────────────────────────────────────────────

export class CorporateCreateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyNameAr?: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  creditLimit: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  paymentTerms: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CorporatePaymentDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CorporateQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Subscription DTOs ──────────────────────────────────────────

export class SubscriptionCreateDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  packageId: string;

  @ApiProperty({ enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @IsEnum(['MONTHLY', 'QUARTERLY', 'YEARLY'] as const)
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class SubscriptionQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Coupon DTOs ────────────────────────────────────────────────

export class CouponCreateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED'] })
  @IsEnum(['PERCENTAGE', 'FIXED'] as const)
  discountType: 'PERCENTAGE' | 'FIXED';

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerPatient?: number;

  @IsOptional()
  @IsArray()
  applicableTests?: string[];

  @IsOptional()
  @IsArray()
  applicablePackages?: string[];

  @IsOptional()
  @IsArray()
  excludeItems?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class CouponValidateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}

export class CouponApplyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty()
  @IsUUID()
  invoiceId: string;
}

export class CouponQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Tax DTOs ───────────────────────────────────────────────────

export class TaxConfigUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TaxReportQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  taxType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Report DTOs ────────────────────────────────────────────────

export class RevenueReportQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  includeRefunds?: boolean;
}

export class AgingReportQueryDto {
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ─── Fraud DTOs ─────────────────────────────────────────────────

export class FraudAlertQueryDto {
  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class InvestigateFraudDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ResolveFraudDto {
  @ApiProperty({ enum: ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'UNDER_REVIEW'] })
  @IsEnum(['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'UNDER_REVIEW'] as const)
  resolution: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'UNDER_REVIEW';
}

// ─── Webhook DTO ────────────────────────────────────────────────

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

// ─── Enums re-export ───────────────────────────────────────────

export { PaymentMethod as PaymentMethodEnum };
