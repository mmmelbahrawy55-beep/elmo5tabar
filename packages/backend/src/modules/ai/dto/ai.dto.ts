import { IsString, IsOptional, IsEnum, IsArray, IsUUID, MinLength, MaxLength, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiPropertyOptional({ description: 'Conversation ID to continue existing conversation' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ description: 'User message', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsEnum(['ar', 'en'])
  language?: 'ar' | 'en';

  @ApiProperty({ enum: ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMIN'] })
  @IsEnum(['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMIN'])
  role: string;

  @ApiPropertyOptional({ description: 'Attach result IDs for context' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachResults?: string[];

  @ApiPropertyOptional({ description: 'Uploaded image filenames for OCR' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachImages?: string[];
}

export class InterpretResultsDto {
  @ApiProperty({ description: 'Result/report ID to interpret' })
  @IsUUID()
  reportId: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsEnum(['ar', 'en'])
  language?: 'ar' | 'en';

  @ApiPropertyOptional({ description: 'Focus area for interpretation' })
  @IsOptional()
  @IsString()
  focus?: string;
}

export class SearchRequestDto {
  @ApiProperty({ minLength: 1, maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsEnum(['ar', 'en'])
  language?: 'ar' | 'en';

  @ApiPropertyOptional({ description: 'Filter by document type' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ description: 'Filter by role-specific data' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Search result types', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class KnowledgeBaseCreateDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summaryAr?: string;

  @ApiProperty({ enum: ['FAQ', 'LAB_TEST_INFO', 'RESULT_EXPLANATION', 'PREPARATION_GUIDE', 'HEALTH_PACKAGE', 'MEDICAL_ARTICLE', 'POLICY', 'PROCEDURE'] })
  @IsEnum(['FAQ', 'LAB_TEST_INFO', 'RESULT_EXPLANATION', 'PREPARATION_GUIDE', 'HEALTH_PACKAGE', 'MEDICAL_ARTICLE', 'POLICY', 'PROCEDURE'])
  documentType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['ar', 'en', 'both'], default: 'both' })
  @IsOptional()
  @IsEnum(['ar', 'en', 'both'])
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class KnowledgeBaseUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summaryAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VoiceRequestDto {
  @ApiProperty({ description: 'Base64-encoded audio data' })
  @IsString()
  audio: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'], default: 'ar' })
  @IsOptional()
  @IsEnum(['ar', 'en'])
  language?: 'ar' | 'en';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ enum: ['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMIN'] })
  @IsEnum(['PATIENT', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'ADMIN'])
  role: string;
}

export class FeedbackDto {
  @ApiProperty({ enum: ['THUMBS_UP', 'THUMBS_DOWN', 'HELPFUL', 'NOT_HELPFUL', 'ACCURATE', 'INACCURATE'] })
  @IsEnum(['THUMBS_UP', 'THUMBS_DOWN', 'HELPFUL', 'NOT_HELPFUL', 'ACCURATE', 'INACCURATE'])
  rating: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReindexDto {
  @ApiPropertyOptional({ enum: ['OPENAI', 'AZURE_OPENAI', 'GEMINI', 'CLAUDE'] })
  @IsOptional()
  @IsEnum(['OPENAI', 'AZURE_OPENAI', 'GEMINI', 'CLAUDE'])
  provider?: string;
}

export class ProviderSwitchDto {
  @ApiProperty({ enum: ['OPENAI', 'AZURE_OPENAI', 'GEMINI', 'CLAUDE'] })
  @IsEnum(['OPENAI', 'AZURE_OPENAI', 'GEMINI', 'CLAUDE'])
  provider: string;
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}
