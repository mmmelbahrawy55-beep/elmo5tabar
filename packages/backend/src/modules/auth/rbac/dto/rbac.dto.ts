import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID to assign role to' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Role ID to assign' })
  @IsString()
  roleId: string;
}

export class GrantPermissionDto {
  @ApiProperty({ description: 'Role ID to grant permission to' })
  @IsString()
  roleId: string;

  @ApiProperty({ description: 'Permission ID to grant' })
  @IsString()
  permissionId: string;

  @ApiPropertyOptional({ description: 'Optional conditions for the permission' })
  @IsOptional()
  conditions?: Record<string, any>;
}

export class BulkAssignRolesDto {
  @ApiProperty({ type: [AssignRoleDto], description: 'Bulk role assignments' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignRoleDto)
  assignments: AssignRoleDto[];
}
