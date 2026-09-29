-- AlterTable
ALTER TABLE "OrderBump" ADD COLUMN     "modalTitle" TEXT,
ADD COLUMN     "showModal" BOOLEAN NOT NULL DEFAULT false;
