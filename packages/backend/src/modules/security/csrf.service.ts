import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../lib/prisma/prisma.service';

@Injectable()
export class CSRFService {
  private readonly logger = new Logger(CSRFService.name);
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateToken(sessionId: string): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    try {
      await (this.prisma as any).authCSRFToken.create({
        data: {
          sessionId,
          tokenHash,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error('Failed to generate CSRF token', error);
      throw error;
    }

    this.logger.debug(`CSRF token generated for session ${sessionId}`);
    return rawToken;
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    if (!token || !sessionId) {
      return false;
    }

    const tokenHash = this.hashToken(token);
    const now = new Date();

    try {
      const csrfToken = await (this.prisma as any).authCSRFToken.findFirst({
        where: {
          sessionId,
          tokenHash,
          expiresAt: { gt: now },
          usedAt: null,
        },
      });

      if (!csrfToken) {
        this.logger.warn(`Invalid or expired CSRF token for session ${sessionId}`);
        return false;
      }

      await (this.prisma as any).authCSRFToken.update({
        where: { id: csrfToken.id },
        data: { usedAt: now },
      });

      this.logger.debug(`CSRF token validated for session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to validate CSRF token', error);
      return false;
    }
  }

  async revokeSessionTokens(sessionId: string): Promise<void> {
    try {
      const result = await (this.prisma as any).authCSRFToken.deleteMany({
        where: { sessionId },
      });

      this.logger.log(
        `Revoked ${result.count} CSRF tokens for session ${sessionId}`,
      );
    } catch (error) {
      this.logger.error('Failed to revoke session CSRF tokens', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const result = await (this.prisma as any).authCSRFToken.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired CSRF tokens`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired CSRF tokens', error);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const sessions = await (this.prisma as any).authSession.findMany({
        where: { userId },
        select: { id: true },
      });

      const sessionIds = sessions.map((s: { id: string }) => s.id);

      if (sessionIds.length === 0) return;

      const result = await (this.prisma as any).authCSRFToken.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      this.logger.log(
        `Revoked ${result.count} CSRF tokens for user ${userId} across ${sessionIds.length} sessions`,
      );
    } catch (error) {
      this.logger.error('Failed to revoke all user CSRF tokens', error);
      throw error;
    }
  }

  async getTokenCount(sessionId: string): Promise<number> {
    try {
      return await (this.prisma as any).authCSRFToken.count({
        where: {
          sessionId,
          expiresAt: { gt: new Date() },
        },
      });
    } catch (error) {
      this.logger.error('Failed to count CSRF tokens', error);
      return 0;
    }
  }
}
