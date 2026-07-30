import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum AlertSeverity {
  HIGH = 'HIGH',
  LOW = 'LOW',
  CRITICAL_HIGH = 'CRITICAL_HIGH',
  CRITICAL_LOW = 'CRITICAL_LOW',
}

export class CriticalAlertDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  @IsNotEmpty()
  reportId: string;

  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Test name that triggered the alert' })
  @IsString()
  @IsNotEmpty()
  testName: string;

  @ApiProperty({ description: 'Test result value' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Reference range string' })
  @IsString()
  @IsNotEmpty()
  referenceRange: string;

  @ApiProperty({ enum: AlertSeverity, description: 'Alert severity level' })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

export class CreateDoctorNoteDto {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  @IsNotEmpty()
  reportId: string;

  @ApiProperty({ description: 'Note content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Whether the note is private (visible only to doctors)', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class ShareLinkDto {
  @ApiProperty({ description: 'Array of report IDs to share', minItems: 1 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  reportIds: string[];

  @ApiProperty({ description: 'Link expiry in hours', minimum: 1, maximum: 720 })
  @IsInt()
  @Min(1)
  @Max(720)
  expiresInHours: number;

  @ApiPropertyOptional({ description: 'Optional password to protect the shared link' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ description: 'Maximum number of accesses allowed', minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxAccess?: number;
}

export enum ComparisonInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class ComparisonQueryDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Array of test IDs to compare', minItems: 1 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  testIds: string[];

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ComparisonInterval, description: 'Data aggregation interval' })
  @IsOptional()
  @IsEnum(ComparisonInterval)
  interval?: ComparisonInterval;
}

export enum AiExplanationLanguage {
  AR = 'ar',
  EN = 'en',
}

export class AiExplanationQueryDto {
  @ApiProperty({ description: 'Report ID for AI explanation' })
  @IsString()
  @IsNotEmpty()
  reportId: string;

  @ApiPropertyOptional({ enum: AiExplanationLanguage, default: AiExplanationLanguage.EN, description: 'Language for the explanation' })
  @IsOptional()
  @IsEnum(AiExplanationLanguage)
  language?: AiExplanationLanguage;

  @ApiPropertyOptional({ description: 'Include source references in explanation', default: false })
  @IsOptional()
  @IsBoolean()
  includeSources?: boolean;
}

export class TimelineQueryDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Test category ID to filter timeline' })
  @IsOptional()
  @IsString()
  testCategoryId?: string;
}

export class AttachmentUploadDto {
  @ApiProperty({ description: 'Report ID to attach file to' })
  @IsString()
  @IsNotEmpty()
  reportId: string;

  @ApiProperty({ description: 'File type (e.g., pdf, image, doc)', example: 'pdf' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9-]+$/, { message: 'fileType must be alphanumeric' })
  fileType: string;

  @ApiPropertyOptional({ description: 'Attachment description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export enum BulkAction {
  APPROVE = 'approve',
  RELEASE = 'release',
  ARCHIVE = 'archive',
  DELETE = 'delete',
}

export class BulkActionDto {
  @ApiProperty({ description: 'Array of report IDs', minItems: 1 })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  reportIds: string[];

  @ApiProperty({ enum: BulkAction, description: 'Action to perform on the reports' })
  @IsEnum(BulkAction)
  action: BulkAction;
}

export class EncryptionKeyDto {
  @ApiProperty({ description: 'Purpose of the encryption key', example: 'patient-data' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  purpose: string;

  @ApiPropertyOptional({ description: 'Specific key ID to use' })
  @IsOptional()
  @IsString()
  keyId?: string;
}

export class VerificationQueryDto {
  @ApiProperty({ description: 'Verification token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ description: 'Report ID for additional verification' })
  @IsOptional()
  @IsString()
  reportId?: string;
}

export class ResultAuditQueryDto {
  @ApiPropertyOptional({ description: 'Filter by report ID' })
  @IsOptional()
  @IsString()
  reportId?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Filter by action type' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdvancedReportFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by report status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter critical reports only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isCritical?: boolean;

  @ApiPropertyOptional({ description: 'Filter by reviewer ID' })
  @IsOptional()
  @IsString()
  reviewedById?: string;

  @ApiPropertyOptional({ description: 'Filter by approver ID' })
  @IsOptional()
  @IsString()
  approvedById?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by test category ID' })
  @IsOptional()
  @IsString()
  testCategoryId?: string;

  @ApiPropertyOptional({ description: 'Reports with AI insight only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasAiInsight?: boolean;

  @ApiPropertyOptional({ description: 'Filter reports with abnormal results' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isAbnormal?: boolean;

  @ApiPropertyOptional({ description: 'Minimum version number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minVersion?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
