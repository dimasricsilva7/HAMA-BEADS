-- CreateTable
CREATE TABLE "CheckoutLead" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "items" JSONB NOT NULL,
    "bumpIds" JSONB,
    "couponCode" TEXT,
    "itemsSummary" TEXT,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "visitorId" TEXT,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "device" TEXT,
    "orderId" TEXT,
    "emailStatus" "EmailStatus",
    "emailScheduledFor" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "emailError" TEXT,
    "emailOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutLead_clientKey_key" ON "CheckoutLead"("clientKey");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutLead_token_key" ON "CheckoutLead"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutLead_orderId_key" ON "CheckoutLead"("orderId");

-- CreateIndex
CREATE INDEX "CheckoutLead_emailStatus_emailScheduledFor_idx" ON "CheckoutLead"("emailStatus", "emailScheduledFor");

-- CreateIndex
CREATE INDEX "CheckoutLead_createdAt_idx" ON "CheckoutLead"("createdAt");

-- CreateIndex
CREATE INDEX "CheckoutLead_email_idx" ON "CheckoutLead"("email");

-- AddForeignKey
ALTER TABLE "CheckoutLead" ADD CONSTRAINT "CheckoutLead_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
