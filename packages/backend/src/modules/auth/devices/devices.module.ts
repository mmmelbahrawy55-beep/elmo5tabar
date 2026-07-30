import { Module, forwardRef } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { AuthModule } from '../auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DevicesModule {}
