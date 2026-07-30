import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

describe('PerformanceController', () => {
  let controller: PerformanceController;

  const mockPerformanceService = {
    getSystemHealth: jest.fn().mockResolvedValue({ status: 'healthy', uptime: 3600, memoryUsage: { heapUsed: 100 } }),
    getDatabaseMetrics: jest.fn().mockResolvedValue({ connectionPool: { active: 5, idle: 10 }, slowQueries: 2 }),
    getRequestMetrics: jest.fn().mockResolvedValue({ totalRequests: 10000, avgResponseTime: 150, p95ResponseTime: 300, errorRate: 0.5 }),
    getCachePerformance: jest.fn().mockResolvedValue({ hitRate: 85, missRate: 15 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [{ provide: PerformanceService, useValue: mockPerformanceService }],
    }).compile();

    controller = module.get(PerformanceController);
    jest.clearAllMocks();
  });

  it('should GET /performance/health', async () => {
    const result = await controller.health();
    expect(result.status).toBe('healthy');
  });

  it('should GET /performance/database', async () => {
    const result = await controller.database();
    expect(result.slowQueries).toBe(2);
  });

  it('should GET /performance/requests', async () => {
    const result = await controller.requests();
    expect(result.avgResponseTime).toBe(150);
  });
});
