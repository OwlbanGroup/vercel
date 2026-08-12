import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Custom decorator to assign roles to a route
// Usage: @Roles('admin', 'moderator')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);