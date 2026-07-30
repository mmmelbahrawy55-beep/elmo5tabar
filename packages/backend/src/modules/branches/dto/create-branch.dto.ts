import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEmail,
  IsLatitude,
  IsLongitude,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name in Arabic', example: 'فرع الرياض الرئيسي' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr: string;

  @ApiProperty({ description: 'Branch name in English', example: 'Riyadh Main Branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({ description: 'Unique branch code', example: 'RYD-001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: 'Branch phone number', example: '0112345678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @ApiPropertyOptional({ description: 'Branch email', example: 'riyadh@almokhtabar.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Branch address in Arabic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressAr: string;

  @ApiProperty({ description: 'City name', example: 'الرياض' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'Region/Province name', example: 'منطقة الرياض' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 24.7136 })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: 46.6753 })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Operating hours as JSON', example: { sunday: { open: '08:00', close: '22:00' } } })
  @IsOptional()
  operatingHours?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Maximum patient capacity per day', example: 500 })
  @IsOptional()
  @IsNumber()
  maxCapacity?: number;
}
