import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the metadata set by the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified for the route, it's accessible to everyone (after JWT auth)
    if (!requiredRoles) {
      return true;
    }

    // Get the user object from the request (populated by JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // Check if the user has at least one of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}