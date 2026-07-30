import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentStatus } from './dto/appointment-filters.dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    reschedule: jest.fn(),
    checkIn: jest.fn(),
    complete: jest.fn(),
    markNoShow: jest.fn(),
    getAvailableSlots: jest.fn(),
    getCalendar: jest.fn(),
    getStats: jest.fn(),
    getUpcoming: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: AppointmentsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should create appointment via controller', async () => {
    const dto = { patientId: 'patient-1', branchId: 'branch-1', scheduledAt: '2026-08-20T10:00:00Z' };
    const expected = { id: 'apt-1', ...dto };
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto, { user: { userId: 'user-1' } } as any);

    expect(result).toEqual(expected);
  });

  it('should list all appointments', async () => {
    const expected = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    mockService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll({ page: 1, limit: 20 });

    expect(result.meta.page).toBe(1);
  });

  it('should get appointment by id', async () => {
    const expected = { id: 'apt-1' };
    mockService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('apt-1');

    expect(result.id).toBe('apt-1');
  });

  it('should cancel appointment', async () => {
    const expected = { id: 'apt-1', status: AppointmentStatus.CANCELLED };
    mockService.cancel.mockResolvedValue(expected);

    const result = await controller.cancel('apt-1', { reason: 'Test' }, { user: { userId: 'user-1' } } as any);

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
  });

  it('should get available slots', async () => {
    mockService.getAvailableSlots.mockResolvedValue([{ time: '10:00', available: true, datetime: '2026-08-20T10:00:00Z' }]);

    const result = await controller.getAvailableSlots('branch-1', 'doctor-1', '2026-08-20');

    expect(result).toHaveLength(1);
  });

  it('should get appointment stats', async () => {
    mockService.getStats.mockResolvedValue({ total: 100, completed: 80 });

    const result = await controller.getStats('branch-1');

    expect(result.total).toBe(100);
  });
});
