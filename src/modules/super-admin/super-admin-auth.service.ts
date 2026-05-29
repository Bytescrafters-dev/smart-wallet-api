import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { TOKENS } from 'src/common/constants/tokens';
import { ISuperAdminRepository } from './interfaces/super-admin.repository.interface';
import { ISuperAdminRefreshTokenRepository } from './interfaces/super-admin-refresh-token.repository.interface';
import { SuperAdmin } from '@prisma/client';

@Injectable()
export class SuperAdminAuthService {
  constructor(
    @Inject(TOKENS.SuperAdminRepo)
    private readonly superAdminRepo: ISuperAdminRepository,
    @Inject(TOKENS.SuperAdminRefreshTokenRepo)
    private readonly refreshTokenRepo: ISuperAdminRefreshTokenRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.superAdminRepo.findByEmail(email);
    if (!admin || admin.status === 'INACTIVE')
      throw new UnauthorizedException();

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException();

    const tokens = await this.issueTokens(admin.id, admin.role);
    return { ...tokens, mustChangePassword: admin.mustChangePassword };
  }

  async refresh(refreshToken: string) {
    const payload: any = await this.jwt
      .verifyAsync(refreshToken, { secret: process.env.JWT_SECRET! })
      .catch(() => {
        throw new UnauthorizedException();
      });

    const token = await this.refreshTokenRepo.findByTokenId(payload.jti);
    if (!token || token.revokedAt) throw new UnauthorizedException();

    const admin = await this.superAdminRepo.findById(payload.sub);
    if (!admin || admin.status === 'INACTIVE')
      throw new UnauthorizedException();

    await this.refreshTokenRepo.revoke(payload.jti);
    return this.issueTokens(admin.id, admin.role);
  }

  async logout(refreshToken: string) {
    const payload: any = await this.jwt
      .verifyAsync(refreshToken, { secret: process.env.JWT_SECRET! })
      .catch(() => {
        throw new UnauthorizedException();
      });
    await this.refreshTokenRepo.revoke(payload.jti);
    return { ok: true };
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const admin = await this.superAdminRepo.findById(adminId);
    if (!admin) throw new UnauthorizedException();

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.superAdminRepo.updatePassword(adminId, newHash);

    await this.refreshTokenRepo.revokeAllForAdmin(adminId);
    return this.issueTokens(adminId, admin.role);
  }

  private async issueTokens(adminId: string, role: string) {
    const jti = randomUUID();
    await this.refreshTokenRepo.create({ superAdminId: adminId, tokenId: jti });

    const access = await this.jwt.signAsync(
      { sub: adminId, type: 'super_admin', role },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES || '15m',
      },
    );

    const refresh = await this.jwt.signAsync(
      { sub: adminId, jti },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: `${process.env.REFRESH_EXPIRES_DAYS || 30}d`,
      },
    );

    return { access, refresh };
  }

  async getAdminUserById(
    userId: string,
  ): Promise<Omit<SuperAdmin, 'passwordHash'> | null> {
    const adminUser = await this.superAdminRepo.findById(userId);

    if (!adminUser) return null;

    const { passwordHash: _, ...rest } = adminUser;
    return rest;
  }

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    await this.superAdminRepo.updateAvatar(userId, avatar);
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<Omit<SuperAdmin, 'passwordHash'>> {
    return this.superAdminRepo.updateProfile(userId, data);
  }
}
