import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TOKENS } from 'src/common/constants/tokens';
import {
  CreateOrderItemData,
  IOrderRepository,
  UpdateOrderData,
} from './interfaces/order.repository.interface';
import { ICartRepository } from './interfaces/cart.repository.interface';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';
import { IProductRepository } from '../products/interfaces/product.repository.interface';
import { InventoryService } from '../inventory/inventory.service';
import { StorefrontCheckoutDto } from './dtos/storefront-checkout.dto';
import { AdminCreateOrderDto } from './dtos/admin-create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrdersQueryDto } from './dtos/orders-query.dto';

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

@Injectable()
export class OrdersService {
  constructor(
    @Inject(TOKENS.OrderRepo)
    private readonly orderRepo: IOrderRepository,
    @Inject(TOKENS.CartRepo)
    private readonly cartRepo: ICartRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
    @Inject(TOKENS.ProductRepo)
    private readonly productRepo: IProductRepository,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  async checkout(
    dto: StorefrontCheckoutDto,
    storeSlug: string,
    storeUserId?: string,
  ) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    const cart = await this.cartRepo.findById(dto.cartId);
    if (!cart || cart.items.length === 0)
      throw new BadRequestException('Cart is empty');
    if (cart.storeId !== store.id)
      throw new BadRequestException('Cart does not belong to this store');

    // Resolve shipping address — addressId takes priority over inline fields
    let shippingFields: Record<string, string | null> = {
      shippingAddress1: dto.shippingAddress1 ?? null,
      shippingAddress2: dto.shippingAddress2 ?? null,
      shippingCity: dto.shippingCity ?? null,
      shippingState: dto.shippingState ?? null,
      shippingPostalCode: dto.shippingPostalCode ?? null,
      shippingCountry: dto.shippingCountry ?? null,
    };

    if (dto.shippingAddressId) {
      const addr = await this.prisma.address.findUnique({
        where: { id: dto.shippingAddressId },
      });
      if (!addr) throw new NotFoundException('Address not found');
      shippingFields = {
        shippingAddress1: addr.address1,
        shippingAddress2: addr.address2 ?? null,
        shippingCity: addr.city,
        shippingState: addr.state ?? null,
        shippingPostalCode: addr.postalCode,
        shippingCountry: addr.country,
      };
    }

    // Build order items — prices always derived from backend
    const orderItems: CreateOrderItemData[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const price = await this.productRepo.resolveActivePriceForProductVariant(
        item.variantId,
        store.defaultCurrency,
      );
      if (!price)
        throw new BadRequestException(
          `No active price for variant ${item.variantId}`,
        );

      const optionParts = item.variant.optionValues.map(
        (ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`,
      );

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.variant.sku,
        productTitle: item.product.title,
        variantTitle:
          optionParts.length > 0 ? optionParts.join(' / ') : undefined,
        unitPrice: price.amount,
        quantity: item.quantity,
      });
      subtotal += price.amount * item.quantity;
    }

    const shipping = await this.resolveShippingCost(dto.shippingOptionId);
    const total = subtotal + shipping;

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.orderRepo.generateOrderNumber(
        store.id,
        tx,
      );

      const order = await this.orderRepo.create(
        {
          storeId: store.id,
          orderNumber,
          storeUserId: storeUserId ?? null,
          status: OrderStatus.PENDING,
          paymentStatus: dto.paymentStatus as PaymentStatus,
          currency: store.defaultCurrency,
          subtotal,
          shipping,
          discount: 0,
          tax: 0,
          total,
          shippingOptionId: dto.shippingOptionId ?? null,
          note: dto.note ?? null,
          ...shippingFields,
        },
        orderItems,
        tx,
      );

      // Clear cart atomically with order creation
      await tx.cartItem.deleteMany({ where: { cartId: dto.cartId } });
      await tx.cart.delete({ where: { id: dto.cartId } });

      return order;
    });
  }

  async adminCreateOrder(
    dto: AdminCreateOrderDto,
    storeId: string,
    adminId: string,
  ) {
    const store = await this.storeRepo.findById(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const { orderItems, subtotal } = await this.buildVariantOrderItems(
      dto.items,
      storeId,
      store.defaultCurrency,
    );

    const shipping = await this.resolveShippingCost(dto.shippingOptionId);
    const total = subtotal + shipping;

    const canConfirm =
      dto.paymentStatus === PaymentStatus.PAID ||
      dto.paymentStatus === PaymentStatus.COD;
    const status = canConfirm ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.orderRepo.generateOrderNumber(storeId, tx);

      const order = await this.orderRepo.create(
        {
          storeId,
          orderNumber,
          storeUserId: dto.storeUserId ?? null,
          createdById: adminId,
          confirmedById: canConfirm ? adminId : null,
          status,
          paymentStatus: dto.paymentStatus,
          currency: store.defaultCurrency,
          subtotal,
          shipping,
          discount: 0,
          tax: 0,
          total,
          shippingOptionId: dto.shippingOptionId ?? null,
          note: dto.note ?? null,
          customerName: dto.customerName ?? null,
          customerPhone: dto.customerPhone ?? null,
          shippingAddress1: dto.shippingAddress1 ?? null,
          shippingAddress2: dto.shippingAddress2 ?? null,
          shippingCity: dto.shippingCity ?? null,
          shippingState: dto.shippingState ?? null,
          shippingPostalCode: dto.shippingPostalCode ?? null,
          shippingCountry: dto.shippingCountry ?? null,
        },
        orderItems,
        tx,
      );

      if (canConfirm) {
        for (const item of orderItems) {
          await this.inventoryService.reserve(
            item.variantId,
            item.quantity,
            order.id,
            adminId,
            tx,
          );
        }
      }

      return order;
    });
  }

  async updateOrder(id: string, dto: UpdateOrderDto, adminId: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELED
    ) {
      throw new BadRequestException(
        `Cannot update a ${order.status.toLowerCase()} order`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: UpdateOrderData = {};
      let itemsForInventory = order.items;

      // Step 1: Replace items if provided — PENDING only, recalculate totals
      if (dto.items?.length) {
        if (order.status !== OrderStatus.PENDING) {
          throw new BadRequestException(
            'Items can only be updated on Pending orders',
          );
        }
        const { orderItems, subtotal } = await this.buildVariantOrderItems(
          dto.items,
          order.storeId,
          order.currency,
        );
        await this.orderRepo.replaceItems(order.id, orderItems, tx);
        itemsForInventory = orderItems;
        updateData.subtotal = subtotal;
        updateData.total = subtotal + order.shipping;
      }

      // Step 2: Scalar field updates (paymentStatus validated before applying)
      if (
        dto.paymentStatus !== undefined &&
        dto.paymentStatus !== order.paymentStatus
      ) {
        const incomingPayment = dto.paymentStatus;
        if (incomingPayment === PaymentStatus.REFUNDED) {
          throw new BadRequestException(
            'Payment status REFUNDED is set automatically and cannot be assigned manually',
          );
        }
        if (
          (incomingPayment === PaymentStatus.UNPAID ||
            incomingPayment === PaymentStatus.COD) &&
          order.status !== OrderStatus.PENDING
        ) {
          throw new BadRequestException(
            `Cannot set payment status to ${incomingPayment} on a ${order.status.toLowerCase()} order`,
          );
        }
        updateData.paymentStatus = incomingPayment;
      }

      const scalarFields = [
        'customerName',
        'customerPhone',
        'note',
        'shippingAddress1',
        'shippingAddress2',
        'shippingCity',
        'shippingState',
        'shippingPostalCode',
        'shippingCountry',
      ] as const;
      for (const field of scalarFields) {
        if (dto[field] !== undefined) (updateData as any)[field] = dto[field];
      }

      // Step 3: Status transition
      if (dto.status && dto.status !== order.status) {
        const allowed = VALID_TRANSITIONS[order.status as OrderStatus] ?? [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Cannot transition order from ${order.status} to ${dto.status}`,
          );
        }

        // Effective payment status: prefer incoming value over the DB value
        const effectivePaymentStatus =
          updateData.paymentStatus ?? order.paymentStatus;

        switch (dto.status) {
          case OrderStatus.CONFIRMED: {
            if (
              effectivePaymentStatus !== PaymentStatus.PAID &&
              effectivePaymentStatus !== PaymentStatus.COD
            ) {
              throw new BadRequestException(
                'Order can only be confirmed when payment status is PAID or COD',
              );
            }
            for (const item of itemsForInventory) {
              await this.inventoryService.reserve(
                item.variantId,
                item.quantity,
                order.id,
                adminId,
                tx,
              );
            }
            updateData.confirmedById = adminId;
            break;
          }
          case OrderStatus.SHIPPED: {
            for (const item of order.items) {
              await this.inventoryService.sell(
                item.variantId,
                item.quantity,
                order.id,
                adminId,
                tx,
              );
            }
            break;
          }
          case OrderStatus.DELIVERED: {
            if (effectivePaymentStatus === PaymentStatus.COD) {
              updateData.paymentStatus = PaymentStatus.PAID;
            }
            break;
          }
          case OrderStatus.CANCELED: {
            if (order.status === OrderStatus.CONFIRMED) {
              for (const item of order.items) {
                await this.inventoryService.unreserve(
                  item.variantId,
                  item.quantity,
                  order.id,
                  adminId,
                  tx,
                );
              }
            }
            if (effectivePaymentStatus === PaymentStatus.PAID) {
              updateData.paymentStatus = PaymentStatus.REFUNDED;
            }
            break;
          }
        }

        updateData.status = dto.status;
      }

      return this.orderRepo.update(order.id, updateData, tx);
    });
  }

  async markAsPaid(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Payment can only be marked on PENDING orders',
      );
    }
    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      throw new BadRequestException('Order payment status is already set');
    }

    return this.orderRepo.update(id, { paymentStatus: PaymentStatus.PAID });
  }

  private async buildVariantOrderItems(
    items: { variantId: string; quantity: number }[],
    storeId: string,
    currency: string,
  ): Promise<{ orderItems: CreateOrderItemData[]; subtotal: number }> {
    const orderItems: CreateOrderItemData[] = [];
    let subtotal = 0;

    for (const item of items) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: item.variantId, product: { storeId } },
        include: {
          product: { select: { id: true, title: true } },
          optionValues: {
            include: { optionValue: { include: { option: true } } },
          },
        },
      });
      if (!variant)
        throw new NotFoundException(
          `Variant ${item.variantId} not found in this store`,
        );

      const price = await this.productRepo.resolveActivePriceForProductVariant(
        item.variantId,
        currency,
      );
      if (!price)
        throw new BadRequestException(
          `No active price for variant ${item.variantId}`,
        );

      const optionParts = variant.optionValues.map(
        (ov: any) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`,
      );

      orderItems.push({
        productId: variant.product.id,
        variantId: item.variantId,
        sku: variant.sku,
        productTitle: variant.product.title,
        variantTitle:
          optionParts.length > 0 ? optionParts.join(' / ') : undefined,
        unitPrice: price.amount,
        quantity: item.quantity,
      });
      subtotal += price.amount * item.quantity;
    }

    return { orderItems, subtotal };
  }

  private async resolveShippingCost(
    shippingOptionId?: string,
  ): Promise<number> {
    if (!shippingOptionId) return 0;
    const opt = await this.prisma.shippingOption.findUnique({
      where: { id: shippingOptionId },
      select: { amount: true },
    });
    if (!opt) throw new BadRequestException('Invalid shipping option');
    return (opt as any).amount ?? 0;
  }

  async listOrders(storeId: string, query: OrdersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const params = {
      storeId,
      status: query.status,
      paymentStatus: query.paymentStatus,
      q: query.q,
      skip: skip ?? 0,
      take: limit ?? 20,
    };

    const [data, total] = await Promise.all([
      this.orderRepo.listOrders(params),
      this.orderRepo.count(params),
    ]);

    return {
      data,
      total,
      page: Math.floor((skip ?? 0) / (limit ?? 20)) + 1,
      limit: limit ?? 20,
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    return order;
  }
}
