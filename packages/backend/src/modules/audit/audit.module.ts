import { Module, Global } from '@nestjs/common';
import { AuditService } from '../auth/audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
