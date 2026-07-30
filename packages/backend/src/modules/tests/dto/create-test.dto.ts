import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name in Arabic', example: 'تحاليل الدم' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr: string;

  @ApiProperty({ description: 'Category name in English', example: 'Blood Tests' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', example: 'blood-tests' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  icon?: string;

  @ApiPropertyOptional({ description: 'Color hex code', example: '#FF5733' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for subcategories' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateLabTestDto {
  @ApiProperty({ description: 'Test name in Arabic', example: 'تحليل صورة الدم الكاملة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr: string;

  @ApiProperty({ description: 'Test name in English', example: 'Complete Blood Count (CBC)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({ description: 'Unique test code', example: 'CBC-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Subcategory ID' })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionEn?: string;

  @ApiProperty({ description: 'Sample type required', example: 'Blood' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sampleType: string;

  @ApiPropertyOptional({ description: 'Tube type', example: 'EDTA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tubeType?: string;

  @ApiPropertyOptional({ description: 'Tube color', example: 'Purple' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tubeColor?: string;

  @ApiPropertyOptional({ description: 'Fasting required', default: false })
  @IsOptional()
  @IsBoolean()
  fastingRequired?: boolean;

  @ApiPropertyOptional({ description: 'Fasting hours required', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fastingHours?: number;

  @ApiPropertyOptional({ description: 'Turnaround time in hours', default: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  turnaroundTimeHours?: number;

  @ApiProperty({ description: 'Price in SAR', example: 75 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Discounted price', example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountedPrice?: number;

  @ApiPropertyOptional({ description: 'Is popular test', default: false })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ description: 'Is featured test', default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Units', example: 'g/dL, cells/μL' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  units?: string;

  @ApiPropertyOptional({ description: 'Methodology', example: 'Flow Cytometry' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  methodology?: string;

  @ApiPropertyOptional({ description: 'Available for home collection', default: true })
  @IsOptional()
  @IsBoolean()
  homeCollection?: boolean;

  @ApiPropertyOptional({ description: 'Preparation notes in Arabic' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preparationNotesAr?: string;

  @ApiPropertyOptional({ description: 'Preparation notes in English' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preparationNotesEn?: string;
}

export class CreateTestBranchPricingDto {
  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ description: 'Branch-specific price', example: 80 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Branch-specific discounted price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountedPrice?: number;
}
