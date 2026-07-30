import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../rbac.service';
import { PrismaService } from '../../../../lib/prisma/prisma.service';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  module: string;
  action: string;
  resource?: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RBACService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const userId = user.userId || user.sub || user.id;
    if (!userId) {
      throw new UnauthorizedException('Invalid token: no user ID found');
    }

    const { granted, denied } = await this.rbac.checkAccess(userId, requiredPermissions);

    if (denied.length > 0) {
      const deniedPerms = denied.map((d) => d.split(':').slice(0, 2).join(':')).join(', ');
      this.logger.warn(
        `Permission denied for user ${userId}: ${deniedPerms}`,
      );

      await this.logPermissionDenied(userId, requiredPermissions, request);

      throw new ForbiddenException(
        `Missing permissions: ${deniedPerms}`,
      );
    }

    return true;
  }

  private async logPermissionDenied(
    userId: string,
    missingPermissions: RequiredPermission[],
    request: any,
  ): Promise<void> {
    try {
      const ip = request.ip || request.socket?.remoteAddress;
      const userAgent = request.headers?.['user-agent'];

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'PERMISSION_DENIED',
          entity: 'auth',
          newValues: {
            missingPermissions: missingPermissions.map(
              (p) => `${p.module}:${p.action}${p.resource ? `:${p.resource}` : ''}`,
            ),
          },
          ipAddress: ip,
          userAgent,
          severity: 'warning',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log permission denial: ${(error as Error).message}`);
    }
  }
}
