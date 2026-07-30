import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateInsuranceCompanyDto {
  @ApiProperty({ example: 'التأمين الطبي السعودي' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Saudi Medical Insurance' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 'SMI001' })
  @IsString()
  code: string;

  @ApiProperty({ example: '+966501234567' })
  @IsString()
  contactPhone: string;

  @ApiPropertyOptional({ example: 'info@smi.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'claims@smi.com' })
  @IsEmail()
  @IsOptional()
  claimsEmail?: string;

  @ApiPropertyOptional({ example: 'https://smi.com' })
  @IsString()
  @IsOptional()
  website?: string;
}
