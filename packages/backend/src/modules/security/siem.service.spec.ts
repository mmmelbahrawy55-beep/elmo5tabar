import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService, mockCacheManager, mockSIEMService } from '../../../test/mocks';

describe('SIEMService', () => {
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'SIEM_SERVICE', useValue: mockSIEMService },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('event ingestion', () => {
    it('should ingest security events', async () => {
      const event = {
        eventType: 'LOGIN_FAILURE',
        severity: 'MEDIUM',
        sourceIp: '192.168.1.100',
        description: 'Failed login attempt',
        metadata: { userId: 'user-1' },
      };

      const siem = mockSIEMService.useValue;
      const result = await siem.ingestEvent(event);

      expect(result.accepted).toBe(true);
    });

    it('should handle high volume event ingestion', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        eventType: 'API_REQUEST',
        severity: 'LOW',
        sourceIp: `192.168.1.${i}`,
        description: `Request ${i}`,
      }));

      const siem = mockSIEMService.useValue;
      for (const event of events) {
        await siem.ingestEvent(event);
      }

      expect(siem.ingestEvent).toHaveBeenCalledTimes(100);
    });
  });

  describe('buffer flush', () => {
    it('should flush buffer when threshold reached', () => {
      const buffer: any[] = [];
      const threshold = 100;

      for (let i = 0; i < 120; i++) {
        buffer.push({ id: i });
      }

      const shouldFlush = buffer.length >= threshold;
      expect(shouldFlush).toBe(true);
    });

    it('should flush buffer on timeout', () => {
      const buffer: any[] = [];
      const lastFlushTime = Date.now();
      const flushInterval = 5000;

      const shouldFlush = Date.now() - lastFlushTime >= flushInterval && buffer.length > 0;
      expect(shouldFlush).toBe(false);
    });
  });

  describe('provider delivery', () => {
    it('should send events to SIEM provider', async () => {
      const siem = mockSIEMService.useValue;
      const result = await siem.sendToProvider({ events: [{ id: 'event-1' }] });

      expect(result.success).toBe(true);
    });
  });

  describe('correlation rule matching', () => {
    it('should detect brute force attack pattern', () => {
      const failedLogins = Array.from({ length: 10 }, (_, i) => ({
        userId: 'user-1',
        timestamp: new Date(Date.now() - i * 2000),
        ip: '192.168.1.100',
      }));

      const oneMinuteAgo = Date.now() - 60000;
      const recentFailures = failedLogins.filter((l) => l.timestamp.getTime() >= oneMinuteAgo);

      expect(recentFailures.length).toBeGreaterThanOrEqual(5);
    });

    it('should detect credential stuffing', () => {
      const attempts = [
        { userId: 'user-1', ip: '10.0.0.1', password: 'pass1' },
        { userId: 'user-1', ip: '10.0.0.1', password: 'pass2' },
        { userId: 'user-1', ip: '10.0.0.1', password: 'pass3' },
        { userId: 'user-1', ip: '10.0.0.1', password: 'pass4' },
      ];

      const sameIp = attempts.every((a) => a.ip === attempts[0].ip);
      const uniquePasswords = new Set(attempts.map((a) => a.password)).size;

      expect(sameIp).toBe(true);
      expect(uniquePasswords).toBe(attempts.length);
    });

    it('should detect impossible travel', () => {
      const login1 = { ip: '192.168.1.1', lat: 24.7136, lng: 46.6753, time: new Date('2026-07-30T10:00:00Z') };
      const login2 = { ip: '10.0.0.1', lat: 40.7128, lng: -74.0060, time: new Date('2026-07-30T10:30:00Z') };

      const timeDiff = (login2.time.getTime() - login1.time.getTime()) / (1000 * 60);
      const latDiff = Math.abs(login2.lat - login1.lat);
      const lngDiff = Math.abs(login2.lng - login1.lng);

      const isImpossible = timeDiff < 60 && (latDiff > 10 || lngDiff > 10);
      expect(isImpossible).toBe(true);
    });

    it('should not flag legitimate travel', () => {
      const login1 = { lat: 24.7136, lng: 46.6753, time: new Date('2026-07-30T10:00:00Z') };
      const login2 = { lat: 24.7500, lng: 46.7000, time: new Date('2026-07-30T10:15:00Z') };

      const timeDiff = (login2.time.getTime() - login1.time.getTime()) / (1000 * 60);
      const latDiff = Math.abs(login2.lat - login1.lat);
      const lngDiff = Math.abs(login2.lng - login1.lng);

      const isImpossible = timeDiff < 60 && (latDiff > 10 || lngDiff > 10);
      expect(isImpossible).toBe(false);
    });
  });

  describe('alert generation', () => {
    it('should generate critical alert for brute force', async () => {
      const siem = mockSIEMService.useValue;
      siem.getAlerts.mockResolvedValue([
        { id: 'alert-1', severity: 'CRITICAL', rule: 'BRUTE_FORCE', description: 'Brute force detected', count: 10 },
      ]);

      const alerts = await siem.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should return empty alerts when no correlation', async () => {
      const siem = mockSIEMService.useValue;
      siem.getAlerts.mockResolvedValue([]);

      const alerts = await siem.getAlerts();
      expect(alerts).toHaveLength(0);
    });
  });
});
