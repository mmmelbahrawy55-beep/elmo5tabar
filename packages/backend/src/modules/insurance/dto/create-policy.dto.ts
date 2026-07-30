import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';

export class CreateInsurancePolicyDto {
  @ApiProperty({ description: 'Insurance Company ID' })
  @IsString()
  insuranceCompanyId: string;

  @ApiProperty({ example: 'POL-2024-001' })
  @IsString()
  policyNumber: string;

  @ApiPropertyOptional({ example: 'CARD-123456' })
  @IsString()
  @IsOptional()
  cardNumber?: string;

  @ApiPropertyOptional({ example: 'GRP-001' })
  @IsString()
  @IsOptional()
  groupNumber?: string;

  @ApiPropertyOptional({ example: 'Gold Plan' })
  @IsString()
  @IsOptional()
  planType?: string;

  @ApiProperty({ example: 80, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  coveragePercentage: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxCoverage?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  deductible?: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
