import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Auth - Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ApiOperation({ summary: 'Get registered devices' })
  async getDevices(@Request() req: any) {
    return this.deviceService.getDevices(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove device' })
  async removeDevice(@Request() req: any, @Param('id') deviceId: string) {
    return this.deviceService.removeDevice(req.user.userId, deviceId);
  }

  @Patch(':id/trust')
  @ApiOperation({ summary: 'Toggle device trust' })
  async toggleTrust(
    @Request() req: any,
    @Param('id') deviceId: string,
    @Body('trusted') trusted: boolean,
  ) {
    if (trusted) {
      return this.deviceService.trustDevice(req.user.userId, deviceId);
    }
    return this.deviceService.untrustDevice(req.user.userId, deviceId);
  }
}
