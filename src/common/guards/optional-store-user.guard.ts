import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalStoreUserGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    // don't throw — just return null for guests
    return user?.type === 'store_user' ? user : null;
  }
}
