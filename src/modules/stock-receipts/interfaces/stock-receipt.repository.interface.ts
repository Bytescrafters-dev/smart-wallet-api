import { StockReceipt } from '@prisma/client';

export interface CreateStockReceiptData {
  storeId: string;
  receiptNumber: string;
  createdById: string;
  invoiceRef?: string | null;
  note?: string | null;
  currency?: string | null;
}

export interface CreateStockReceiptLineData {
  receiptId: string;
  variantId: string;
  qty: number;
  costPerUnit?: number | null;
}

export interface StockReceiptListParams {
  storeId: string;
  q?: string;
  skip?: number;
  take?: number;
}

export interface IStockReceiptRepository {
  nextReceiptNumber(storeId: string, tx: any): Promise<string>;
  create(data: CreateStockReceiptData, tx: any): Promise<StockReceipt>;
  createLines(lines: CreateStockReceiptLineData[], tx: any): Promise<void>;
  findById(id: string): Promise<any | null>;
  list(params: StockReceiptListParams): Promise<any[]>;
  count(params: Omit<StockReceiptListParams, 'skip' | 'take'>): Promise<number>;
}
