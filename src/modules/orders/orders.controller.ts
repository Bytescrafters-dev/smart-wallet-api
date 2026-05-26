import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CartService } from './cart.service';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { StorefrontCheckoutDto } from './dtos/storefront-checkout.dto';
import { AdminCreateOrderDto } from './dtos/admin-create-order.dto';
import { ChangeOrderStatusDto, UpdateOrderDto } from './dtos/update-order.dto';
import { OptionalStoreUserGuard } from 'src/common/guards/optional-store-user.guard';
import { OrdersQueryDto } from './dtos/orders-query.dto';

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

  @Post('store/:storeSlug/checkout')
  @UseGuards(OptionalStoreUserGuard)
  checkout(
    @Param('storeSlug') storeSlug: string,
    @Body() dto: StorefrontCheckoutDto,
    @Req() req: any,
  ) {
    const storeUserId: string | undefined =
      req.user?.type === 'store_user' ? req.user.sub : undefined;
    return this.ordersService.checkout(dto, storeSlug, storeUserId);
  }

  @Post('admin/stores/:storeId/orders')
  @UseGuards(AdminGuard)
  adminCreateOrder(
    @Param('storeId') storeId: string,
    @Body() dto: AdminCreateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.adminCreateOrder(dto, storeId, req.user.sub);
  }

  @Get('admin/stores/:storeId/orders')
  @UseGuards(AdminGuard)
  adminListOrders(
    @Param('storeId') storeId: string,
    @Query() query: OrdersQueryDto,
  ) {
    return this.ordersService.listOrders(storeId, query);
  }

  @Get('/admin/orders/:id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch('admin/orders/:id')
  @UseGuards(AdminGuard)
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrder(id, dto, req.user.sub);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(AdminGuard)
  changeOrderStatus(
    @Param('id') id: string,
    @Body() dto: ChangeOrderStatusDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrder(id, { status: dto.status }, req.user.sub);
  }

  @Patch('admin/orders/:id/payment')
  @UseGuards(AdminGuard)
  markAsPaid(@Param('id') id: string) {
    return this.ordersService.markAsPaid(id);
  }
}
