import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtAuthGuard, Roles, RolesGuard } from 'src/common/auth';
import { ListUsersFilterDto } from './dtos/list-users-filter.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  register(@Body() dto: CreateUserDto) {
    return this.userService.register(dto);
  }

  @Get()
  @Roles('ADMIN')
  list(@Query() filter: ListUsersFilterDto) {
    return this.userService.listUsers(filter);
  }

  @Get('/my-profile')
  getMyProfile(@Req() req: any) {
    const userId: string = req.user?.sub;
    return this.userService.getUserById(userId);
  }

  @Patch('/my-profile')
  updateMyProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    const userId: string = req.user?.sub;
    return this.userService.updateUserById(userId, dto);
  }
}
