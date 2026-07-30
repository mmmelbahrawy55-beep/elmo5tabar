import {
  Controller,
  Get,
  Post,
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
import { BranchesService } from '../services/branches.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles('ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get paginated list of branches' })
  @ApiResponse({ status: 200, description: 'Paginated branches list' })
  async findAll(@Query() query: PaginationDto & { city?: string; region?: string }) {
    const result = await this.branchesService.findAll(query);
    return { success: true, ...result, pagination: result.meta };
  }

  @Get('nearby')
  @Roles('ADMIN', 'RECEPTIONIST', 'PATIENT')
  @ApiOperation({ summary: 'Find branches near a location' })
  @ApiQuery({ name: 'latitude', required: true, example: 24.7136 })
  @ApiQuery({ name: 'longitude', required: true, example: 46.6753 })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in km (default 50)' })
  @ApiResponse({ status: 200, description: 'Nearby branches sorted by distance' })
  async getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    const branches = await this.branchesService.getNearbyBranches(
      Number(latitude),
      Number(longitude),
      radius ? Number(radius) : 50,
    );
    return { success: true, data: branches };
  }

  @Get(':id')
  @Roles('ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get branch details with settings and stats' })
  @ApiParam({ name: 'id', description: 'Branch UUID or code' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async findOne(@Param('id') id: string) {
    const branch = await this.branchesService.findOne(id);
    return { success: true, data: branch };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  @ApiResponse({ status: 409, description: 'Duplicate code' })
  async create(@Body() dto: CreateBranchDto, @Req() req: any) {
    const branch = await this.branchesService.create(dto, req.user?.id);
    return { success: true, data: branch, message: 'Branch created successfully' };
  }

  @Patch(':id')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Update branch information' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateBranchDto>, @Req() req: any) {
    const branch = await this.branchesService.update(id, dto, req.user?.id);
    return { success: true, data: branch, message: 'Branch updated' };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Soft-delete a branch' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch deleted' })
  async remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }

  @Get(':id/stats')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get branch operational statistics' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiResponse({ status: 200, description: 'Branch statistics' })
  async getStats(@Param('id') id: string) {
    const stats = await this.branchesService.getBranchStats(id);
    return { success: true, data: stats };
  }

  @Get(':id/performance')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get branch performance report' })
  @ApiParam({ name: 'id', description: 'Branch UUID' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Branch performance data' })
  async getPerformance(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const performance = await this.branchesService.getBranchPerformance(id, dateFrom, dateTo);
    return { success: true, data: performance };
  }
}
