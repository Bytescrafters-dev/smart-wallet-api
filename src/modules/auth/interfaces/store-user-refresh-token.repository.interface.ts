import { StoreUserRefreshToken } from '@prisma/client';

export interface IStoreUserRefreshTokenRepository {
  create(data: { storeUserId: string; tokenId: string }): Promise<StoreUserRefreshToken>;
  findByTokenId(tokenId: string): Promise<StoreUserRefreshToken | null>;
  revoke(tokenId: string): Promise<StoreUserRefreshToken>;
}
