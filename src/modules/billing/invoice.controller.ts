import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { InvoiceService } from './invoice.service';

@Controller('super-admin')
@UseGuards(SuperAdminGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('tenants/:tenantId/invoices')
  listByTenant(@Param('tenantId') tenantId: string) {
    return this.invoiceService.listByTenant(tenantId);
  }

  @Get('invoices/:id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch('invoices/:id/pay')
  markPaid(@Param('id') id: string, @Req() req: any) {
    return this.invoiceService.markPaid(id, req.user.sub);
  }

  @Patch('invoices/:id/void')
  voidInvoice(@Param('id') id: string) {
    return this.invoiceService.voidInvoice(id);
  }
}
