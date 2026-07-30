import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsInt, Min, Max, IsBoolean, IsObject, MinLength, MaxLength, IsDateString } from 'class-validator';

export class CreatePostDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) titleAr: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional({ enum: ['article', 'news', 'health_tip', 'promotion', 'offer', 'success_story', 'video'] })
  @IsOptional() @IsString() contentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerptAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerptEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() featuredImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() featuredImageAlt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ enum: ['ar', 'en', 'both'] }) @IsOptional() @IsString() locale?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowComments?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPinned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() robots?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() focusKeyphrase?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() schemaOrg?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerptAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerptEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() featuredImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() featuredImageAlt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() locale?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowComments?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPinned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ogImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() robots?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() focusKeyphrase?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() schemaOrg?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeNotes?: string;
}

export class PostQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tag?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locale?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPinned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() @MinLength(1) nameAr: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class CreateAuthorDto {
  @ApiProperty() @IsString() @MinLength(1) nameAr: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bioAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bioEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() avatar?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() socialLinks?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLabStaff?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class CreateCommentDto {
  @ApiProperty() @IsUUID() postId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorEmail?: string;
}

export class CommentModerationDto {
  @ApiProperty({ enum: ['approve', 'reject', 'spam'] }) @IsEnum(['approve', 'reject', 'spam']) action: string;
}

export class NewsletterSubscribeDto {
  @ApiProperty() @IsString() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameEn?: string;
  @ApiPropertyOptional({ enum: ['ar', 'en'] }) @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) interests?: string[];
}

export class CreateCampaignDto {
  @ApiProperty() @IsString() subjectAr: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previewTextAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previewTextEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contentEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsUUID('4', { each: true }) postIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsUUID('4', { each: true }) categoryIds?: string[];
  @ApiPropertyOptional({ enum: ['ar', 'en', 'both'] }) @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class MediaUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' }) file: any;
  @ApiPropertyOptional() @IsOptional() @IsString() folder?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() caption?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class WorkflowActionDto {
  @ApiProperty({ enum: ['submit_review', 'approve', 'reject', 'publish', 'archive', 'draft', 'schedule'] })
  @IsEnum(['submit_review', 'approve', 'reject', 'publish', 'archive', 'draft', 'schedule'])
  action: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class RelatePostsDto {
  @ApiProperty() @IsUUID() targetId: string;
  @ApiPropertyOptional({ enum: ['related', 'similar', 'series'] }) @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() weight?: number;
}

export class CmsDashboardDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(365) days?: number;
}
