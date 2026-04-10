import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IStoreUserRefreshTokenRepository } from '../interfaces/store-user-refresh-token.repository.interface';

@Injectable()
export class StoreUserRefreshTokenRepository implements IStoreUserRefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  create(data: { storeUserId: string; tokenId: string }) {
    return this.prisma.storeUserRefreshToken.create({ data });
  }

  findByTokenId(tokenId: string) {
    return this.prisma.storeUserRefreshToken.findUnique({ where: { tokenId } });
  }

  revoke(tokenId: string) {
    return this.prisma.storeUserRefreshToken.update({
      where: { tokenId },
      data: { revokedAt: new Date() },
    });
  }
}
