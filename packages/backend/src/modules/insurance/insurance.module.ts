import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { InsuranceController } from './controllers/insurance.controller';
import { InsuranceService } from './services/insurance.service';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
