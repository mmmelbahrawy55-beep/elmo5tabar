import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ description: 'User ID to link doctor profile', example: 'uuid-user-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Medical license number', example: 'MD-12345' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  licenseNumber: string;

  @ApiProperty({ description: 'Specialty name in Arabic', example: 'طب الباطنية' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  specialtyAr: string;

  @ApiPropertyOptional({ description: 'Specialty name in English', example: 'Internal Medicine' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialtyEn?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'uuid-dept-123' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Consultation fee in SAR', example: 200, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ description: 'Years of experience', example: 10, minimum: 0, maximum: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  experience?: number;

  @ApiPropertyOptional({ description: 'Consultation duration in minutes', example: 15, minimum: 5, maximum: 120 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  consultationDuration?: number;

  @ApiPropertyOptional({ description: 'Sub-specialty', example: 'Cardiology' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subSpecialty?: string;

  @ApiPropertyOptional({ description: 'Educational background', example: 'MD, King Saud University' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  education?: string;

  @ApiPropertyOptional({ description: 'Professional certifications', example: 'Saudi Board of Internal Medicine' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  certifications?: string;

  @ApiPropertyOptional({ description: 'Biography', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'Is accepting new patients', default: true })
  @IsOptional()
  @IsBoolean()
  acceptingPatients?: boolean;

  @ApiPropertyOptional({ description: 'Is a consultant', default: false })
  @IsOptional()
  @IsBoolean()
  isConsultant?: boolean;
}
