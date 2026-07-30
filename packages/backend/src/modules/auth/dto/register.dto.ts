import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'patient@almokhtabar.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, uppercase, lowercase, number, special char)',
    example: 'SecureP@ss1',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])/, { message: 'Password must contain a lowercase letter' })
  @Matches(/^(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter' })
  @Matches(/^(?=.*\d)/, { message: 'Password must contain a number' })
  @Matches(/^(?=.*[^A-Za-z0-9])/, { message: 'Password must contain a special character' })
  password!: string;

  @ApiProperty({ description: 'Arabic first name', example: 'محمد' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstNameAr!: string;

  @ApiProperty({ description: 'Arabic last name', example: 'أحمد' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastNameAr!: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+966501234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
