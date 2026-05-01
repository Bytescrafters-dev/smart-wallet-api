import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { StockReceipt } from '@prisma/client';
import {
  CreateStockReceiptData,
  CreateStockReceiptLineData,
  IStockReceiptRepository,
  StockReceiptListParams,
} from '../interfaces/stock-receipt.repository.interface';

@Injectable()
export class StockReceiptRepository implements IStockReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextReceiptNumber(storeId: string, tx: any): Promise<string> {
    const seq = await tx.storeSequence.upsert({
      where: { storeId },
      update: { stockReceiptSeq: { increment: 1 } },
      create: { storeId, stockReceiptSeq: 1 },
    });
    return `SR-${String(seq.stockReceiptSeq).padStart(5, '0')}`;
  }

  create(data: CreateStockReceiptData, tx: any): Promise<StockReceipt> {
    return tx.stockReceipt.create({ data });
  }

  async createLines(
    lines: CreateStockReceiptLineData[],
    tx: any,
  ): Promise<void> {
    await tx.stockReceiptLine.createMany({ data: lines });
  }

  findById(id: string) {
    return this.prisma.stockReceipt.findUnique({
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
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async list(params: StockReceiptListParams) {
    const { storeId, q, skip = 0, take = 20 } = params;
    return this.prisma.stockReceipt.findMany({
      where: {
        storeId,
        ...(q
          ? { receiptNumber: { contains: q, mode: 'insensitive' as const } }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { lines: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(
    params: Omit<StockReceiptListParams, 'skip' | 'take'>,
  ): Promise<number> {
    const { storeId, q } = params;
    return this.prisma.stockReceipt.count({
      where: {
        storeId,
        ...(q
          ? { receiptNumber: { contains: q, mode: 'insensitive' as const } }
          : {}),
      },
    });
  }
}
