import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from '../services/queue.service';

describe('QueueController', () => {
  let controller: QueueController;

  const mockQueueService = {
    createTicket: jest.fn().mockResolvedValue({ id: 'ticket-1', ticketNumber: 'A001', priority: 'NORMAL', status: 'WAITING' }),
    getQueueEntries: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50 } }),
    getTicket: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'WAITING' }),
    callNext: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'CALLED' }),
    startServing: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'SERVING' }),
    completeServing: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'COMPLETED' }),
    cancelTicket: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'CANCELLED' }),
    noShow: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'NO_SHOW' }),
    transferTicket: jest.fn().mockResolvedValue({ id: 'ticket-1', status: 'TRANSFERRED' }),
    getQueueStatus: jest.fn().mockResolvedValue({ waiting: 10, serving: 3, completed: 100 }),
    getQueueHistory: jest.fn().mockResolvedValue({ data: [], summary: { totalServed: 100 } }),
    getServicePoints: jest.fn().mockResolvedValue([{ id: 'sp-1', name: 'Counter 1' }]),
    updateServicePoint: jest.fn().mockResolvedValue({ id: 'sp-1', name: 'Updated' }),
    getDashboardStats: jest.fn().mockResolvedValue({ avgWaitTime: 15, totalServed: 100 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [{ provide: QueueService, useValue: mockQueueService }],
    }).compile();

    controller = module.get(QueueController);
    jest.clearAllMocks();
  });

  it('should POST /queue/tickets', async () => {
    const result = await controller.createTicket({ patientId: 'pat-1', branchId: 'b-1', serviceType: 'CONSULTATION' });
    expect(result.ticketNumber).toBe('A001');
  });

  it('should GET /queue/tickets', async () => {
    const result = await controller.getTickets('b-1', 'WAITING', '1', '50', '2025-01-15');
    expect(result.data).toBeDefined();
  });

  it('should GET /queue/tickets/:id', async () => {
    const result = await controller.getTicket('ticket-1');
    expect(result.status).toBe('WAITING');
  });

  it('should POST /queue/tickets/:id/call', async () => {
    const result = await controller.callNext('sp-1');
    expect(result.status).toBe('CALLED');
  });

  it('should POST /queue/tickets/:id/serve', async () => {
    const result = await controller.startServing('ticket-1');
    expect(result.status).toBe('SERVING');
  });

  it('should POST /queue/tickets/:id/complete', async () => {
    const result = await controller.completeServing('ticket-1', { notes: 'Completed successfully' });
    expect(result.status).toBe('COMPLETED');
  });

  it('should POST /queue/tickets/:id/cancel', async () => {
    const result = await controller.cancelTicket('ticket-1', { reason: 'Patient walked out' });
    expect(result.status).toBe('CANCELLED');
  });

  it('should POST /queue/tickets/:id/no-show', async () => {
    const result = await controller.noShow('ticket-1');
    expect(result.status).toBe('NO_SHOW');
  });

  it('should POST /queue/tickets/:id/transfer', async () => {
    const result = await controller.transferTicket('ticket-1', { toBranchId: 'b-2', reason: 'Overcrowding' });
    expect(result.status).toBe('TRANSFERRED');
  });

  it('should GET /queue/status/:branchId', async () => {
    const result = await controller.getQueueStatus('b-1');
    expect(result.waiting).toBe(10);
  });

  it('should GET /queue/history/:branchId', async () => {
    const result = await controller.getQueueHistory('b-1', '2025-01-01', '2025-01-31');
    expect(result.summary).toBeDefined();
  });

  it('should GET /queue/service-points/:branchId', async () => {
    const result = await controller.getServicePoints('b-1');
    expect(result).toHaveLength(1);
  });

  it('should PUT /queue/service-points/:id', async () => {
    const result = await controller.updateServicePoint('sp-1', { name: 'Updated', isActive: true });
    expect(result.name).toBe('Updated');
  });

  it('should GET /queue/dashboard/:branchId', async () => {
    const result = await controller.getDashboardStats('b-1');
    expect(result.avgWaitTime).toBe(15);
  });
});
