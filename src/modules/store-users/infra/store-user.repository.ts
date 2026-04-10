import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IStoreUserRepository } from '../interfaces/store-user.repository.interface';

@Injectable()
export class StoreUserRepository implements IStoreUserRepository {
  constructor(private prisma: PrismaService) {}

  findByStoreAndEmail(storeId: string, email: string) {
    return this.prisma.storeUser.findUnique({
      where: { storeId_email: { storeId, email } },
    });
  }

  findById(id: string) {
    return this.prisma.storeUser.findUnique({ where: { id } });
  }

  create(data: {
    storeId: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.prisma.storeUser.create({ data });
  }

  async updateAvatar(id: string, avatar: string): Promise<void> {
    await this.prisma.storeUser.update({ where: { id }, data: { avatar } });
  }
}
