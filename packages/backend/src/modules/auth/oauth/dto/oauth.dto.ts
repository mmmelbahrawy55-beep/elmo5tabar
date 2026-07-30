import { IsString, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OAuthProviderEnum { GOOGLE = 'google', APPLE = 'apple', FACEBOOK = 'facebook' }

export class OAuthCallbackDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() state: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() code_verifier?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() id_token?: string;
}

export class OAuthLinkDto {
  @ApiProperty({ enum: OAuthProviderEnum }) @IsEnum(OAuthProviderEnum) provider: OAuthProviderEnum;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() state: string;
}
