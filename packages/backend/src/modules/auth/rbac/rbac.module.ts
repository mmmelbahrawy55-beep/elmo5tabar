import { Module, forwardRef } from '@nestjs/common';
import { RBACService } from './rbac.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuthModule } from '../auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [RBACService, PermissionGuard],
  exports: [RBACService, PermissionGuard],
})
export class RBACModule {}
