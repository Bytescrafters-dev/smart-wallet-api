import { Injectable } from '@nestjs/common';
import { SuperAdminRefreshToken } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ISuperAdminRefreshTokenRepository } from '../interfaces/super-admin-refresh-token.repository.interface';

@Injectable()
export class SuperAdminRefreshTokenRepository
  implements ISuperAdminRefreshTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    superAdminId: string;
    tokenId: string;
  }): Promise<SuperAdminRefreshToken> {
    return this.prisma.superAdminRefreshToken.create({ data });
  }

  findByTokenId(tokenId: string): Promise<SuperAdminRefreshToken | null> {
    return this.prisma.superAdminRefreshToken.findUnique({
      where: { tokenId },
    });
  }

  async revoke(tokenId: string): Promise<void> {
    await this.prisma.superAdminRefreshToken.update({
      where: { tokenId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForAdmin(superAdminId: string): Promise<void> {
    await this.prisma.superAdminRefreshToken.updateMany({
      where: { superAdminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
