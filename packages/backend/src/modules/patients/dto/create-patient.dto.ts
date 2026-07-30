import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export enum PatientGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

export enum BloodType {
  A_POSITIVE = 'A_POSITIVE',
  A_NEGATIVE = 'A_NEGATIVE',
  B_POSITIVE = 'B_POSITIVE',
  B_NEGATIVE = 'B_NEGATIVE',
  AB_POSITIVE = 'AB_POSITIVE',
  AB_NEGATIVE = 'AB_NEGATIVE',
  O_POSITIVE = 'O_POSITIVE',
  O_NEGATIVE = 'O_NEGATIVE',
}

export class CreatePatientDto {
  @ApiProperty({ description: 'First name in Arabic', example: 'أحمد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstNameAr: string;

  @ApiProperty({ description: 'Last name in Arabic', example: 'محمد' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastNameAr: string;

  @ApiPropertyOptional({ description: 'First name in English', example: 'Ahmed' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstNameEn?: string;

  @ApiPropertyOptional({ description: 'Last name in English', example: 'Mohammed' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNameEn?: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ enum: PatientGender, description: 'Gender' })
  @IsEnum(PatientGender)
  @IsNotEmpty()
  gender: PatientGender;

  @ApiProperty({ description: 'Phone number', example: '0501234567' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  @Matches(/^[0-9+]+$/, { message: 'Phone number must contain only digits and +' })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'patient@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'National ID number', example: '1234567890' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  nationalId?: string;

  @ApiPropertyOptional({ enum: BloodType, description: 'Blood type' })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ description: 'Known allergies', example: 'Penicillin, Peanuts' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  allergies?: string;

  @ApiPropertyOptional({ description: 'Chronic diseases', example: 'Diabetes, Hypertension' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chronicDiseases?: string;

  @ApiPropertyOptional({ description: 'Guardian full name', example: 'محمد أحمد' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guardianName?: string;

  @ApiPropertyOptional({ description: 'Guardian phone number', example: '0509876543' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  guardianPhone?: string;

  @ApiPropertyOptional({ description: 'Referral source', example: 'walk-in', enum: ['walk-in', 'online', 'doctor-referral', 'corporate'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referralSource?: string;
}
