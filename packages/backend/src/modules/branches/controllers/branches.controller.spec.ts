import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from '../services/branches.service';

describe('BranchesController', () => {
  let controller: BranchesController;

  const mockBranchesService = {
    findAll: jest.fn().mockResolvedValue({ data: [{ id: 'b-1', nameAr: 'الرياض' }], meta: { total: 1, page: 1, limit: 20 } }),
    findOne: jest.fn().mockResolvedValue({ id: 'b-1', nameAr: 'الرياض' }),
    create: jest.fn().mockResolvedValue({ id: 'b-1', nameAr: 'فرع جديد' }),
    update: jest.fn().mockResolvedValue({ id: 'b-1', nameAr: 'محدث' }),
    remove: jest.fn().mockResolvedValue({ message: 'Branch removed' }),
    getNearbyBranches: jest.fn().mockResolvedValue([{ id: 'b-1', nameAr: 'الرياض' }]),
    getStats: jest.fn().mockResolvedValue({ totalOrders: 500, totalRevenue: 500000 }),
    getBranchSettings: jest.fn().mockResolvedValue({ workingHours: {} }),
    updateBranchSettings: jest.fn().mockResolvedValue({ workingHours: {} }),
    getWorkingHours: jest.fn().mockResolvedValue({ sat: { start: '09:00', end: '21:00' } }),
    updateWorkingHours: jest.fn().mockResolvedValue({ sat: { start: '08:00', end: '20:00' } }),
    getCapacity: jest.fn().mockResolvedValue({ current: 50, max: 100 }),
    updateCapacity: jest.fn().mockResolvedValue({ current: 50, max: 120 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [{ provide: BranchesService, useValue: mockBranchesService }],
    }).compile();

    controller = module.get(BranchesController);
    jest.clearAllMocks();
  });

  it('should GET /branches', async () => {
    const result = await controller.findAll({ page: 1, limit: 20 });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should GET /branches/nearby', async () => {
    const result = await controller.getNearby(24.7136, 46.6753, 50);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should GET /branches/:id', async () => {
    const result = await controller.findOne('b-1');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('b-1');
  });

  it('should POST /branches', async () => {
    const result = await controller.create({ nameAr: 'فرع جديد', nameEn: 'New Branch', code: 'NEW', city: 'الرياض', phone: '123' });
    expect(result.success).toBe(true);
  });

  it('should PATCH /branches/:id', async () => {
    const result = await controller.update('b-1', { nameAr: 'محدث' });
    expect(result.success).toBe(true);
  });

  it('should DELETE /branches/:id', async () => {
    const result = await controller.remove('b-1');
    expect(result.success).toBe(true);
  });

  it('should GET /branches/stats/:id', async () => {
    const result = await controller.getStats('b-1');
    expect(result.success).toBe(true);
  });

  it('should GET /branches/:id/settings', async () => {
    const result = await controller.getBranchSettings('b-1');
    expect(result.success).toBe(true);
  });

  it('should PUT /branches/:id/settings', async () => {
    const result = await controller.updateBranchSettings('b-1', {});
    expect(result.success).toBe(true);
  });

  it('should GET /branches/:id/working-hours', async () => {
    const result = await controller.getWorkingHours('b-1');
    expect(result.success).toBe(true);
  });

  it('should PUT /branches/:id/working-hours', async () => {
    const result = await controller.updateWorkingHours('b-1', {});
    expect(result.success).toBe(true);
  });

  it('should GET /branches/:id/capacity', async () => {
    const result = await controller.getCapacity('b-1');
    expect(result.success).toBe(true);
  });

  it('should PATCH /branches/:id/capacity', async () => {
    const result = await controller.updateCapacity('b-1', { maxCapacity: 120 });
    expect(result.success).toBe(true);
  });
});
