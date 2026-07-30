import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../lib/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import { GoogleOAuthProvider, OAuthProfile } from './providers/google-oauth.provider';
import { AppleOAuthProvider } from './providers/apple-oauth.provider';
import { FacebookOAuthProvider } from './providers/facebook-oauth.provider';
import { OAuthProviderEnum } from './dto/oauth.dto';

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly googleProvider: GoogleOAuthProvider,
    private readonly appleProvider: AppleOAuthProvider,
    private readonly facebookProvider: FacebookOAuthProvider,
  ) {}

  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  getAuthorizationUrl(provider: OAuthProviderEnum, redirectUri?: string): { url: string; state: string; codeVerifier?: string } {
    const state = this.generateState();

    switch (provider) {
      case OAuthProviderEnum.GOOGLE: {
        const { codeVerifier, codeChallenge } = this.generatePKCE();
        const url = this.googleProvider.getAuthorizationUrl(state, codeChallenge);
        return { url, state, codeVerifier };
      }
      case OAuthProviderEnum.APPLE: {
        const url = this.appleProvider.getAuthorizationUrl(state);
        return { url, state };
      }
      case OAuthProviderEnum.FACEBOOK: {
        const url = this.facebookProvider.getAuthorizationUrl(state);
        return { url, state };
      }
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }
  }

  async handleCallback(
    provider: OAuthProviderEnum,
    code: string,
    state: string,
    codeVerifier?: string,
    idToken?: string,
  ): Promise<{ user: any; token: string }> {
    let profile: OAuthProfile;

    switch (provider) {
      case OAuthProviderEnum.GOOGLE: {
        if (!codeVerifier) {
          throw new BadRequestException('code_verifier is required for Google OAuth');
        }
        const tokens = await this.googleProvider.exchangeCode(code, codeVerifier);
        profile = await this.googleProvider.getUserInfo(tokens.accessToken);
        break;
      }
      case OAuthProviderEnum.APPLE: {
        if (!idToken) {
          throw new BadRequestException('id_token is required for Apple OAuth');
        }
        const result = await this.appleProvider.handleCallback(idToken);
        profile = result.profile;
        break;
      }
      case OAuthProviderEnum.FACEBOOK: {
        const tokens = await this.facebookProvider.exchangeCode(code);
        profile = await this.facebookProvider.getUserInfo(tokens.accessToken);
        break;
      }
      default:
        throw new BadRequestException(`Unsupported OAuth provider: ${provider}`);
    }

    const user = await this.findOrCreateUser(profile);
    const token = await this.generateAuthToken(user.id);

    return { user, token };
  }

  async linkAccount(userId: string, provider: OAuthProviderEnum, code: string, state: string, codeVerifier?: string): Promise<void> {
    let profile: OAuthProfile;

    switch (provider) {
      case OAuthProviderEnum.GOOGLE: {
        if (!codeVerifier) {
          throw new BadRequestException('code_verifier is required for Google OAuth');
        }
        const tokens = await this.googleProvider.exchangeCode(code, codeVerifier);
        profile = await this.googleProvider.getUserInfo(tokens.accessToken);
        break;
      }
      case OAuthProviderEnum.FACEBOOK: {
        const tokens = await this.facebookProvider.exchangeCode(code);
        profile = await this.facebookProvider.getUserInfo(tokens.accessToken);
        break;
      }
      default:
        throw new BadRequestException(`Cannot link provider: ${provider}`);
    }

    const existingLink = await (this.prisma as any).oAuthProvider.findUnique({
      where: { provider_providerId: { provider: provider, providerId: profile.id } },
    });

    if (existingLink && existingLink.userId !== userId) {
      throw new ConflictException('This account is already linked to another user');
    }

    if (existingLink) {
      return;
    }

    await (this.prisma as any).oAuthProvider.create({
      data: {
        userId,
        provider: provider,
        providerId: profile.id,
        email: profile.email,
        accessToken: null,
        refreshToken: null,
      },
    });
  }

  async unlinkAccount(userId: string, provider: OAuthProviderEnum): Promise<void> {
    const providerLink = await (this.prisma as any).oAuthProvider.findFirst({
      where: { userId, provider: provider },
    });

    if (!providerLink) {
      throw new BadRequestException(`No ${provider} account linked`);
    }

    const totalProviders = await (this.prisma as any).oAuthProvider.count({
      where: { userId },
    });

    if (totalProviders <= 1) {
      throw new BadRequestException('Cannot unlink the last OAuth provider. Set a password first.');
    }

    await (this.prisma as any).oAuthProvider.delete({
      where: { id: providerLink.id },
    });
  }

  async getConnectedProviders(userId: string): Promise<{ provider: string; email: string; linkedAt: Date }[]> {
    const providers = await (this.prisma as any).oAuthProvider.findMany({
      where: { userId },
      select: { provider: true, email: true, createdAt: true },
    });

    return providers.map((p) => ({
      provider: p.provider,
      email: p.email,
      linkedAt: p.createdAt,
    }));
  }

  async findOrCreateUser(profile: OAuthProfile): Promise<any> {
    const existingProvider = await (this.prisma as any).oAuthProvider.findUnique({
      where: { provider_providerId: { provider: profile.provider, providerId: profile.id } },
    });

    if (existingProvider) {
      return this.prisma.user.findUnique({ where: { id: existingProvider.userId } });
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      await (this.prisma as any).oAuthProvider.create({
        data: {
          userId: existingUser.id,
          provider: profile.provider,
          providerId: profile.id,
          email: profile.email,
          accessToken: null,
          refreshToken: null,
        },
      });
      return existingUser;
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: profile.email,
          passwordHash: '',
          role: 'PATIENT',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          firstNameAr: profile.name || profile.email.split('@')[0],
          lastNameAr: '',
          firstNameEn: profile.name || profile.email.split('@')[0],
          lastNameEn: '',
        },
      });

      await (tx as any).oAuthProvider.create({
        data: {
          userId: user.id,
          provider: profile.provider,
          providerId: profile.id,
          email: profile.email,
          accessToken: null,
          refreshToken: null,
        },
      });

      return user;
    });
  }

  private async generateAuthToken(userId: string): Promise<string> {
    return this.jwt.sign({ sub: userId });
  }
}
