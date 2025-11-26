import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserRepository } from '../users/interfaces/user.repository.interface';
import { IRefreshTokenRepository } from './interfaces/refresh-token.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(TOKENS.UserRepo)
    private readonly userRepo: IUserRepository,
    @Inject(TOKENS.RefreshTokenRepo)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private jwt: JwtService,
  ) {}

  // async register(
  //   email: string,
  //   password: string,
  //   role: 'USER' | 'ADMIN' = 'USER',
  // ) {
  //   const passwordHash = await bcrypt.hash(password, 12);
  //   const user = await this.userRepo.create({ email, passwordHash, role });

  //   return this.issueTokens(user.id, user.role);
  // }

  async login(email: string, password: string) {
    console.log(email, password);
    const user = await this.userRepo.findByEmail(email);

    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.role);
  }

  private async issueTokens(userId: string, role: 'USER' | 'ADMIN') {
    const jti = randomUUID();
    await this.refreshTokenRepo.create({ userId, tokenId: jti });

    const access = await this.jwt.signAsync(
      { sub: userId, role },
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

  async refresh(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });
    const token = await this.refreshTokenRepo.findByTokenId(payload.jti);

    if (!token || token.revokedAt) throw new UnauthorizedException();
    const user = await this.userRepo.findById(payload.sub);

    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.role);
  }

  async revoke(refreshToken: string) {
    const payload: any = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.JWT_SECRET!,
    });

    await this.refreshTokenRepo.revoke(payload.jti);

    return { ok: true };
  }
}
