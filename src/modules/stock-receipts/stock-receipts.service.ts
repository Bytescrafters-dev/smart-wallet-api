import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { InventoryService } from '../inventory/inventory.service';
import { IStockReceiptRepository } from './interfaces/stock-receipt.repository.interface';
import { CreateStockReceiptDto } from './dtos/create-stock-receipt.dto';
import { StockReceiptsQueryDto } from './dtos/stock-receipts-query.dto';

@Injectable()
export class StockReceiptsService {
  constructor(
    @Inject(TOKENS.StockReceiptRepo)
    private readonly stockReceiptRepo: IStockReceiptRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: any,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateStockReceiptDto, createdById: string) {
    const store = await this.storeRepo.findById(dto.storeId);
    if (!store) throw new NotFoundException('Store not found');

    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = await this.stockReceiptRepo.nextReceiptNumber(
        dto.storeId,
        tx,
      );

      const receipt = await this.stockReceiptRepo.create(
        {
          storeId: dto.storeId,
          receiptNumber,
          createdById,
          invoiceRef: dto.invoiceRef ?? null,
          note: dto.note ?? null,
          currency: dto.currency ?? null,
        },
        tx,
      );

      await this.stockReceiptRepo.createLines(
        dto.lines.map((l) => ({
          receiptId: receipt.id,
          variantId: l.variantId,
          qty: l.qty,
          costPerUnit: l.costPerUnit ?? null,
        })),
        tx,
      );

      for (const line of dto.lines) {
        await this.inventoryService.receiptIn(
          line.variantId,
          line.qty,
          receipt.id,
          createdById,
          tx,
        );
      }

      return receipt;
    });
  }

  async findOne(id: string) {
    const receipt = await this.stockReceiptRepo.findById(id);
    if (!receipt) throw new NotFoundException('Stock receipt not found');
    return receipt;
  }

  async list(storeId: string, query: StockReceiptsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const params = { storeId, q: query.q, skip, take: limit };

    const [data, total] = await Promise.all([
      this.stockReceiptRepo.list(params),
      this.stockReceiptRepo.count(params),
    ]);

    return { data, total, page, limit };
  }
}
