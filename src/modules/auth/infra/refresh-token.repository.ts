import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/common/prisma/prisma.service';
import { RefreshToken } from '@prisma/client';
import { IRefreshTokenRepository } from '../interfaces/refresh-token.repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Omit<RefreshToken, 'id' | 'createdAt'>,
  ): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.create({ data });
    return token;
  }

  async findByTokenId(tokenId: string): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenId },
    });
    return token;
  }

  async revoke(tokenId: string): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.update({
      where: { tokenId },
      data: { revokedAt: new Date() },
    });
    return token;
  }
}
