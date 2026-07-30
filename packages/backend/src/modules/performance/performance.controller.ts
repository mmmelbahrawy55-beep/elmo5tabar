import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PerformanceService } from './performance.service';

@ApiTags('Performance')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly perf: PerformanceService) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  async health() {
    return this.perf.getSystemHealth();
  }

  @Get('database')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Database performance metrics' })
  async database() {
    return this.perf.getDatabaseMetrics();
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request metrics' })
  async requests() {
    return this.perf.getRequestMetrics();
  }
}
