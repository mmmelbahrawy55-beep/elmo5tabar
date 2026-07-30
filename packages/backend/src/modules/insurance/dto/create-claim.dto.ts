import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateInsuranceClaimDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Insurance Policy ID' })
  @IsString()
  policyId: string;

  @ApiProperty({ description: 'Insurance Company ID' })
  @IsString()
  insuranceCompanyId: string;

  @ApiPropertyOptional({ description: 'Order ID' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsString()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ example: 1500, description: 'Submitted amount' })
  @IsNumber()
  @Min(0)
  submittedAmount: number;

  @ApiPropertyOptional({ example: 'Z87.3', description: 'ICD-10 diagnosis code' })
  @IsString()
  @IsOptional()
  diagnosisCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
