import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PackageItemDto {
  @ApiProperty({ description: 'Lab Test ID' })
  @IsString()
  labTestId: string;

  @ApiPropertyOptional({ default: 1, description: 'Quantity of this test' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}

export class CreatePackageDto {
  @ApiProperty({ example: 'حزمة الفحص الشامل', description: 'Package name in Arabic' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Comprehensive Checkup Package', description: 'Package name in English' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ description: 'Arabic description' })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'English description' })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 15, description: 'Discount value' })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiPropertyOptional({
    default: 'percentage',
    enum: ['percentage', 'fixed'],
    description: 'Discount type',
  })
  @IsString()
  @IsOptional()
  discountType?: string;

  @ApiPropertyOptional({ default: false, description: 'Is this a popular package' })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiProperty({ type: [PackageItemDto], description: 'Tests included in the package' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items: PackageItemDto[];
}
