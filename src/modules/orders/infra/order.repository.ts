import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  CreateOrderData,
  CreateOrderItemData,
  IOrderRepository,
  ListOrdersParams,
  OrderListParams,
  UpdateOrderData,
} from '../interfaces/order.repository.interface';

const ORDER_INCLUDE = {
  items: true,
  storeUser: {
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  confirmedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async generateOrderNumber(
    storeId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const seq = await tx.storeSequence.upsert({
      where: { storeId },
      create: { storeId, orderSeq: 1 },
      update: { orderSeq: { increment: 1 } },
      select: { orderSeq: true },
    });
    return `#${String(seq.orderSeq).padStart(5, '0')}`;
  }

  async create(
    data: CreateOrderData,
    items: CreateOrderItemData[],
    tx: Prisma.TransactionClient,
  ): Promise<Order> {
    return tx.order.create({
      data: {
        ...data,
        items: { create: items },
      },
    });
  }

  findById(id: string): Promise<any | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  async findByStore(
    storeId: string,
    params: ListOrdersParams,
  ): Promise<{ data: any[]; total: number }> {
    const { status, paymentStatus, q, page = 1, limit = 20 } = params;

    const where: any = { storeId };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (q) where.orderNumber = { contains: q, mode: 'insensitive' as const };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  async listOrders(params: OrderListParams): Promise<any[]> {
    const { storeId, status, paymentStatus, q, skip, take } = params;

    return this.prisma.order.findMany({
      where: {
        storeId,
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: 'insensitive' as const } },
                { customerName: { contains: q, mode: 'insensitive' as const } },
                {
                  customerPhone: { contains: q, mode: 'insensitive' as const },
                },
              ],
            }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        confirmedBy: { select: { id: true, firstName: true, lastName: true } },
        storeUser: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(params: Omit<OrderListParams, 'skip' | 'take'>): Promise<number> {
    const { storeId, status, paymentStatus, q } = params;

    return this.prisma.order.count({
      where: {
        storeId,
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: 'insensitive' as const } },
                { customerName: { contains: q, mode: 'insensitive' as const } },
                {
                  customerPhone: { contains: q, mode: 'insensitive' as const },
                },
              ],
            }
          : {}),
      },
    });
  }

  async update(
    id: string,
    data: UpdateOrderData,
    tx?: Prisma.TransactionClient,
  ): Promise<Order> {
    const client = tx ?? this.prisma;
    return client.order.update({ where: { id }, data });
  }

  async replaceItems(
    orderId: string,
    items: CreateOrderItemData[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.orderItem.createMany({
      data: items.map((item) => ({ orderId, ...item })),
    });
  }
}
