ALTER TABLE "Product"
  ADD COLUMN "variants" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "sourceProductId" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceCollectionId" TEXT,
  ADD COLUMN "sourceSyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Product_sourceProductId_key" ON "Product"("sourceProductId");
CREATE INDEX "Product_sourceCollectionId_idx" ON "Product"("sourceCollectionId");
