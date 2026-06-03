import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { ListTenantsQueryDto } from './dtos/list-tenants-query.dto';

@Controller('super-admin/tenants')
@UseGuards(SuperAdminGuard)
export class TenantsController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  createTenant(@Body() dto: CreateTenantDto, @Req() req: any) {
    return this.tenantService.createTenant(dto, req.user.sub);
  }

  @Get()
  listTenants(@Query() query: ListTenantsQueryDto) {
    return this.tenantService.listTenants(query);
  }

  @Get(':id')
  getTenant(@Param('id') id: string) {
    return this.tenantService.getTenant(id);
  }

  @Patch(':id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateTenant(id, dto);
  }
}
