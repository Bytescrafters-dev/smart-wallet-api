import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserRepository } from '../users/interfaces/user.repository.interface';
import { IRefreshTokenRepository } from './interfaces/refresh-token.repository.interface';
import { IStoreUserRepository } from '../store-users/interfaces/store-user.repository.interface';
import { IStoreUserRefreshTokenRepository } from './interfaces/store-user-refresh-token.repository.interface';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';
import { CartService } from '../orders/cart.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKENS.UserRepo)
    private readonly userRepo: IUserRepository,
    @Inject(TOKENS.RefreshTokenRepo)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    @Inject(TOKENS.StoreUserRepo)
    private readonly storeUserRepo: IStoreUserRepository,
    @Inject(TOKENS.StoreUserRefreshTokenRepo)
    private readonly storeUserRefreshTokenRepo: IStoreUserRefreshTokenRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
    private readonly jwt: JwtService,
    private readonly cartService: CartService,
  ) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminLogin(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();

    const stores = await this.storeRepo.findByAdminUserId(user.id);

    return this.issueAdminTokens(user.id, stores);
  }

  private async issueAdminTokens(
    userId: string,
    stores: { id: string; name: string; slug: string }[],
  ) {
    const jti = randomUUID();
    await this.refreshTokenRepo.create({ userId, tokenId: jti });

    const access = await this.jwt.signAsync(
      { sub: userId, type: 'admin', stores },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES || '15m',
      },
    );

    const refresh = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: `${process.env.REFRESH_EXPIRES_DAYS || 30}d`,
      },
    );

    return { access, refresh };
  }

  async adminRefresh(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });
    const token = await this.refreshTokenRepo.findByTokenId(payload.jti);
    if (!token || token.revokedAt) throw new UnauthorizedException();

    const user = await this.userRepo.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    const stores = await this.storeRepo.findByAdminUserId(user.id);
    return this.issueAdminTokens(user.id, stores);
  }

  async adminRevoke(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });
    await this.refreshTokenRepo.revoke(payload.jti);
    return { ok: true };
  }

  // ── Store User ─────────────────────────────────────────────────────────────

  async storeUserLogin(
    email: string,
    password: string,
    storeSlug: string,
    merge?: { sessionId: string },
  ) {
    console.log(storeSlug, email, password, merge);
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    const storeUser = await this.storeUserRepo.findByStoreAndEmail(
      store.id,
      email,
    );

    console.log(storeUser);
    if (!storeUser) throw new UnauthorizedException();

    const ok = await bcrypt.compare(password, storeUser.passwordHash);
    if (!ok) throw new UnauthorizedException();

    if (merge?.sessionId) {
      await this.cartService.mergeOnLogin(
        merge.sessionId,
        storeUser.id,
        store.id,
      );
    }

    return this.issueStoreUserTokens(storeUser.id, store.id);
  }

  async storeUserSignup(
    storeSlug: string,
    data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.storeUserRepo.findByStoreAndEmail(
      store.id,
      data.email,
    );
    if (existing)
      throw new ConflictException('Email already registered for this store');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const storeUser = await this.storeUserRepo.create({
      storeId: store.id,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.issueStoreUserTokens(storeUser.id, store.id);
  }

  private async issueStoreUserTokens(storeUserId: string, storeId: string) {
    const jti = randomUUID();
    await this.storeUserRefreshTokenRepo.create({ storeUserId, tokenId: jti });

    const access = await this.jwt.signAsync(
      { sub: storeUserId, type: 'store_user', storeId },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES || '15m',
      },
    );

    const refresh = await this.jwt.signAsync(
      { sub: storeUserId, jti },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: `${process.env.REFRESH_EXPIRES_DAYS || 30}d`,
      },
    );

    return { access, refresh };
  }

  async storeUserRefresh(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });
    const token = await this.storeUserRefreshTokenRepo.findByTokenId(
      payload.jti,
    );
    if (!token || token.revokedAt) throw new UnauthorizedException();

    const storeUser = await this.storeUserRepo.findById(payload.sub);
    if (!storeUser) throw new UnauthorizedException();

    return this.issueStoreUserTokens(storeUser.id, storeUser.storeId);
  }

  async storeUserRevoke(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });
    await this.storeUserRefreshTokenRepo.revoke(payload.jti);
    return { ok: true };
  }
}
