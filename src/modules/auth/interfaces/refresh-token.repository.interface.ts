import { RefreshToken } from '@prisma/client';

export interface IRefreshTokenRepository {
  create(
    data: Omit<RefreshToken, 'id' | 'createdAt' | 'revokedAt'>,
  ): Promise<RefreshToken | null>;
  revoke(tokenId: string): Promise<RefreshToken | null>;
  findByTokenId(tokenId: string): Promise<RefreshToken | null>;
}
