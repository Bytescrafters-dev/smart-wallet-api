import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { OptionalStoreUserGuard } from 'src/common/guards/optional-store-user.guard';

@Controller('store-users')
@UseGuards(OptionalStoreUserGuard)
export class StoreUsersController {
  constructor() {}

  @Get('/my-profile')
  getMyProfile(@Req() req: any) {
    return { message: 'Hello World!' };
  }
}
