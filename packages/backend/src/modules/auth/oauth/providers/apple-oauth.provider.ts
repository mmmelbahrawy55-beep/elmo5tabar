import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

@Injectable()
export class AppleOAuthProvider {
  private readonly clientId: string;
  private readonly teamId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private readonly redirectUri: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private config: ConfigService) {
    this.clientId = this.config.getOrThrow('APPLE_CLIENT_ID');
    this.teamId = this.config.getOrThrow('APPLE_TEAM_ID');
    this.keyId = this.config.getOrThrow('APPLE_KEY_ID');
    this.privateKey = this.config.getOrThrow('APPLE_PRIVATE_KEY');
    this.redirectUri = this.config.getOrThrow('APPLE_REDIRECT_URI', 'http://localhost:3001/api/v1/auth/oauth/apple/callback');
    this.jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code id_token',
      scope: 'name email', response_mode: 'form_post', state,
    });
    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async handleCallback(idToken: string, user?: { firstName?: string; lastName?: string }): Promise<{ profile: import('./google-oauth.provider').OAuthProfile; email: string }> {
    const { payload } = await jwtVerify(idToken, this.jwks, { audience: this.clientId, issuer: 'https://appleid.apple.com' });
    const email = payload.email as string;
    const sub = payload.sub as string;
    return {
      profile: { id: sub, email, name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : email.split('@')[0], provider: 'apple' },
      email,
    };
  }
}
