import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OAuthTokens { accessToken: string; refreshToken?: string; expiresIn: number; }
export interface OAuthProfile { id: string; email: string; name: string; avatar?: string; provider: string; }

@Injectable()
export class GoogleOAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = ['openid', 'email', 'profile'];

  constructor(private config: ConfigService, private http: HttpService) {
    this.clientId = this.config.getOrThrow('GOOGLE_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.config.getOrThrow('GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/v1/auth/oauth/google/callback');
  }

  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code',
      scope: this.scopes.join(' '), state, code_challenge: codeChallenge, code_challenge_method: 'S256',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
    const { data } = await firstValueFrom(this.http.post('https://oauth2.googleapis.com/token', {
      code, client_id: this.clientId, client_secret: this.clientSecret,
      redirect_uri: this.redirectUri, grant_type: 'authorization_code', code_verifier: codeVerifier,
    }));
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async getUserInfo(accessToken: string): Promise<OAuthProfile> {
    const { data } = await firstValueFrom(this.http.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }));
    return { id: data.id, email: data.email, name: data.name, avatar: data.picture, provider: 'google' };
  }
}
