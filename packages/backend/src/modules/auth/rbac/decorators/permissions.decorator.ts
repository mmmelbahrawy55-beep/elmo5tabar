import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permission.guard';

export interface RequiredPermission {
  module: string;
  action: string;
  resource?: string;
}

export const Permissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
