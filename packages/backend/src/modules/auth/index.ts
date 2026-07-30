// Auth barrel export
export { AuthModule } from './auth.module';
export { AuthService } from './services/auth.service';
export { AuthController } from './controllers/auth.controller';
export { JwtStrategy } from './strategies/jwt.strategy';
export { LocalStrategy } from './strategies/local.strategy';

// MFA
export { MFAModule } from './mfa/mfa.module';
export { OTPService } from './mfa/otp.service';
export { TwoFactorService } from './mfa/two-factor.service';
export { SMSProvider } from './mfa/sms.provider';
export { EmailProvider } from './mfa/email.provider';

// Devices
export { DevicesModule } from './devices/devices.module';
export { DeviceService } from './devices/device.service';
export { DeviceController } from './devices/device.controller';

// RBAC
export { RBACModule } from './rbac/rbac.module';
export { RBACService } from './rbac/rbac.service';
export { PermissionGuard } from './rbac/guards/permission.guard';

// OAuth
export { OAuthModule } from './oauth/oauth.module';
export { OAuthService } from './oauth/oauth.service';
export { GoogleOAuthProvider } from './oauth/providers/google-oauth.provider';
export { AppleOAuthProvider } from './oauth/providers/apple-oauth.provider';
export { FacebookOAuthProvider } from './oauth/providers/facebook-oauth.provider';
