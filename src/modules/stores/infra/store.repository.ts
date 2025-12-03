import { Injectable } from '@nestjs/common';
import { Store } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IStoreRepository } from '../interfaces/store.repository.interface';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    return this.prisma.store.create({ data });
  }

  async findById(id: string): Promise<Store | null> {
    return this.prisma.store.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Store | null> {
    return this.prisma.store.findUnique({ where: { slug } });
  }

  async findAll(): Promise<Store[]> {
    return this.prisma.store.findMany();
  }

  async updateById(id: string, data: Partial<Omit<Store, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Store> {
    return this.prisma.store.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.store.delete({ where: { id } });
  }
}