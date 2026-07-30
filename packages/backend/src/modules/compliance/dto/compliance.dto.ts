import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DataExportDto {
  @ApiProperty() @IsString() userId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() format?: 'json' | 'csv';
}

export class DataDeletionDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty({ example: 'DELETE MY DATA' }) @IsString() confirmation: string;
}

export class ConsentDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty({ enum: ['terms', 'privacy', 'marketing', 'data_sharing', 'hipaa'] }) @IsString() consentType: string;
  @ApiProperty() @IsString() version: string;
  @ApiProperty() @IsBoolean() granted: boolean;
}

export class AuditQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resourceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resourceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() phiOnly?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() limit?: number;
}
