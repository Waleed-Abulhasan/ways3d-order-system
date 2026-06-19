-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "customerType" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "orgName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "orderDesc" TEXT NOT NULL,
    "fileUrls" TEXT NOT NULL DEFAULT '[]',
    "wantMeeting" BOOLEAN NOT NULL DEFAULT false,
    "meetingNote" TEXT,
    "deliveryType" TEXT NOT NULL,
    "preferredDate" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'pending',
    "status" TEXT NOT NULL DEFAULT 'new',
    "invoiceItems" TEXT,
    "deliveryCost" DOUBLE PRECISION,
    "discount" DOUBLE PRECISION,
    "notes" TEXT,
    "invoiceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_refNumber_key" ON "Order"("refNumber");
