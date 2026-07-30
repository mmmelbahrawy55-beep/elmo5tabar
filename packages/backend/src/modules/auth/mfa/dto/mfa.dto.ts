import {
  IsEnum,
  IsString,
  Matches,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TwoFactorMethodEnum {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
}

export class Enable2FADto {
  @ApiProperty({ enum: TwoFactorMethodEnum })
  @IsEnum(TwoFactorMethodEnum)
  method: TwoFactorMethodEnum;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

export class Disable2FADto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class VerifyOTPDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class SendOTPDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['sms', 'email'] })
  @IsOptional()
  @IsString()
  channel?: string;
}
