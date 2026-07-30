import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BruteForceService } from './brute-force.service';
import { RateLimitService } from './rate-limit.service';
import { CSRFService } from './csrf.service';
import { SecurityMonitorService } from './security-monitor.service';
import { SIEMService } from './siem.service';
import { IncidentResponseService } from './incident-response.service';
import { BackupDRService } from './backup-dr.service';
import { KeyRotationService } from './key-rotation.service';
import { ComplianceChecklistService } from './compliance-checklist';
import { SecurityPoliciesService } from './security-policies.service';
import { WAFConfigService } from './waf/waf.config';
import { SecurityController } from './security.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../lib/prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule, ScheduleModule.forRoot()],
  controllers: [SecurityController],
  providers: [
    BruteForceService,
    RateLimitService,
    CSRFService,
    SecurityMonitorService,
    SIEMService,
    IncidentResponseService,
    BackupDRService,
    KeyRotationService,
    ComplianceChecklistService,
    SecurityPoliciesService,
    WAFConfigService,
  ],
  exports: [
    BruteForceService,
    RateLimitService,
    CSRFService,
    SecurityMonitorService,
    SIEMService,
    IncidentResponseService,
    BackupDRService,
    KeyRotationService,
    ComplianceChecklistService,
    SecurityPoliciesService,
    WAFConfigService,
  ],
})
export class SecurityModule {}
