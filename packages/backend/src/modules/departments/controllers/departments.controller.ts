import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Roles('ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'Departments list' })
  async findAll() {
    const departments = await this.departmentsService.findAll();
    return { success: true, data: departments };
  }

  @Get('tree')
  @Roles('ADMIN', 'BRANCH_MANAGER')
  @ApiOperation({ summary: 'Get departments as hierarchical tree' })
  @ApiResponse({ status: 200, description: 'Department tree structure' })
  async getTree() {
    const tree = await this.departmentsService.getTree();
    return { success: true, data: tree };
  }

  @Get(':id')
  @Roles('ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST', 'DOCTOR')
  @ApiOperation({ summary: 'Get department details' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department details' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return { success: true, data: department };
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  @ApiResponse({ status: 409, description: 'Duplicate code' })
  async create(@Body() dto: CreateDepartmentDto, @Req() req: any) {
    const department = await this.departmentsService.create(dto, req.user?.id);
    return { success: true, data: department, message: 'Department created successfully' };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>, @Req() req: any) {
    const department = await this.departmentsService.update(id, dto, req.user?.id);
    return { success: true, data: department, message: 'Department updated' };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department deleted' })
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
