import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';

export enum MedicalHistoryCategory {
  ALLERGY = 'allergy',
  CONDITION = 'condition',
  SURGERY = 'surgery',
  MEDICATION = 'medication',
  FAMILY = 'family',
}

export enum Severity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export class CreateMedicalHistoryDto {
  @ApiProperty({ enum: MedicalHistoryCategory, description: 'Medical history category' })
  @IsEnum(MedicalHistoryCategory)
  @IsNotEmpty()
  category: MedicalHistoryCategory;

  @ApiProperty({ description: 'Title of the medical record', example: 'Type 2 Diabetes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description', example: 'Diagnosed in 2020, managed with Metformin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: Severity, description: 'Severity level' })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ description: 'Onset date', example: '2020-03-15' })
  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @ApiPropertyOptional({ description: 'Resolved date', example: '2021-06-01' })
  @IsOptional()
  @IsDateString()
  resolvedDate?: string;

  @ApiPropertyOptional({ description: 'Is this a chronic condition', default: false })
  @IsOptional()
  @IsBoolean()
  isChronic?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
