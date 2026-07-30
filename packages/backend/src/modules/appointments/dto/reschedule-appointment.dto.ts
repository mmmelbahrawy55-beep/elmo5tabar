import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'New scheduled appointment time (ISO 8601)', example: '2026-07-29T14:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  newScheduledAt: string;

  @ApiPropertyOptional({ description: 'Reason for rescheduling', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
