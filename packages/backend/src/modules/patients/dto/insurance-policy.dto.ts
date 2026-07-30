import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateInsurancePolicyDto {
  @ApiProperty({ description: 'Insurance company ID' })
  @IsString()
  @IsNotEmpty()
  insuranceCompanyId: string;

  @ApiProperty({ description: 'Policy number', example: 'POL-2024-00012345' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  policyNumber: string;

  @ApiPropertyOptional({ description: 'Card number', example: '1234567890123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardNumber?: string;

  @ApiPropertyOptional({ description: 'Plan type', example: 'Gold', enum: ['Basic', 'Silver', 'Gold', 'Platinum', 'VIP'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  planType?: string;

  @ApiProperty({ description: 'Coverage percentage', example: 80, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  coveragePercentage: number;

  @ApiPropertyOptional({ description: 'Maximum coverage amount', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCoverage?: number;

  @ApiPropertyOptional({ description: 'Deductible amount', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiProperty({ description: 'Policy start date', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Policy end date', example: '2024-12-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'Is this the primary policy', default: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
