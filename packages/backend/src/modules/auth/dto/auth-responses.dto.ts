import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 'b50e930e-8a1c-4a2b-9f12-3d4e5f6a7b8c' })
  id!: string;

  @ApiProperty({ example: 'محمد' })
  firstNameAr!: string;

  @ApiProperty({ example: 'أحمد' })
  lastNameAr!: string;

  @ApiPropertyOptional({ example: 'Mohammed' })
  firstNameEn?: string;

  @ApiPropertyOptional({ example: 'Ahmed' })
  lastNameEn?: string;
}

export class AuthUserDto {
  @ApiProperty({ example: 'b50e930e-8a1c-4a2b-9f12-3d4e5f6a7b8c' })
  id!: string;

  @ApiProperty({ example: 'patient@almokhtabar.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PATIENT })
  role!: UserRole;

  @ApiPropertyOptional({ type: UserProfileDto })
  profile?: UserProfileDto;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token (15min expiry)' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token (7d expiry)' })
  refreshToken!: string;
}

export class AuthResponseDto extends TokenResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class TwoFactorSetupDto {
  @ApiProperty({ description: 'TOTP secret for authenticator apps' })
  secret!: string;

  @ApiProperty({
    description: 'otpauth:// URI for QR code generation',
    example: 'otpauth://totp/AlMokhtabar:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AlMokhtabar',
  })
  otpauthUrl!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}
