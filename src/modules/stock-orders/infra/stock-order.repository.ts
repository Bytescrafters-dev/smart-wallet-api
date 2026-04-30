import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { StockOrder, StockOrderLine } from '@prisma/client';
import {
  CreateStockOrderData,
  CreateStockOrderLineData,
  IStockOrderRepository,
  StockOrderListParams,
  UpdateStockOrderData,
  UpdateStockOrderLineData,
  UpdateStockOrderStatusData,
} from '../interfaces/stock-order.repository.interface';

@Injectable()
export class StockOrderRepository implements IStockOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextOrderNumber(storeId: string, tx: any): Promise<string> {
    const seq = await tx.storeSequence.upsert({
      where: { storeId },
      update: { stockOrderSeq: { increment: 1 } },
      create: { storeId, stockOrderSeq: 1 },
    });
    return `PO-${String(seq.stockOrderSeq).padStart(5, '0')}`;
  }

  create(data: CreateStockOrderData, tx: any): Promise<StockOrder> {
    return tx.stockOrder.create({ data });
  }

  async createLines(lines: CreateStockOrderLineData[], tx: any): Promise<void> {
    await tx.stockOrderLine.createMany({ data: lines });
  }

  findById(id: string) {
    return this.prisma.stockOrder.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                title: true,
                product: { select: { title: true } },
              },
            },
          },
        },
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
        rejectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  findLinesByOrderId(orderId: string, tx: any): Promise<StockOrderLine[]> {
    return tx.stockOrderLine.findMany({ where: { orderId } });
  }

  async list(params: StockOrderListParams) {
    const { storeId, status, supplierId, q, skip = 0, take = 20 } = params;
    return this.prisma.stockOrder.findMany({
      where: {
        storeId,
        ...(status ? { status } : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(q
          ? { orderNumber: { contains: q, mode: 'insensitive' as const } }
          : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(params: Omit<StockOrderListParams, 'skip' | 'take'>): Promise<number> {
    const { storeId, status, supplierId, q } = params;
    return this.prisma.stockOrder.count({
      where: {
        storeId,
        ...(status ? { status } : {}),
        ...(supplierId ? { supplierId } : {}),
        ...(q
          ? { orderNumber: { contains: q, mode: 'insensitive' as const } }
          : {}),
      },
    });
  }

  async updateStatus(
    id: string,
    data: UpdateStockOrderStatusData,
    tx: any,
  ): Promise<void> {
    await tx.stockOrder.update({ where: { id }, data });
  }

  async updateLine(
    lineId: string,
    receivedQty: number,
    costPerUnit: number,
    tx: any,
  ): Promise<void> {
    await tx.stockOrderLine.update({
      where: { id: lineId },
      data: { receivedQty, costPerUnit },
    });
  }

  async updateOrder(
    id: string,
    data: UpdateStockOrderData,
    tx: any,
  ): Promise<void> {
    await tx.stockOrder.update({ where: { id }, data });
  }

  async updateOrderLine(
    lineId: string,
    data: UpdateStockOrderLineData,
    tx: any,
  ): Promise<void> {
    await tx.stockOrderLine.update({ where: { id: lineId }, data });
  }

  async deleteLines(lineIds: string[], tx: any): Promise<void> {
    await tx.stockOrderLine.deleteMany({ where: { id: { in: lineIds } } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.stockOrder.delete({ where: { id } });
  }
}
