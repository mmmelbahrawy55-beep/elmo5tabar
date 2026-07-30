import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export enum ServiceType {
  WALK_IN = 'WALK_IN',
  APPOINTMENT = 'APPOINTMENT',
  HOME_VISIT = 'HOME_VISIT',
  CONSULTATION = 'CONSULTATION',
}

export enum TicketPriority {
  NORMAL = 'NORMAL',
  PRIORITY = 'PRIORITY',
  VIP = 'VIP',
  EMERGENCY = 'EMERGENCY',
}

export class CreateTicketDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({ description: 'Patient ID (optional for walk-ins)' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  patientName: string;

  @ApiProperty({ description: 'Patient phone number', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  patientPhone: string;

  @ApiProperty({ enum: ServiceType, default: ServiceType.WALK_IN })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.NORMAL })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Additional notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
