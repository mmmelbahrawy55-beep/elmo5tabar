import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  Min,
  Max,
  IsPositive,
  IsEmail,
  Matches,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class RevenueReportDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsEnum(['day', 'week', 'month'])
  groupBy: 'day' | 'week' | 'month';

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  includeRefunds?: boolean;
}

export class PaymentMethodReportDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  includeFailed?: boolean;
}

export class AgingReportDto {
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

export class RefundReportDto {
  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  approvedOnly?: boolean;
}

export class CorporateAccountDto {
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsString()
  @MaxLength(255)
  companyNameAr: string;

  @IsString()
  @Matches(/^\d{15}$/)
  taxNumber: string;

  @IsString()
  @Matches(/^\d{10}$/)
  crNumber: string;

  @IsNumber()
  @IsPositive()
  creditLimit: number;

  @IsNumber()
  @Min(0)
  paymentTermsDays: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WalletTopUpDto {
  @IsUUID()
  walletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(['CASH', 'VISA', 'MASTERCARD', 'BANK_TRANSFER'])
  method: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;
}

export class GiftCardPurchaseDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @IsString()
  @MaxLength(100)
  senderName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class InstallmentPlanDto {
  @IsUUID()
  invoiceId: string;

  @IsNumber()
  @Min(2)
  @Max(24)
  numberOfInstallments: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  processingFee?: number;
}

export class DashboardQueryDto {
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

export class ExportReportDto {
  @IsEnum(['revenue', 'payment-methods', 'aging', 'refunds', 'corporate'])
  reportType: string;

  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsEnum(['pdf', 'csv', 'xlsx'])
  format: string;
}
