import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TOKENS } from 'src/common/constants/tokens';
import { ICartRepository } from './interfaces/cart.repository.interface';
import { IStoreRepository } from '../stores/interfaces/store.repository.interface';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { IProductRepository } from '../products/interfaces/product.repository.interface';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(TOKENS.CartRepo)
    private readonly cartRepo: ICartRepository,
    @Inject(TOKENS.StoreRepo)
    private readonly storeRepo: IStoreRepository,
    @Inject(TOKENS.ProductRepo)
    private readonly productRepo: IProductRepository,
  ) {}

  async addToCart(
    dto: AddToCartDto,
    context: { storeUserId?: string; sessionId?: string },
  ): Promise<{ cartId: string; sessionId?: string; items: any[] }> {
    const store = await this.storeRepo.findBySlug(dto.storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    // Validate product belongs to this store
    const product = await this.productRepo.findProductAvailabilityAtStore(
      dto.productId,
      store.id,
    );
    if (!product) throw new NotFoundException('Product not found');

    // Validate variant belongs to this store
    const variant = await this.productRepo.findVariantAvailabilityAtStore(
      dto.variantId,
      store.id,
    );

    if (!variant || !variant.active)
      throw new NotFoundException('Variant not found');

    // Resolve active price
    const now = new Date();
    const priceRow = await this.productRepo.resolveActivePriceForProductVariant(
      variant.id,
      dto.currency,
    );
    if (!priceRow)
      throw new BadRequestException(
        'No price for variant in requested currency',
      );

    // Check stock
    const inv = variant.inventory;
    const available = (inv?.quantity ?? 0) - (inv?.reserved ?? 0);
    if (available < dto.quantity)
      throw new BadRequestException('Insufficient stock');

    // Resolve or create cart
    let newSessionId: string | undefined;
    let cartId: string;

    if (context.storeUserId) {
      const existing = await this.cartRepo.findByStoreUserId(
        store.id,
        context.storeUserId,
      );
      if (existing) {
        cartId = existing.id;
      } else {
        const created = await this.cartRepo.createForStoreUser(
          store.id,
          context.storeUserId,
          dto.currency,
        );
        cartId = created.id;
      }
    } else {
      const sessionId = context.sessionId ?? crypto.randomUUID();
      if (!context.sessionId) newSessionId = sessionId;

      const existing = await this.cartRepo.findBySessionId(store.id, sessionId);
      if (existing) {
        cartId = existing.id;
      } else {
        const created = await this.cartRepo.createForSession(
          store.id,
          sessionId,
          dto.currency,
        );
        cartId = created.id;
      }
    }

    await this.cartRepo.upsertItem(
      cartId,
      dto.productId,
      dto.variantId,
      priceRow.amount,
      dto.quantity,
    );

    const updated = await this.cartRepo.findById(cartId);

    return {
      cartId,
      ...(newSessionId ? { sessionId: newSessionId } : {}),
      items: updated?.items ?? [],
    };
  }

  async getCart(
    storeSlug: string,
    context: { storeUserId?: string; sessionId?: string },
  ) {
    const store = await this.storeRepo.findBySlug(storeSlug);
    if (!store) throw new NotFoundException('Store not found');

    if (context.storeUserId) {
      return this.cartRepo.findByStoreUserId(store.id, context.storeUserId);
    }
    if (context.sessionId) {
      return this.cartRepo.findBySessionId(store.id, context.sessionId);
    }

    return null;
  }

  async removeItem(
    cartId: string,
    itemId: string,
  ): Promise<{ success: boolean }> {
    await this.cartRepo.removeItem(cartId, itemId);
    return { success: true };
  }

  async updateItem(dto: UpdateCartItemDto): Promise<{ success: boolean }> {
    await this.cartRepo.updateItem(dto.cartId, dto.itemId, dto.quantity);
    return { success: true };
  }

  async clearCart(cartId: string): Promise<void> {
    await this.cartRepo.clearItems(cartId);
  }

  async mergeOnLogin(
    sessionId: string,
    storeUserId: string,
    storeId: string,
  ): Promise<void> {
    const guestCart = await this.cartRepo.findBySessionId(storeId, sessionId);
    if (!guestCart) return;

    const existingUserCart = await this.cartRepo.findByStoreUserId(
      storeId,
      storeUserId,
    );
    let userCartId: string;

    if (existingUserCart) {
      userCartId = existingUserCart.id;
    } else {
      const newCart = await this.cartRepo.createForStoreUser(
        storeId,
        storeUserId,
        guestCart.currency,
      );
      userCartId = newCart.id;
    }

    await this.cartRepo.mergeGuestIntoUser(guestCart.id, userCartId);
  }
}
