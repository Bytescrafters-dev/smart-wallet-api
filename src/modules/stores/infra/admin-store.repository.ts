import { Injectable } from '@nestjs/common';
import { Store } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IAdminStoreRepository } from '../interfaces/admin-store.repository.interface';

@Injectable()
export class AdminStoreRepository implements IAdminStoreRepository {
  constructor(private prisma: PrismaService) {}

  async findStoresByUserId(userId: string): Promise<Store[]> {
    const records = await this.prisma.adminStore.findMany({
      where: { userId },
      include: { store: true },
    });
    return records.map((r) => r.store);
  }
}
