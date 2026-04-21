import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IAddressRepository } from '../interfaces/address.repository.interface';
import { Address } from '@prisma/client';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(private prisma: PrismaService) {}

  listByStoreUserId(storeUserId: string) {
    return this.prisma.address.findMany({
      where: { storeUserId },
    });
  }

  findById(id: string) {
    return this.prisma.address.findUnique({ where: { id } });
  }

  async create(data: {
    storeUserId: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    label?: string;
    isDefault: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { storeUserId: data.storeUserId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data });
  }

  async update(
    id: string,
    data: {
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      label?: string;
      isDefault: boolean;
    },
  ) {
    if (data.isDefault) {
      const address = await this.prisma.address.findUnique({
        where: { id },
      });

      if (!address) {
        throw new Error('Address not found');
      }

      if (address && address.isDefault) {
        return this.prisma.address.update({ where: { id }, data });
      }
      await this.prisma.address.updateMany({
        where: { storeUserId: address.storeUserId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id } });
  }
}
