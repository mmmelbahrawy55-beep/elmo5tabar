import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { PackagesController } from './controllers/packages.controller';
import { PackagesService } from './services/packages.service';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
