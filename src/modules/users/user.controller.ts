import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('profile')
@UseGuards(AdminGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/my-profile')
  getMyProfile(@Req() req: any) {
    return this.userService.getUserById(req.user?.sub);
  }

  @Patch('/my-profile')
  updateMyProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(req.user?.sub, dto);
  }
}
