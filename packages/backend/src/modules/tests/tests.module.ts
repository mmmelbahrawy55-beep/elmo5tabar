import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../lib/prisma/prisma.module';
import { TestsController } from './controllers/tests.controller';
import { TestsService } from './services/tests.service';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
