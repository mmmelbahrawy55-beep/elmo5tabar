import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'patient@almokhtabar.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'SecureP@ss1' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({
    description: 'Two-factor authentication code (if enabled)',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}
