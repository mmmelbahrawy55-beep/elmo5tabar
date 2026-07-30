import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OTPService } from './otp.service';
import { TwoFactorService } from './two-factor.service';
import { SMSProvider } from './sms.provider';
import { EmailProvider } from './email.provider';
import { AuthModule } from '../auth.module';

@Module({
  imports: [HttpModule, forwardRef(() => AuthModule)],
  providers: [OTPService, TwoFactorService, SMSProvider, EmailProvider],
  exports: [OTPService, TwoFactorService],
})
export class MFAModule {}
