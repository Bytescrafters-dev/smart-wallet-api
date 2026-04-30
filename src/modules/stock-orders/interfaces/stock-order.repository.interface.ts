import { StockOrder, StockOrderLine, StockOrderStatus } from '@prisma/client';

export interface CreateStockOrderData {
  storeId: string;
  orderNumber: string;
  createdById: string;
  supplierId?: string | null;
  invoiceRef?: string | null;
  note?: string | null;
  expectedDeliveryDate?: Date | null;
  currency?: string | null;
}

export interface CreateStockOrderLineData {
  orderId: string;
  variantId: string;
  orderedQty: number;
  costPerUnit?: number | null;
}

export interface UpdateStockOrderStatusData {
  status: StockOrderStatus;
  receivedById?: string | null;
  receivedAt?: Date | null;
  rejectedById?: string | null;
  rejectedAt?: Date | null;
  invoiceRef?: string | null;
  note?: string | null;
  currency?: string;
}

export interface StockOrderListParams {
  storeId: string;
  status?: StockOrderStatus;
  supplierId?: string;
  q?: string;
  skip?: number;
  take?: number;
}

export interface UpdateStockOrderData {
  supplierId?: string | null;
  invoiceRef?: string | null;
  note?: string | null;
  currency?: string | null;
  expectedDeliveryDate?: Date | null;
}

export interface UpdateStockOrderLineData {
  orderedQty?: number;
  costPerUnit?: number | null;
}

export interface IStockOrderRepository {
  nextOrderNumber(storeId: string, tx: any): Promise<string>;
  create(data: CreateStockOrderData, tx: any): Promise<StockOrder>;
  createLines(lines: CreateStockOrderLineData[], tx: any): Promise<void>;
  findById(id: string): Promise<any | null>;
  findLinesByOrderId(orderId: string, tx: any): Promise<StockOrderLine[]>;
  list(params: StockOrderListParams): Promise<any[]>;
  count(params: Omit<StockOrderListParams, 'skip' | 'take'>): Promise<number>;
  updateStatus(
    id: string,
    data: UpdateStockOrderStatusData,
    tx: any,
  ): Promise<void>;
  updateLine(
    lineId: string,
    receivedQty: number,
    costPerUnit: number,
    tx: any,
  ): Promise<void>;
  updateOrder(id: string, data: UpdateStockOrderData, tx: any): Promise<void>;
  updateOrderLine(
    lineId: string,
    data: UpdateStockOrderLineData,
    tx: any,
  ): Promise<void>;
  deleteLines(lineIds: string[], tx: any): Promise<void>;
  delete(id: string): Promise<void>;
}
