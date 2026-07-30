import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsObject, IsUUID,
  IsBoolean, IsDateString, IsNumber, Min, Max, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationTypeEnum {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  VOICE = 'VOICE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannelEnum {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  RESULTS_READY = 'RESULTS_READY',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  INSURANCE_EXPIRY = 'INSURANCE_EXPIRY',
  BIRTHDAY = 'BIRTHDAY',
  PROMOTIONAL = 'PROMOTIONAL',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export class SendNotificationDto {
  @ApiProperty({ description: 'Target user UUID' })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty({ description: 'Template variables' })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;

  @ApiPropertyOptional({ isArray: true, enum: NotificationChannelEnum })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels?: NotificationChannelEnum[];

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SendBulkDto {
  @ApiProperty({ isArray: true, description: 'Array of user UUIDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds!: string[];

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;

  @ApiPropertyOptional({ isArray: true, enum: NotificationChannelEnum })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels?: NotificationChannelEnum[];
}

export class SendToRoleDto {
  @ApiProperty({ description: 'User role name' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;

  @ApiPropertyOptional({ isArray: true, enum: NotificationChannelEnum })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels?: NotificationChannelEnum[];
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ enum: NotificationTypeEnum })
  @IsOptional()
  @IsEnum(NotificationTypeEnum)
  type?: NotificationTypeEnum;

  @ApiPropertyOptional({ enum: NotificationChannelEnum })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpdatePreferenceDto {
  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  @IsNotEmpty()
  channel!: NotificationChannelEnum;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  enabled!: boolean;
}

export class BulkPreferencesDto {
  @ApiProperty({ type: [UpdatePreferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePreferenceDto)
  preferences!: UpdatePreferenceDto[];
}

export class QuietHoursDto {
  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  @IsNotEmpty()
  channel!: NotificationChannelEnum;

  @ApiProperty({ description: 'Start time in HH:mm format' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm format' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}

export class CreateTemplateDto {
  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty({ enum: NotificationChannelEnum })
  @IsEnum(NotificationChannelEnum)
  @IsNotEmpty()
  channel!: NotificationChannelEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleEn!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsBodyAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smsBodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushTitleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushTitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushBodyAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pushBodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nameEn!: string;

  @ApiProperty({ enum: NotificationTypeEnum })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type!: NotificationTypeEnum;

  @ApiProperty({ isArray: true, enum: NotificationChannelEnum })
  @IsArray()
  @IsEnum(NotificationChannelEnum, { each: true })
  channels!: NotificationChannelEnum[];

  @ApiProperty({ description: 'Query/filter to determine audience' })
  @IsObject()
  @IsNotEmpty()
  audienceQuery!: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleEn!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyAr!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class TestChannelDto {
  @ApiProperty({ enum: ['sms', 'email', 'whatsapp', 'push', 'voice'] })
  @IsString()
  @IsNotEmpty()
  channel!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipient!: string;
}

export class UpdateChannelConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRateLimitDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxPerMinute!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxPerHour!: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxPerDay!: number;
}

export class BulkRetryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ScheduledQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
