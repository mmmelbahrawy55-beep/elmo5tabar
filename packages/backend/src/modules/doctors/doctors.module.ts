import { Module } from '@nestjs/common';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DoctorsController } from './controllers/doctors.controller';
import { DoctorsService } from './services/doctors.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
