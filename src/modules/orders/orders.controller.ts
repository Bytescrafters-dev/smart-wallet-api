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
import { JwtAuthGuard, Public, RolesGuard } from 'src/common/auth';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

const SID_COOKIE = 'sid';
const SID_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('cart/items')
  @Public()
  async addToCart(
    @Body() dto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId: string | undefined = (req as any).user?.sub;
    const sessionId: string | undefined = req.cookies?.[SID_COOKIE];

    const result = await this.cartService.addToCart(dto, { userId, sessionId });

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
  @Public()
  getCart(@Query('storeSlug') storeSlug: string, @Req() req: Request) {
    const userId: string | undefined = (req as any).user?.sub;
    const sessionId: string | undefined = req.cookies?.[SID_COOKIE];
    return this.cartService.getCart(storeSlug, { userId, sessionId });
  }

  @Delete('cart/:cartId/items/:itemId')
  @Public()
  removeItem(@Param('cartId') cartId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(cartId, itemId);
  }

  @Put('cart/items')
  @Public()
  updateItem(@Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(dto);
  }

  @Post('checkout')
  checkout(@Body() b: any) {
    return this.ordersService.checkout(
      b.storeId,
      b.cartId,
      b.addressTo,
      b.shippingOptionId,
    );
  }

  @Post('orders/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.ordersService.confirm(id);
  }
}
