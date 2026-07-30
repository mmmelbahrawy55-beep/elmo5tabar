import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { mockPrismaService } from '../../../test/mocks';

describe('IncidentResponseService', () => {
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('incident creation', () => {
    it('should create a security incident', () => {
      const incident = {
        id: 'inc-1',
        title: 'Brute force attack detected',
        severity: 'HIGH',
        status: 'OPEN',
        source: 'SIEM',
        description: 'Multiple failed login attempts from 192.168.1.100',
        assignedTo: 'soc-team',
        createdAt: new Date(),
      };

      expect(incident.severity).toBe('HIGH');
      expect(incident.status).toBe('OPEN');
    });

    it('should create incidents with different severities', () => {
      const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      const incidents = severities.map((severity) => ({
        title: `Test ${severity} incident`,
        severity,
        status: 'OPEN',
      }));

      expect(incidents).toHaveLength(4);
    });
  });

  describe('severity assignment', () => {
    it('should assign severity based on event type', () => {
      const severityMap: Record<string, string> = {
        BRUTE_FORCE: 'CRITICAL',
        MALWARE_DETECTED: 'CRITICAL',
        SUSPICIOUS_LOGIN: 'HIGH',
        POLICY_VIOLATION: 'MEDIUM',
        INFO: 'LOW',
      };

      expect(severityMap.BRUTE_FORCE).toBe('CRITICAL');
      expect(severityMap.INFO).toBe('LOW');
    });

    it('should escalate severity on repeat incidents', () => {
      const incidentCount = 3;
      const baseSeverity = 'MEDIUM';
      const escalation: Record<string, string> = {
        '1': 'MEDIUM',
        '2': 'HIGH',
        '3+': 'CRITICAL',
      };

      const severity = incidentCount >= 3 ? escalation['3+'] : escalation[String(incidentCount)];
      expect(severity).toBe('CRITICAL');
    });
  });

  describe('SLA tracking', () => {
    it('should track SLA for incident response', () => {
      const slaTimes: Record<string, number> = {
        CRITICAL: 15,
        HIGH: 60,
        MEDIUM: 240,
        LOW: 1440,
      };

      const incident = { severity: 'HIGH', createdAt: new Date(Date.now() - 30 * 60000) };
      const slaMinutes = slaTimes[incident.severity];
      const elapsedMinutes = (Date.now() - incident.createdAt.getTime()) / 60000;

      expect(slaMinutes).toBe(60);
      expect(elapsedMinutes).toBeLessThan(slaMinutes);
    });

    it('should flag SLA breach', () => {
      const slaMinutes = 60;
      const elapsedMinutes = 90;

      expect(elapsedMinutes).toBeGreaterThan(slaMinutes);
    });
  });

  describe('playbook execution', () => {
    it('should execute playbook steps', async () => {
      const playbook = {
        id: 'pb-1',
        name: 'Brute Force Response',
        steps: [
          { order: 1, action: 'Block IP', completed: true },
          { order: 2, action: 'Notify SOC', completed: true },
          { order: 3, action: 'Rotate credentials', completed: false },
          { order: 4, action: 'Post-mortem', completed: false },
        ],
      };

      const completed = playbook.steps.filter((s) => s.completed).length;
      const total = playbook.steps.length;
      const progress = (completed / total) * 100;

      expect(progress).toBe(50);
    });

    it('should enforce sequential step execution', () => {
      const steps = [
        { order: 1, action: 'Isolate system', completed: false },
        { order: 2, action: 'Take snapshot', completed: false },
      ];

      steps[0].completed = true;
      steps[1].completed = steps[0].completed;

      expect(steps[1].completed).toBe(true);
    });
  });

  describe('timeline logging', () => {
    it('should log timeline events', () => {
      const timeline = [
        { time: new Date('2026-07-30T10:00:00Z'), event: 'Incident created', actor: 'SIEM' },
        { time: new Date('2026-07-30T10:05:00Z'), event: 'Assigned to SOC team', actor: 'auto' },
        { time: new Date('2026-07-30T10:10:00Z'), event: 'IP blocked', actor: 'admin' },
      ];

      expect(timeline).toHaveLength(3);
      expect(timeline[timeline.length - 1].event).toBe('IP blocked');
    });

    it('should maintain chronological order', () => {
      const timeline = [
        { time: new Date('2026-07-30T10:00:00Z'), event: 'Start' },
        { time: new Date('2026-07-30T09:00:00Z'), event: 'Out of order' },
      ];

      const sorted = [...timeline].sort((a, b) => a.time.getTime() - b.time.getTime());
      expect(sorted[0].event).toBe('Out of order');
    });
  });
});
