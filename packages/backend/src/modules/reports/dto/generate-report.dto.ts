import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum ReportType {
  DAILY_REVENUE = 'dailyRevenue',
  MONTHLY_REVENUE = 'monthlyRevenue',
  PATIENT_SUMMARY = 'patientSummary',
  ORDER_SUMMARY = 'orderSummary',
  DOCTOR_PERFORMANCE = 'doctorPerformance',
  BRANCH_PERFORMANCE = 'branchPerformance',
  INVENTORY_REPORT = 'inventoryReport',
  INSURANCE_REPORT = 'insuranceReport',
  TAX_REPORT = 'taxReport',
}

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Report type to generate' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ example: '2024-01-01', description: 'Start date (ISO 8601)' })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date (ISO 8601)' })
  @IsDateString()
  dateTo: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    enum: ReportFormat,
    default: ReportFormat.JSON,
    description: 'Output format',
  })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}

export class SaveReportDto {
  @ApiProperty({ description: 'Report name for later reference' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Report parameters JSON' })
  @IsString()
  @IsOptional()
  params?: string;

  @ApiPropertyOptional({ description: 'Description of the saved report' })
  @IsString()
  @IsOptional()
  description?: string;
}
