import { Module, forwardRef } from '@nestjs/common';
import { DataEncryptionService } from './data-encryption.service';
import { GDPRService } from './gdpr.service';
import { HIPAAService } from './hipaa.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../lib/prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  providers: [DataEncryptionService, GDPRService, HIPAAService],
  exports: [DataEncryptionService, GDPRService, HIPAAService],
})
export class ComplianceModule {}
