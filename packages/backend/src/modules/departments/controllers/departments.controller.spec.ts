import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from '../services/departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;

  const mockDepartmentsService = {
    findAll: jest.fn().mockResolvedValue([{ id: 'dept-1', nameAr: 'مختبر', nameEn: 'Lab' }]),
    findOne: jest.fn().mockResolvedValue({ id: 'dept-1', nameAr: 'مختبر', nameEn: 'Lab' }),
    create: jest.fn().mockResolvedValue({ id: 'dept-1', nameAr: 'قسم جديد' }),
    update: jest.fn().mockResolvedValue({ id: 'dept-1', nameAr: 'محدث' }),
    remove: jest.fn().mockResolvedValue({ message: 'Department removed' }),
    getTree: jest.fn().mockResolvedValue([{ id: 'dept-1', children: [] }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [{ provide: DepartmentsService, useValue: mockDepartmentsService }],
    }).compile();

    controller = module.get(DepartmentsController);
    jest.clearAllMocks();
  });

  it('should GET /departments', async () => {
    const result = await controller.findAll();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should GET /departments/tree', async () => {
    const result = await controller.getTree();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should GET /departments/:id', async () => {
    const result = await controller.findOne('dept-1');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('dept-1');
  });

  it('should POST /departments', async () => {
    const result = await controller.create({ nameAr: 'قسم جديد', nameEn: 'New Dept', code: 'NEW' });
    expect(result.success).toBe(true);
  });

  it('should PATCH /departments/:id', async () => {
    const result = await controller.update('dept-1', { nameAr: 'محدث' });
    expect(result.success).toBe(true);
  });

  it('should DELETE /departments/:id', async () => {
    const result = await controller.remove('dept-1');
    expect(result.success).toBe(true);
  });
});
