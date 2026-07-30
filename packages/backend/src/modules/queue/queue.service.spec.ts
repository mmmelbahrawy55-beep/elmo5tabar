import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QueueService } from './services/queue.service';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { QueueGateway } from './gateway/queue.gateway';
import { mockPrismaService, mockCacheManager, mockGateway } from '../../../test/mocks';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: typeof mockPrismaService;

  const mockTicket = {
    id: 'ticket-1',
    ticketNumber: 'Q0001',
    branchId: 'branch-1',
    patientId: 'patient-1',
    patientName: 'محمد أحمد',
    patientPhone: '+966501234567',
    serviceType: 'WALK_IN',
    priority: 'NORMAL',
    status: 'WAITING',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: { id: 'patient-1', firstNameAr: 'محمد', lastNameAr: 'أحمد' },
    branch: { id: 'branch-1', nameAr: 'فرع الرياض' },
  };

  const mockServicePoint = {
    id: 'sp-1',
    branchId: 'branch-1',
    name: 'Counter 1',
    type: 'COUNTER',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: QueueGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a queue ticket', async () => {
      prisma.queueEntry.count.mockResolvedValue(0);
      prisma.queueEntry.create.mockResolvedValue(mockTicket);

      const result = await service.createTicket({
        branchId: 'branch-1',
        patientId: 'patient-1',
        patientName: 'محمد أحمد',
        patientPhone: '+966501234567',
        serviceType: 'WALK_IN',
      });

      expect(result.ticketNumber).toBe('Q0001');
    });

    it('should generate sequential ticket numbers', async () => {
      prisma.queueEntry.count.mockResolvedValue(5);
      prisma.queueEntry.create.mockResolvedValue({ ...mockTicket, ticketNumber: 'Q0006' });

      const result = await service.createTicket({
        branchId: 'branch-1',
        patientId: 'patient-1',
        patientName: 'Test',
        serviceType: 'WALK_IN',
      });

      expect(result.ticketNumber).toBe('Q0006');
    });
  });

  describe('callNext', () => {
    it('should call next ticket in queue', async () => {
      prisma.queueServicePoint.findUnique.mockResolvedValue(mockServicePoint);
      prisma.queueEntry.findFirst.mockResolvedValue(mockTicket);
      prisma.queueEntry.update.mockResolvedValue({ ...mockTicket, status: 'CALLED', calledAt: new Date() });

      const result = await service.callNext('sp-1');

      expect(result.status).toBe('CALLED');
    });

    it('should throw NotFoundException for invalid service point', async () => {
      prisma.queueServicePoint.findUnique.mockResolvedValue(null);

      await expect(service.callNext('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no tickets waiting', async () => {
      prisma.queueServicePoint.findUnique.mockResolvedValue(mockServicePoint);
      prisma.queueEntry.findFirst.mockResolvedValue(null);

      await expect(service.callNext('sp-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('startServing', () => {
    it('should start serving a called ticket', async () => {
      const calledTicket = { ...mockTicket, status: 'CALLED' };
      prisma.queueEntry.findUnique.mockResolvedValue(calledTicket);
      prisma.queueEntry.update.mockResolvedValue({ ...calledTicket, status: 'SERVING', startedServingAt: new Date() });

      const result = await service.startServing('ticket-1');

      expect(result.status).toBe('SERVING');
    });

    it('should throw BadRequestException for non-called ticket', async () => {
      prisma.queueEntry.findUnique.mockResolvedValue(mockTicket);

      await expect(service.startServing('ticket-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeServing', () => {
    it('should complete a serving ticket', async () => {
      const servingTicket = { ...mockTicket, status: 'SERVING', createdAt: new Date(), calledAt: new Date(), startedServingAt: new Date() };
      prisma.queueEntry.findUnique.mockResolvedValue(servingTicket);
      prisma.queueEntry.update.mockResolvedValue({ ...servingTicket, status: 'COMPLETED', completedAt: new Date(), actualWaitMinutes: 5 });

      const result = await service.completeServing('ticket-1');

      expect(result.status).toBe('COMPLETED');
      expect(result.waitTimeSeconds).toBeDefined();
    });

    it('should throw BadRequestException for non-serving ticket', async () => {
      prisma.queueEntry.findUnique.mockResolvedValue(mockTicket);

      await expect(service.completeServing('ticket-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTicket', () => {
    it('should cancel a waiting ticket', async () => {
      prisma.queueEntry.findUnique.mockResolvedValue(mockTicket);
      prisma.queueEntry.update.mockResolvedValue({ ...mockTicket, status: 'CANCELLED' });

      const result = await service.cancelTicket('ticket-1', 'Patient left');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException for completed ticket', async () => {
      const completedTicket = { ...mockTicket, status: 'COMPLETED' };
      prisma.queueEntry.findUnique.mockResolvedValue(completedTicket);

      await expect(service.cancelTicket('ticket-1', 'test')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', async () => {
      prisma.queueEntry.count.mockResolvedValue(10);
      prisma.queueServicePoint.findMany.mockResolvedValue([mockServicePoint]);

      const result = await service.getQueueStatus('branch-1');

      expect(result.waitingCount).toBe(10);
      expect(result.branchId).toBe('branch-1');
    });
  });

  describe('getQueueEntries', () => {
    it('should return paginated queue entries', async () => {
      prisma.queueEntry.findMany.mockResolvedValue([mockTicket]);
      prisma.queueEntry.count.mockResolvedValue(1);

      const result = await service.getQueueEntries('branch-1', { page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by date', async () => {
      prisma.queueEntry.findMany.mockResolvedValue([mockTicket]);
      prisma.queueEntry.count.mockResolvedValue(1);

      const result = await service.getQueueEntries('branch-1', { date: '2026-07-30' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('noShow', () => {
    it('should mark ticket as no-show', async () => {
      prisma.queueEntry.findUnique.mockResolvedValue(mockTicket);
      prisma.queueEntry.update.mockResolvedValue({ ...mockTicket, status: 'NO_SHOW' });

      const result = await service.noShow('ticket-1');

      expect(result.status).toBe('NO_SHOW');
    });

    it('should throw BadRequestException for completed ticket', async () => {
      const completedTicket = { ...mockTicket, status: 'COMPLETED' };
      prisma.queueEntry.findUnique.mockResolvedValue(completedTicket);

      await expect(service.noShow('ticket-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('transferTicket', () => {
    it('should transfer a ticket to another branch', async () => {
      prisma.queueEntry.findUnique.mockResolvedValue(mockTicket);
      prisma.queueEntry.count.mockResolvedValue(0);
      prisma.queueEntry.update.mockResolvedValue({ ...mockTicket, status: 'TRANSFERRED' });
      prisma.queueEntry.create.mockResolvedValue({ ...mockTicket, id: 'ticket-2', ticketNumber: 'Q0001', branchId: 'branch-2' });

      const result = await service.transferTicket('ticket-1', 'branch-2', 'Overflow');

      expect(result.original.status).toBe('TRANSFERRED');
      expect(result.transferred.branchId).toBe('branch-2');
    });
  });
});
