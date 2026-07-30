import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TestsService } from '../services/tests.service';
import { CreateLabTestDto, CreateCategoryDto, CreateTestBranchPricingDto } from '../dto/create-test.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Lab Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'LAB_TECHNICIAN', 'BILLING_STAFF')
  @ApiOperation({ summary: 'Get paginated list of lab tests' })
  @ApiResponse({ status: 200, description: 'Paginated tests list' })
  async findAll(@Query() query: PaginationDto & { categoryId?: string; sampleType?: string; minPrice?: number; maxPrice?: number }) {
    const result = await this.testsService.findAll(query);
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('categories')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'LAB_TECHNICIAN')
  @ApiOperation({ summary: 'Get all test categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories() {
    const categories = await this.testsService.getCategories();
    return { success: true, data: categories };
  }

  @Post('categories')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body() dto: CreateCategoryDto, @Req() req: any) {
    const category = await this.testsService.createCategory(dto, req.user?.id);
    return { success: true, data: category, message: 'Category created successfully' };
  }

  @Get('popular')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get popular tests' })
  @ApiResponse({ status: 200, description: 'Popular tests list' })
  async getPopular() {
    const tests = await this.testsService.getPopular();
    return { success: true, data: tests };
  }

  @Get('featured')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Get featured tests' })
  @ApiResponse({ status: 200, description: 'Featured tests list' })
  async getFeatured() {
    const tests = await this.testsService.getFeatured();
    return { success: true, data: tests };
  }

  @Get('search')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')
  @ApiOperation({ summary: 'Search tests by name or code' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchTests(@Query('q') query: string) {
    const tests = await this.testsService.searchTests(query);
    return { success: true, data: tests };
  }

  @Get('stats')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get test statistics' })
  @ApiResponse({ status: 200, description: 'Test statistics' })
  async getStats() {
    const stats = await this.testsService.getStats();
    return { success: true, data: stats };
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'LAB_TECHNICIAN', 'BILLING_STAFF', 'PATIENT')
  @ApiOperation({ summary: 'Get test details with branch pricing' })
  @ApiParam({ name: 'id', description: 'Test UUID or code' })
  @ApiResponse({ status: 200, description: 'Test details' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async findOne(@Param('id') id: string) {
    const test = await this.testsService.findOne(id);
    return { success: true, data: test };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lab test' })
  @ApiResponse({ status: 201, description: 'Test created' })
  @ApiResponse({ status: 409, description: 'Duplicate code' })
  async create(@Body() dto: CreateLabTestDto, @Req() req: any) {
    const test = await this.testsService.create(dto, req.user?.id);
    return { success: true, data: test, message: 'Lab test created successfully' };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a lab test' })
  @ApiParam({ name: 'id', description: 'Test UUID' })
  @ApiResponse({ status: 200, description: 'Test updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateLabTestDto>, @Req() req: any) {
    const test = await this.testsService.update(id, dto, req.user?.id);
    return { success: true, data: test, message: 'Lab test updated' };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft-delete a lab test' })
  @ApiParam({ name: 'id', description: 'Test UUID' })
  @ApiResponse({ status: 200, description: 'Test deleted' })
  async remove(@Param('id') id: string) {
    return this.testsService.remove(id);
  }

  @Get(':id/pricing')
  @Roles('ADMIN', 'RECEPTIONIST', 'BILLING_STAFF', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get branch-specific pricing for a test' })
  @ApiParam({ name: 'id', description: 'Test UUID' })
  @ApiResponse({ status: 200, description: 'Branch pricing list' })
  async getBranchPricing(@Param('id') id: string) {
    const pricing = await this.testsService.getBranchPricing(id);
    return { success: true, data: pricing };
  }

  @Put(':id/pricing/:branchId')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Set branch-specific pricing for a test' })
  @ApiParam({ name: 'id', description: 'Test UUID' })
  @ApiParam({ name: 'branchId', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Pricing set' })
  async setBranchPricing(
    @Param('id') id: string,
    @Param('branchId') branchId: string,
    @Body() dto: CreateTestBranchPricingDto,
  ) {
    const pricing = await this.testsService.setBranchPricing(id, branchId, { ...dto, branchId });
    return { success: true, data: pricing, message: 'Branch pricing updated' };
  }
}
