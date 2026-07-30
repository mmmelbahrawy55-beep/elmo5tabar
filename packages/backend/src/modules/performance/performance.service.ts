import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { PrismaOptimizationService } from '../../lib/prisma/prisma-optimization.service';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private optimizer: PrismaOptimizationService,
  ) {}

  async getSystemHealth() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      status: 'healthy',
      uptime,
      uptimeHuman: this.formatUptime(uptime),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
    };
  }

  async getDatabaseMetrics() {
    const [poolStatus, queryPerf, tableStats, cacheRatio, slowQueries] = await Promise.all([
      this.optimizer.getPoolStatus(),
      this.optimizer.getQueryPerformance(),
      this.optimizer.getTableStats(),
      this.optimizer.getCacheHitRatio(),
      this.optimizer.getSlowQueries(500),
    ]);
    return { poolStatus, queryPerf, tableStats, cacheHitRatio: cacheRatio, slowQueries };
  }

  async getRequestMetrics() {
    return {
      message: 'Request metrics available via monitoring dashboard',
      endpoints: {
        total: 250,
        public: 120,
        authenticated: 130,
      },
    };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }
}
