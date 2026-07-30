import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsBoolean, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SecurityAlertQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['info', 'warning', 'critical']) severity?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() unreadOnly?: boolean;
}

export class DismissAlertDto {
  @ApiProperty() @IsString() alertId: string;
}

export class SecurityReportDto {
  @ApiProperty() @IsDateString() dateFrom: string;
  @ApiProperty() @IsDateString() dateTo: string;
}

export class IncidentCreateDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsEnum(['low', 'medium', 'high', 'critical']) severity: 'low' | 'medium' | 'high' | 'critical';
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceIp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) affectedResources?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) indicators?: string[];
  @ApiProperty() @IsEnum(['automated', 'manual', 'external']) detectedBy: 'automated' | 'manual' | 'external';
  @ApiPropertyOptional() @IsOptional() @IsObject() evidence?: Record<string, any>;
}

export class IncidentUpdateDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['detected', 'triaging', 'containing', 'remediating', 'resolved', 'closed', 'false_positive']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['low', 'medium', 'high', 'critical']) severity?: 'low' | 'medium' | 'high' | 'critical';
  @ApiPropertyOptional() @IsOptional() @IsString() assignee?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() containmentStrategy?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) remediationActions?: string[];
}

export class BackupRequestDto {
  @ApiProperty() @IsEnum(['full', 'incremental', 'differential', 'pitr']) type: 'full' | 'incremental' | 'differential' | 'pitr';
}

export class DRExecuteDto {
  @ApiProperty() @IsString() planId: string;
}

export class KeyRotationRequestDto {
  @ApiProperty() @IsString() keyId: string;
}

export class SIEMEventQueryDto {
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @IsInt() @Min(1) @Max(200) limit?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) offset?: number;
}

export class ComplianceFrameworkQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() framework?: string;
}

export class WAFEvaluateDto {
  @ApiProperty() @IsString() method: string;
  @ApiProperty() @IsString() uri: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() headers?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiProperty() @IsString() ip: string;
}

export class SecurityDashboardQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() period?: string;
}
