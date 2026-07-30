import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResultsController } from './controllers/results.controller';
import { AdvancedResultsController } from './controllers/advanced-results.controller';
import { ResultsService } from './services/results.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { DigitalSignatureService } from './services/digital-signature.service';
import { VerificationService } from './services/verification.service';
import { EncryptionService } from './services/encryption.service';
import { CriticalAlertService } from './services/critical-alert.service';
import { AiExplanationService } from './services/ai-explanation.service';
import { DoctorNotesService } from './services/doctor-notes.service';
import { AttachmentService } from './services/attachment.service';
import { ShareLinkService } from './services/share-link.service';
import { HistoricalComparisonService } from './services/historical-comparison.service';
import { TimelineService } from './services/timeline.service';
import { AuditTrailService } from './services/audit-trail.service';
import { ResultsGateway } from './gateway/results.gateway';

@Module({
  imports: [PrismaModule, CacheModule, forwardRef(() => NotificationsModule)],
  controllers: [ResultsController, AdvancedResultsController],
  providers: [
    ResultsService,
    PdfGeneratorService,
    DigitalSignatureService,
    VerificationService,
    EncryptionService,
    CriticalAlertService,
    AiExplanationService,
    DoctorNotesService,
    AttachmentService,
    ShareLinkService,
    HistoricalComparisonService,
    TimelineService,
    AuditTrailService,
    ResultsGateway,
  ],
  exports: [ResultsService, PdfGeneratorService, DigitalSignatureService, VerificationService, EncryptionService, CriticalAlertService, AiExplanationService, DoctorNotesService, AttachmentService, ShareLinkService, HistoricalComparisonService, TimelineService, AuditTrailService],
})
export class ResultsModule {}
