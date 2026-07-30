import { Test, TestingModule } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { ResultsService } from '../services/results.service';

describe('ResultsController', () => {
  let controller: ResultsController;

  const mockResultsService = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    search: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } }),
    findOne: jest.fn().mockResolvedValue({ id: 'rpt-1', reportNumber: 'RPT-001' }),
    create: jest.fn().mockResolvedValue({ id: 'rpt-1', reportNumber: 'RPT-001' }),
    update: jest.fn().mockResolvedValue({ id: 'rpt-1', status: 'COMPLETED' }),
    generateReport: jest.fn().mockResolvedValue({ id: 'rpt-1', pdfUrl: 'http://example.com/report.pdf' }),
    verifySignature: jest.fn().mockResolvedValue({ verified: true, signedBy: 'Dr. Ahmed', timestamp: new Date().toISOString() }),
    shareReport: jest.fn().mockResolvedValue({ shareUrl: 'http://example.com/share/abc123', expiresAt: new Date().toISOString() }),
    getReportHistory: jest.fn().mockResolvedValue({ patient: {}, reports: [] }),
    getStats: jest.fn().mockResolvedValue({ totalReports: 1000, criticalValues: 50 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [{ provide: ResultsService, useValue: mockResultsService }],
    }).compile();

    controller = module.get(ResultsController);
    jest.clearAllMocks();
  });

  it('should GET /results', async () => {
    const result = await controller.findAll({});
    expect(result.data).toBeDefined();
  });

  it('should GET /results/search', async () => {
    const result = await controller.search('glucose', 'b-1', 'COMPLETED', '1', '20');
    expect(result.data).toBeDefined();
  });

  it('should GET /results/:id', async () => {
    const result = await controller.findOne('rpt-1');
    expect(result.id).toBe('rpt-1');
  });

  it('should POST /results', async () => {
    const result = await controller.create({} as any);
    expect(result.id).toBe('rpt-1');
  });

  it('should PATCH /results/:id', async () => {
    const result = await controller.update('rpt-1', {} as any);
    expect(result).toBeDefined();
  });

  it('should POST /results/:id/generate', async () => {
    const result = await controller.generate('rpt-1');
    expect(result.pdfUrl).toBeDefined();
  });

  it('should GET /results/:id/verify', async () => {
    const result = await controller.verifySignature('rpt-1');
    expect(result.verified).toBe(true);
  });

  it('should POST /results/:id/share', async () => {
    const result = await controller.shareReport('rpt-1', { expiresInHours: 48 });
    expect(result.shareUrl).toBeDefined();
  });

  it('should GET /results/patient/:patientId/history', async () => {
    const result = await controller.getPatientHistory('pat-1');
    expect(result.patient).toBeDefined();
  });

  it('should GET /results/stats', async () => {
    const result = await controller.getStats();
    expect(result.totalReports).toBe(1000);
  });
});
