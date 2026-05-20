import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { Roles, RolesGuard } from 'src/common/auth/index';
import { UserService } from './user.service';
import { CreateAdminUserDto } from './dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from './dtos/update-admin-user.dto';
import { AssignStoresDto } from './dtos/assign-stores.dto';

@Controller('users')
@UseGuards(AdminGuard, RolesGuard)
export class UsersManagementController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  create(@Body() dto: CreateAdminUserDto, @Req() req: any) {
    return this.userService.createUser(dto, req.user.sub, req.user.role);
  }

  @Get('/store/:storeId')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  listByStore(@Param('storeId') storeId: string, @Req() req: any) {
    return this.userService.listByStore(storeId, req.user.sub);
  }

  @Get('/stores')
  listUsersAllStores(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.listUsersAllStores(req.user.sub, {
      q,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('/:id')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('/:id')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() req: any,
  ) {
    return this.userService.updateUser(id, dto, req.user.role);
  }

  @Post('/:id/stores')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  assignStores(
    @Param('id') id: string,
    @Body() dto: AssignStoresDto,
    @Req() req: any,
  ) {
    return this.userService.assignStores(id, dto, req.user.sub);
  }

  @Delete('/:id/stores/:storeId')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  removeStoreAccess(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Req() req: any,
  ) {
    return this.userService.removeStoreAccess(id, storeId, req.user.sub);
  }

  @Delete('/:id')
  @Roles(AdminRole.OWNER, AdminRole.MANAGER)
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.userService.deactivateUser(id, req.user.sub, req.user.role);
  }
}
