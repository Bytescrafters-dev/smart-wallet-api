import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlatformJwtModule } from './modules/auth/jwt.module';
import { UsersModule } from './modules/users/user.module';
import { StoresModule } from './modules/stores/stores.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockOrdersModule } from './modules/stock-orders/stock-orders.module';
import { StockReceiptsModule } from './modules/stock-receipts/stock-receipts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        const tls = config.get('REDIS_TLS') === 'true';
        return {
          connection: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            ...(password && { password }),
            ...(tls && { tls: {} }),
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    PlatformJwtModule,
    UploadsModule,
    OrdersModule,
    UsersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    SuppliersModule,
    InventoryModule,
    StockOrdersModule,
    StockReceiptsModule,
    LeadsModule,
    SuperAdminModule,
    TenantsModule,
    BillingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
