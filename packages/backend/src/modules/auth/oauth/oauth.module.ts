import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { OAuthService } from './oauth.service';
import { GoogleOAuthProvider } from './providers/google-oauth.provider';
import { AppleOAuthProvider } from './providers/apple-oauth.provider';
import { FacebookOAuthProvider } from './providers/facebook-oauth.provider';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
    CacheModule.register(),
  ],
  providers: [
    GoogleOAuthProvider,
    AppleOAuthProvider,
    FacebookOAuthProvider,
    OAuthService,
  ],
  exports: [OAuthService],
})
export class OAuthModule {}
