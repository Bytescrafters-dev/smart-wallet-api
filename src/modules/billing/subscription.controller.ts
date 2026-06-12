import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { SubscriptionService } from './subscription.service';
import { ChangeSubscriptionDto } from './dtos/change-subscription.dto';
import { UpdateSubscriptionSettingsDto } from './dtos/update-subscription-settings.dto';

@Controller('super-admin/tenants/:id/subscriptions')
@UseGuards(SuperAdminGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('activate')
  activate(@Param('id') tenantId: string) {
    return this.subscriptionService.activate(tenantId);
  }

  @Get('current')
  getCurrent(@Param('id') tenantId: string) {
    return this.subscriptionService.getCurrent(tenantId);
  }

  @Get()
  getHistory(@Param('id') tenantId: string) {
    return this.subscriptionService.getHistory(tenantId);
  }

  @Patch('current/settings')
  updateSettings(
    @Param('id') tenantId: string,
    @Body() dto: UpdateSubscriptionSettingsDto,
  ) {
    return this.subscriptionService.updateSettings(tenantId, dto);
  }

  @Patch('current')
  changePlan(
    @Param('id') tenantId: string,
    @Body() dto: ChangeSubscriptionDto,
    @Req() req: any,
  ) {
    return this.subscriptionService.changePlan(tenantId, dto, req.user.sub);
  }
}
