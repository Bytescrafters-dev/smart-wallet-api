import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StoreUsersService } from './store-users.service';
import { StoreUserGuard } from 'src/common/guards/store-user.guard';
import { OptionalStoreUserGuard } from 'src/common/guards/optional-store-user.guard';
import { UpdateStoreUserDto } from './dtos/update-store-user.dto';
import { CreateAddressDto } from './dtos/create-address.dto';

@Controller('store-users')
export class StoreUsersController {
  constructor(private readonly storeUsersService: StoreUsersService) {}

  @Get('/my-profile')
  @UseGuards(StoreUserGuard)
  getMyProfile(@Req() req: any) {
    const storeUserId: string | undefined =
      (req as any).user?.type === 'store_user'
        ? (req as any).user?.sub
        : undefined;
    return this.storeUsersService.getStoreUserById(req.user?.sub);
  }

  @Patch('/my-profile')
  @UseGuards(StoreUserGuard)
  updateMyProfile(@Req() req: any, @Body() dto: UpdateStoreUserDto) {
    return this.storeUsersService.updateStoreUserProfile(req.user?.sub, dto);
  }

  @Post('/store-user-address')
  @UseGuards(StoreUserGuard)
  addAddress(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.storeUsersService.addAddress(req.user?.sub, dto);
  }

  @Get('/store-user-addresses')
  @UseGuards(StoreUserGuard)
  listAddresses(@Req() req: any) {
    return this.storeUsersService.listAddresses(req.user?.sub);
  }

  @Get('/store-user-address/:id')
  @UseGuards(StoreUserGuard)
  getAddressById(@Param('id') id: string) {
    return this.storeUsersService.getAddressById(id);
  }

  @Put('/store-user-address/:id')
  @UseGuards(StoreUserGuard)
  updateAddress(@Param('id') id: string, @Body() dto: CreateAddressDto) {
    return this.storeUsersService.updateAddress(id, dto);
  }

  @Delete('/store-user-address/:id')
  @UseGuards(StoreUserGuard)
  deleteAddress(@Param('id') id: string) {
    return this.storeUsersService.deleteAddress(id);
  }
}
