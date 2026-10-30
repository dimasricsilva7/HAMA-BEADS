ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'CLOGS';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'SANDALS';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'SLIDES';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'KIDS';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'JIBBITZ';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'FOOTWEAR';

ALTER TABLE "Product"
ADD COLUMN "individualDiscountPercent" INTEGER;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_individualDiscountPercent_check"
CHECK ("individualDiscountPercent" IS NULL OR ("individualDiscountPercent" >= 0 AND "individualDiscountPercent" <= 100));

CREATE TABLE "SectionDiscount" (
  "id" TEXT NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "percent" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SectionDiscount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SectionDiscount_percent_check" CHECK ("percent" >= 0 AND "percent" <= 100),
  CONSTRAINT "SectionDiscount_dates_check" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "SectionDiscount_category_key" ON "SectionDiscount"("category");
CREATE INDEX "SectionDiscount_active_startsAt_endsAt_idx" ON "SectionDiscount"("active", "startsAt", "endsAt");
