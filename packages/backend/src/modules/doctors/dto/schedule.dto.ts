import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DoctorScheduleSlotDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  endTime: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes', default: 15, minimum: 5, maximum: 60 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  slotDuration?: number;

  @ApiPropertyOptional({ description: 'Max patients per day', default: 20, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPatients?: number;

  @ApiPropertyOptional({ description: 'Is the doctor available on this day', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Break start time (HH:mm)', example: '12:00' })
  @IsOptional()
  @IsString()
  breakStart?: string;

  @ApiPropertyOptional({ description: 'Break end time (HH:mm)', example: '13:00' })
  @IsOptional()
  @IsString()
  breakEnd?: string;

  @ApiProperty({ description: 'Branch ID for this schedule' })
  @IsString()
  @IsNotEmpty()
  branchId: string;
}

export class UpdateDoctorScheduleDto {
  @ApiProperty({ type: [DoctorScheduleSlotDto], description: 'Weekly schedule slots' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoctorScheduleSlotDto)
  schedule: DoctorScheduleSlotDto[];
}
