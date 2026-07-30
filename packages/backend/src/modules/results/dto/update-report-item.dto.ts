import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
} from 'class-validator';

export class UpdateReportItemDto {
  @ApiPropertyOptional({ description: 'Test result value' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  value?: string;

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

  @ApiPropertyOptional({ description: 'Is result abnormal' })
  @IsOptional()
  @IsBoolean()
  isAbnormal?: boolean;

  @ApiPropertyOptional({ description: 'Abnormality type' })
  @IsOptional()
  @IsString()
  abnormalityType?: string;

  @ApiPropertyOptional({ description: 'Result flags', example: ['HIGH'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiPropertyOptional({ description: 'Notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
