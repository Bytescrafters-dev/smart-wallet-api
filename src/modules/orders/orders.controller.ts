import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { StoreUserGuard } from 'src/common/guards/store-user.guard';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { OptionalStoreUserGuard } from 'src/common/guards/optional-store-user.guard';

const SID_COOKIE = 'sid';
const SID_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Controller()
export class OrdersController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('cart/items')
  @UseGuards(OptionalStoreUserGuard)
  async addToCart(
    @Body() dto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const storeUserId: string | undefined = (req as any).user
      ? (req as any).user?.sub
      : undefined;
    const sessionId: string | undefined = req.cookies?.[SID_COOKIE];

    const result = await this.cartService.addToCart(dto, {
      storeUserId,
      sessionId,
    });

    if (result.sessionId) {
      res.cookie(SID_COOKIE, result.sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: SID_TTL_MS,
      });
    }

    return { cartId: result.cartId, items: result.items };
  }

  @Get('cart')
  @UseGuards(OptionalStoreUserGuard)
  getCart(@Query('storeSlug') storeSlug: string, @Req() req: Request) {
    const storeUserId: string | undefined =
      (req as any).user?.type === 'store_user'
        ? (req as any).user?.sub
        : undefined;
    const sessionId: string | undefined = req.cookies?.[SID_COOKIE];
    return this.cartService.getCart(storeSlug, { storeUserId, sessionId });
  }

  @Delete('cart/:cartId/items/:itemId')
  removeItem(@Param('cartId') cartId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(cartId, itemId);
  }

  @Put('cart/items')
  updateItem(@Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(dto);
  }

  // @Post('checkout')
  // @UseGuards(StoreUserGuard)
  // checkout(@Body() b: any, @Req() req: any) {
  //   return this.ordersService.checkout(
  //     b.storeId,
  //     b.cartId,
  //     b.addressTo,
  //     b.shippingOptionId,
  //   );
  // }

  // @Post('orders/:id/confirm')
  // @UseGuards(StoreUserGuard)
  // confirm(@Param('id') id: string) {
  //   return this.ordersService.confirm(id);
  // }
}
