import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockOrderStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import { InventoryService } from '../inventory/inventory.service';
import { IStockOrderRepository } from './interfaces/stock-order.repository.interface';
import { CreateStockOrderDto } from './dtos/create-stock-order.dto';
import { UpdateStockOrderDto } from './dtos/update-stock-order.dto';
import { ReceiveStockOrderDto } from './dtos/receive-stock-order.dto';
import { StockOrdersQueryDto } from './dtos/stock-orders-query.dto';

@Injectable()
export class StockOrdersService {
  constructor(
    @Inject(TOKENS.StockOrderRepo)
    private readonly stockOrderRepo: IStockOrderRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: any,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateStockOrderDto, createdById: string) {
    const store = await this.storeRepo.findById(dto.storeId);
    if (!store) throw new NotFoundException('Store not found');

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.stockOrderRepo.nextOrderNumber(
        dto.storeId,
        tx,
      );

      const order = await this.stockOrderRepo.create(
        {
          storeId: dto.storeId,
          orderNumber,
          createdById,
          supplierId: dto.supplierId ?? null,
          invoiceRef: dto.invoiceRef ?? null,
          note: dto.note ?? null,
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          currency: dto.currency ?? null,
        },
        tx,
      );

      await this.stockOrderRepo.createLines(
        dto.lines.map((l) => ({
          orderId: order.id,
          variantId: l.variantId,
          orderedQty: l.orderedQty,
          costPerUnit: l.costPerUnit ?? null,
        })),
        tx,
      );

      return order;
    });
  }

  async list(storeId: string, query: StockOrdersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const params = {
      storeId,
      status: query.status,
      supplierId: query.supplierId,
      q: query.q,
      skip: skip ?? 0,
      take: limit ?? 20,
    };

    const [data, total] = await Promise.all([
      this.stockOrderRepo.list(params),
      this.stockOrderRepo.count(params),
    ]);

    return {
      data,
      total,
      page: Math.floor((skip ?? 0) / (limit ?? 20)) + 1,
      limit: limit ?? 20,
    };
  }

  async findOne(id: string) {
    const order = await this.stockOrderRepo.findById(id);
    if (!order) throw new NotFoundException('Stock order not found');
    return order;
  }

  async update(id: string, dto: UpdateStockOrderDto) {
    const order = await this.stockOrderRepo.findById(id);
    if (!order) throw new NotFoundException('Stock order not found');

    if (
      order.status !== StockOrderStatus.CREATED &&
      order.status !== StockOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'Only CREATED or PARTIALLY_RECEIVED orders can be updated',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.removeLineIds?.length) {
        if (order.status === StockOrderStatus.PARTIALLY_RECEIVED) {
          throw new BadRequestException(
            'Lines cannot be removed from a partially received order',
          );
        }

        for (const lineId of dto.removeLineIds) {
          const line = order.lines.find((l: any) => l.id === lineId);
          if (!line) {
            throw new BadRequestException(
              `Line ${lineId} does not belong to this order`,
            );
          }
        }

        const remainingCount =
          order.lines.length -
          dto.removeLineIds.length +
          (dto.addLines?.length ?? 0);
        if (remainingCount < 1) {
          throw new BadRequestException('An order must have at least one line');
        }

        await this.stockOrderRepo.deleteLines(dto.removeLineIds, tx);
      }

      const anyReceived = order.lines.some(
        (l: any) => (l.receivedQty ?? 0) > 0,
      );
      if (!anyReceived && dto.updateLines?.length) {
        for (const lineInput of dto.updateLines) {
          const line = order.lines.find((l: any) => l.id === lineInput.lineId);
          if (!line) {
            throw new BadRequestException(
              `Line ${lineInput.lineId} does not belong to this order`,
            );
          }

          const data: { orderedQty?: number; costPerUnit?: number | null } = {};
          if (lineInput.orderedQty !== undefined)
            data.orderedQty = lineInput.orderedQty;
          if (lineInput.costPerUnit !== undefined)
            data.costPerUnit = lineInput.costPerUnit;

          if (Object.keys(data).length > 0) {
            await this.stockOrderRepo.updateOrderLine(
              lineInput.lineId,
              data,
              tx,
            );
          }
        }
      }

      if (dto.addLines?.length) {
        await this.stockOrderRepo.createLines(
          dto.addLines.map((l) => ({
            orderId: id,
            variantId: l.variantId,
            orderedQty: l.orderedQty,
            costPerUnit: l.costPerUnit ?? null,
          })),
          tx,
        );
      }

      const headerData: Record<string, any> = {};
      if (dto.supplierId !== undefined) headerData.supplierId = dto.supplierId;
      if (dto.invoiceRef !== undefined) headerData.invoiceRef = dto.invoiceRef;
      if (dto.note !== undefined) headerData.note = dto.note;
      if (dto.currency !== undefined) headerData.currency = dto.currency;
      if (dto.expectedDeliveryDate !== undefined) {
        headerData.expectedDeliveryDate = dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : null;
      }

      if (Object.keys(headerData).length > 0) {
        await this.stockOrderRepo.updateOrder(id, headerData, tx);
      }

      return this.stockOrderRepo.findById(id);
    });
  }

  async receive(id: string, dto: ReceiveStockOrderDto, actorId: string) {
    const order = await this.stockOrderRepo.findById(id);
    if (!order) throw new NotFoundException('Stock order not found');

    if (
      order.status === StockOrderStatus.REJECTED ||
      order.status === StockOrderStatus.CLOSED
    ) {
      throw new BadRequestException('Cannot receive a rejected or closed order');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const lineInput of dto.lines) {
        const currentLine = order.lines.find(
          (l: any) => l.id === lineInput.lineId,
        );
        if (!currentLine) {
          throw new BadRequestException(
            `Line ${lineInput.lineId} does not belong to this order`,
          );
        }

        const previouslyReceived = currentLine.receivedQty ?? 0;
        const delta = lineInput.receivedQty;
        const newTotal = previouslyReceived + delta;

        if (newTotal > currentLine.orderedQty) {
          throw new BadRequestException(
            `Receiving ${delta} units for line ${lineInput.lineId} would exceed the ordered quantity of ${currentLine.orderedQty}`,
          );
        }

        await this.stockOrderRepo.updateLine(
          lineInput.lineId,
          newTotal,
          lineInput.costPerUnit,
          tx,
        );
        await this.inventoryService.stockIn(
          currentLine.variantId,
          delta,
          id,
          actorId,
          tx,
        );
      }

      const updatedLines = await this.stockOrderRepo.findLinesByOrderId(id, tx);
      const allReceived = updatedLines.every(
        (l) => (l.receivedQty ?? 0) >= l.orderedQty,
      );
      const anyReceived = updatedLines.some((l) => (l.receivedQty ?? 0) > 0);

      const newStatus = allReceived
        ? StockOrderStatus.RECEIVED
        : anyReceived
          ? StockOrderStatus.PARTIALLY_RECEIVED
          : order.status;

      await this.stockOrderRepo.updateStatus(
        id,
        {
          status: newStatus,
          receivedById: actorId,
          receivedAt: new Date(),
          currency: dto.currency,
          ...(dto.invoiceRef ? { invoiceRef: dto.invoiceRef } : {}),
          ...(dto.note ? { note: dto.note } : {}),
        },
        tx,
      );

      return { id, status: newStatus };
    });
  }

  async reject(id: string, actorId: string) {
    const order = await this.stockOrderRepo.findById(id);
    if (!order) throw new NotFoundException('Stock order not found');

    if (order.status === StockOrderStatus.RECEIVED) {
      throw new BadRequestException('Cannot reject a fully received order');
    }
    if (
      order.status === StockOrderStatus.REJECTED ||
      order.status === StockOrderStatus.CLOSED
    ) {
      throw new BadRequestException('Order is already closed or rejected');
    }

    const newStatus =
      order.status === StockOrderStatus.PARTIALLY_RECEIVED
        ? StockOrderStatus.CLOSED
        : StockOrderStatus.REJECTED;

    await this.stockOrderRepo.updateStatus(
      id,
      {
        status: newStatus,
        rejectedById: actorId,
        rejectedAt: new Date(),
      },
      this.prisma,
    );

    return { id, status: newStatus };
  }

  async remove(id: string) {
    const order = await this.stockOrderRepo.findById(id);
    if (!order) throw new NotFoundException('Stock order not found');

    if (order.status !== StockOrderStatus.CREATED) {
      throw new BadRequestException(
        'Only orders in CREATED status can be deleted',
      );
    }

    await this.stockOrderRepo.delete(id);
    return { message: 'Stock order deleted' };
  }
}
