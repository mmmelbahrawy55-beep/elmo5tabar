import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportItemDto {
  @ApiProperty({ description: 'Lab test ID' })
  @IsString()
  @IsNotEmpty()
  labTestId: string;

  @ApiProperty({ description: 'Test result value' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Reference range low' })
  @IsOptional()
  @IsNumber()
  referenceRangeLow?: number;

  @ApiPropertyOptional({ description: 'Reference range high' })
  @IsOptional()
  @IsNumber()
  referenceRangeHigh?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAbnormal?: boolean;

  @ApiPropertyOptional({ description: 'Result flags', example: ['HIGH', 'CRITICAL'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiPropertyOptional({ description: 'Notes for this item', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CreateReportDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'Report summary' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  summary?: string;

  @ApiPropertyOptional({ description: 'Report conclusions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  conclusions?: string;

  @ApiPropertyOptional({ description: 'Recommendations' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  recommendations?: string;

  @ApiProperty({ type: [CreateReportItemDto], description: 'Report items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportItemDto)
  items: CreateReportItemDto[];
}
