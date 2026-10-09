-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'CREDIARIO_PENDENTE';
ALTER TYPE "OrderStatus" ADD VALUE 'CREDIARIO_EM_ANALISE';
ALTER TYPE "OrderStatus" ADD VALUE 'CREDIARIO_APROVADO';
ALTER TYPE "OrderStatus" ADD VALUE 'CREDIARIO_RECUSADO';
ALTER TYPE "OrderStatus" ADD VALUE 'CREDIARIO_CANCELADO';

-- CreateTable
CREATE TABLE "CrediarioData" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "protocolEnc" TEXT NOT NULL,
    "protocolLast4" TEXT NOT NULL,
    "validityEnc" TEXT NOT NULL,
    "cpfLast3Enc" TEXT NOT NULL,
    "validityFormat" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "installmentCents" INTEGER NOT NULL,
    "installmentLabel" TEXT NOT NULL,
    "methodLabel" TEXT NOT NULL,
    "analysisNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrediarioData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrediarioData_orderId_key" ON "CrediarioData"("orderId");

-- CreateIndex
CREATE INDEX "CrediarioData_createdAt_idx" ON "CrediarioData"("createdAt");

-- AddForeignKey
ALTER TABLE "CrediarioData" ADD CONSTRAINT "CrediarioData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
