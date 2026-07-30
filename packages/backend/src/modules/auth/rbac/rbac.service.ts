import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../lib/prisma/prisma.service';

interface PermissionCheck {
  module: string;
  action: string;
  resource?: string;
}

interface PermissionWithConditions {
  id: string;
  module: string;
  action: string;
  resource: string | null;
  conditions: Record<string, unknown> | null;
}

interface PermissionMatrix {
  roles: Array<{
    id: string;
    name: string;
    isSystem: boolean;
    permissions: PermissionWithConditions[];
  }>;
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private readonly permissionCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async getRolePermissions(roleId: string): Promise<PermissionWithConditions[]> {
    if (!roleId) {
      throw new BadRequestException('Role ID is required');
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
      resource: rp.permission.resource,
      conditions: null,
    }));
  }

  async hasPermission(
    userId: string,
    module: string,
    action: string,
    resource?: string,
  ): Promise<boolean> {
    if (!userId || !module || !action) {
      throw new BadRequestException('User ID, module, and action are required');
    }

    const cacheKey = `perm:${userId}:${module}:${action}:${resource ?? '*'}`;
    const cached = this.getFromCache<boolean>(cacheKey);
    if (cached !== undefined) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roleId) {
      this.setCache(cacheKey, false);
      return false;
    }

    const permissions = await this.getRolePermissions(user.roleId);

    const matchingPermission = permissions.find(
      (p) =>
        p.module === module &&
        p.action === action &&
        (!resource || !p.resource || p.resource === resource),
    );

    let result = false;

    if (matchingPermission) {
      if (matchingPermission.conditions) {
        result = this.evaluateConditions(matchingPermission.conditions, user);
      } else {
        result = true;
      }
    }

    this.setCache(cacheKey, result);
    return result;
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    if (!userId || !role) {
      throw new BadRequestException('User ID and role are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role === role;
  }

  async checkAccess(
    userId: string,
    permissions: PermissionCheck[],
  ): Promise<{ granted: string[]; denied: string[] }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!permissions || permissions.length === 0) {
      return { granted: [], denied: [] };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roleId) {
      return { granted: [], denied: permissions.map((p) => `${p.module}:${p.action}:${p.resource ?? '*'}`) };
    }

    const rolePermissions = await this.getRolePermissions(user.roleId);
    const granted: string[] = [];
    const denied: string[] = [];

    for (const required of permissions) {
      const key = `${required.module}:${required.action}:${required.resource ?? '*'}`;
      const cacheKey = `access:${userId}:${key}`;
      const cached = this.getFromCache<boolean>(cacheKey);

      if (cached !== undefined) {
        if (cached) {
          granted.push(key);
        } else {
          denied.push(key);
        }
        continue;
      }

      const hasIt = rolePermissions.some(
        (p) =>
          p.module === required.module &&
          p.action === required.action &&
          (!required.resource || !p.resource || p.resource === required.resource),
      );

      if (hasIt) {
        granted.push(key);
        this.setCache(cacheKey, true);
      } else {
        denied.push(key);
        this.setCache(cacheKey, false);
      }
    }

    return { granted, denied };
  }

  async getUserPermissions(
    userId: string,
  ): Promise<Array<{ module: string; action: string; resource: string | null }>> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roleId) {
      return [];
    }

    const permissions = await this.getRolePermissions(user.roleId);

    return permissions.map((p) => ({
      module: p.module,
      action: p.action,
      resource: p.resource,
    }));
  }

  async getPermissionMatrix(): Promise<PermissionMatrix> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
          resource: rp.permission.resource,
          conditions: null,
        })),
      })),
    };
  }

  async assignRole(userId: string, roleId: string): Promise<{ message: string }> {
    if (!userId || !roleId) {
      throw new BadRequestException('User ID and Role ID are required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      const currentRole = user.roleId
        ? await this.prisma.role.findUnique({
            where: { id: user.roleId },
            select: { isSystem: true },
          })
        : null;

      if (currentRole?.isSystem) {
        throw new ForbiddenException(
          'Cannot downgrade from a system role to another system role',
        );
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
    });

    this.clearUserCache(userId);
    this.logger.log(`Role ${role.name} (${roleId}) assigned to user ${userId}`);
    return { message: `Role "${role.name}" assigned successfully` };
  }

  async removeRole(userId: string, roleId: string): Promise<{ message: string }> {
    if (!userId || !roleId) {
      throw new BadRequestException('User ID and Role ID are required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roleId !== roleId) {
      throw new NotFoundException('User does not have this role');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: null },
    });

    this.clearUserCache(userId);
    this.logger.log(`Role ${roleId} removed from user ${userId}`);
    return { message: 'Role removed successfully' };
  }

  async grantPermission(
    roleId: string,
    permissionId: string,
  ): Promise<any> {
    if (!roleId || !permissionId) {
      throw new BadRequestException('Role ID and Permission ID are required');
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify permissions of a system role');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    if (existing) {
      return existing;
    }

    const rolePermission = await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        granted: true,
      },
    });

    this.clearRoleCache(roleId);
    this.logger.log(
      `Permission ${permissionId} granted to role ${roleId}`,
    );
    return rolePermission;
  }

  async revokePermission(
    roleId: string,
    permissionId: string,
  ): Promise<{ message: string }> {
    if (!roleId || !permissionId) {
      throw new BadRequestException('Role ID and Permission ID are required');
    }

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify permissions of a system role');
    }

    const deleted = await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Permission not found on this role');
    }

    this.clearRoleCache(roleId);
    this.logger.log(`Permission ${permissionId} revoked from role ${roleId}`);
    return { message: 'Permission revoked successfully' };
  }

  async isSystemRole(roleId: string): Promise<boolean> {
    if (!roleId) {
      throw new BadRequestException('Role ID is required');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { isSystem: true },
    });

    return role?.isSystem ?? false;
  }

  async getUserEffectivePermissions(
    userId: string,
  ): Promise<
    Array<{
      module: string;
      action: string;
      resource: string | null;
      conditions: Record<string, unknown> | null;
      fromRole: string;
    }>
  > {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRelation: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roleRelation) {
      return [];
    }

    const permissionMap = new Map<
      string,
      {
        module: string;
        action: string;
        resource: string | null;
        conditions: Record<string, unknown> | null;
        fromRole: string;
      }
    >();

    for (const rp of user.roleRelation.permissions) {
      const key = `${rp.permission.module}:${rp.permission.action}:${rp.permission.resource ?? '*'}`;
      const existing = permissionMap.get(key);

      if (!existing) {
        permissionMap.set(key, {
          module: rp.permission.module,
          action: rp.permission.action,
          resource: rp.permission.resource,
          conditions: null,
          fromRole: user.roleRelation.name,
        });
      }
    }

    return Array.from(permissionMap.values());
  }

  private evaluateConditions(
    conditions: Record<string, unknown>,
    user: { roleId: string | null },
  ): boolean {
    return true;
  }

  private getFromCache<T>(key: string): T | undefined {
    const entry = this.permissionCache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.permissionCache.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  private setCache(key: string, data: any): void {
    this.permissionCache.set(key, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  private clearUserCache(userId: string): void {
    for (const key of this.permissionCache.keys()) {
      if (key.includes(userId)) {
        this.permissionCache.delete(key);
      }
    }
  }

  private clearRoleCache(roleId: string): void {
    for (const key of this.permissionCache.keys()) {
      if (key.includes(`role:${roleId}`) || key.includes(`perm:`) || key.includes(`access:`)) {
        this.permissionCache.delete(key);
      }
    }
  }
}
