import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './services/departments.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
