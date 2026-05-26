import { Order, OrderStatus, PaymentStatus } from '@prisma/client';

export interface UpdateOrderData {
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  subtotal?: number;
  total?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  confirmedById?: string | null;
}

export interface CreateOrderData {
  storeId: string;
  orderNumber: string;
  storeUserId?: string | null;
  createdById?: string | null;
  confirmedById?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  shippingOptionId?: string | null;
  note?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
}

export interface CreateOrderItemData {
  productId: string;
  variantId: string;
  sku: string;
  productTitle: string;
  variantTitle?: string;
  unitPrice: number;
  quantity: number;
  options?: Record<string, string>;
}

export interface ListOrdersParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface OrderListParams {
  storeId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  skip?: number;
  take?: number;
}

export interface IOrderRepository {
  generateOrderNumber(storeId: string, tx: any): Promise<string>;
  create(
    data: CreateOrderData,
    items: CreateOrderItemData[],
    tx: any,
  ): Promise<Order>;
  findById(id: string): Promise<any | null>;
  findByStore(
    storeId: string,
    params: ListOrdersParams,
  ): Promise<{ data: any[]; total: number }>;
  listOrders(params: OrderListParams): Promise<any[]>;
  count(params: Omit<OrderListParams, 'skip' | 'take'>): Promise<number>;
  update(id: string, data: UpdateOrderData, tx?: any): Promise<Order>;
  replaceItems(
    orderId: string,
    items: CreateOrderItemData[],
    tx: any,
  ): Promise<void>;
}
