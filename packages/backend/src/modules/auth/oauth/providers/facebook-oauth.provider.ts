import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookOAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private config: ConfigService, private http: HttpService) {
    this.clientId = this.config.getOrThrow('FACEBOOK_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow('FACEBOOK_CLIENT_SECRET');
    this.redirectUri = this.config.getOrThrow('FACEBOOK_REDIRECT_URI', 'http://localhost:3001/api/v1/auth/oauth/facebook/callback');
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code',
      scope: 'email,public_profile', state, display: 'popup',
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<import('./google-oauth.provider').OAuthTokens> {
    const { data } = await firstValueFrom(this.http.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: this.clientId, client_secret: this.clientSecret, redirect_uri: this.redirectUri, code },
    }));
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  async getUserInfo(accessToken: string): Promise<import('./google-oauth.provider').OAuthProfile> {
    const { data } = await firstValueFrom(this.http.get('https://graph.facebook.com/v18.0/me', {
      params: { fields: 'id,name,email,picture.type(large)', access_token: accessToken },
    }));
    return { id: data.id, email: data.email, name: data.name, avatar: data.picture?.data?.url, provider: 'facebook' };
  }
}
