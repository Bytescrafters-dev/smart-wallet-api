import { SuperAdminRefreshToken } from '@prisma/client';

export interface ISuperAdminRefreshTokenRepository {
  create(data: { superAdminId: string; tokenId: string }): Promise<SuperAdminRefreshToken>;
  findByTokenId(tokenId: string): Promise<SuperAdminRefreshToken | null>;
  revoke(tokenId: string): Promise<void>;
  revokeAllForAdmin(superAdminId: string): Promise<void>;
}
