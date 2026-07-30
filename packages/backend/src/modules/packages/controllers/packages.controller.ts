import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public, Roles } from '../../../common/decorators/roles.decorator';
import { PackagesService } from '../services/packages.service';
import { CreatePackageDto } from '../dto/create-package.dto';

@ApiTags('Packages')
@ApiBearerAuth()
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get paginated list of packages' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Min discount filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Max discount filter' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Paginated list of packages' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.packagesService.findAll({
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      isActive,
    });
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Get popular packages' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of packages to return' })
  @ApiResponse({ status: 200, description: 'List of popular packages' })
  async getPopular(@Query('limit') limit?: number) {
    return this.packagesService.getPopular(limit);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get package statistics' })
  @ApiResponse({ status: 200, description: 'Package statistics' })
  async getStats() {
    return this.packagesService.getStats();
  }

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate optimal package price from test IDs' })
  @ApiResponse({ status: 200, description: 'Price calculation with best package suggestion' })
  async calculatePrice(@Body('testIds') testIds: string[]) {
    return this.packagesService.calculatePrice(testIds);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single package by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new package' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update an existing package' })
  @ApiParam({ name: 'id', type: String, description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePackageDto>) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a package' })
  @ApiParam({ name: 'id', type: String, description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
