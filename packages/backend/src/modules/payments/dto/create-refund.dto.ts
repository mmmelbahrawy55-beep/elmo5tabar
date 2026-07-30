import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Refund amount in SAR' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Reason for refund', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Original payment ID to refund' })
  @IsOptional()
  @IsString()
  paymentId?: string;
}
