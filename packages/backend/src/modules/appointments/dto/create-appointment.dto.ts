import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';

export enum AppointmentType {
  LAB_TEST = 'LAB_TEST',
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  VACCINATION = 'VACCINATION',
  HOME_VISIT = 'HOME_VISIT',
}

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ description: 'Doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiProperty({ description: 'Scheduled appointment time (ISO 8601)', example: '2026-07-28T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 15, minimum: 5, maximum: 480 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.LAB_TEST })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Additional notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
