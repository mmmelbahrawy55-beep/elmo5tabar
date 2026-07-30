import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BranchesController } from './controllers/branches.controller';
import { BranchesService } from './services/branches.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
