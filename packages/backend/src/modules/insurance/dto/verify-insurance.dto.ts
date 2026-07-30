import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class VerifyInsuranceDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ description: 'Insurance Policy ID' })
  @IsString()
  @IsOptional()
  policyId?: string;

  @ApiPropertyOptional({ description: 'Insurance Company ID' })
  @IsString()
  @IsOptional()
  insuranceCompanyId?: string;

  @ApiProperty({ example: 'POL-2024-001', description: 'Insurance Number' })
  @IsString()
  insuranceNumber: string;

  @ApiProperty({ example: 500, description: 'Total amount to verify coverage for' })
  @IsNumber()
  @Min(0)
  amount: number;
}
