import {
  SetMetadata,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const required = Reflect.getMetadata('roles', ctx.getHandler()) as
      | string[]
      | undefined;
    if (!required?.length) return true;
    const req = ctx.switchToHttp().getRequest();
    return required.includes(req.user?.role);
  }
}
