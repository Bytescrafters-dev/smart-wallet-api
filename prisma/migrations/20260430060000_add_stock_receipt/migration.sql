ALTER TABLE "StoreSequence" ADD COLUMN "stockReceiptSeq" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "StockReceipt" (
    "id"            TEXT NOT NULL,
    "storeId"       TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "createdById"   TEXT NOT NULL,
    "invoiceRef"    TEXT,
    "note"          TEXT,
    "currency"      TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockReceiptLine" (
    "id"          TEXT NOT NULL,
    "receiptId"   TEXT NOT NULL,
    "variantId"   TEXT NOT NULL,
    "qty"         INTEGER NOT NULL,
    "costPerUnit" INTEGER,

    CONSTRAINT "StockReceiptLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockReceipt_storeId_receiptNumber_key" ON "StockReceipt"("storeId", "receiptNumber");
CREATE INDEX "StockReceipt_storeId_idx" ON "StockReceipt"("storeId");
CREATE INDEX "StockReceiptLine_receiptId_idx" ON "StockReceiptLine"("receiptId");
CREATE INDEX "StockReceiptLine_variantId_idx" ON "StockReceiptLine"("variantId");

ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockReceiptLine" ADD CONSTRAINT "StockReceiptLine_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "StockReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockReceiptLine" ADD CONSTRAINT "StockReceiptLine_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
