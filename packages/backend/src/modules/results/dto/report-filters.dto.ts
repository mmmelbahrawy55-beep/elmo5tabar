import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ReportStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
  AMENDED = 'AMENDED',
}

export class ReportFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReportStatus, description: 'Filter by report status' })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filter by patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter critical results only' })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;
}
