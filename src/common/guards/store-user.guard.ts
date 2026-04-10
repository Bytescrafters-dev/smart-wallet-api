import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StoreUserGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest();
    if (user?.type !== 'store_user') throw new ForbiddenException();
    return true;
  }
}
