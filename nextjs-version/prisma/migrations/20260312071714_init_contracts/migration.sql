-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "partner_name" TEXT NOT NULL,
    "contract_value" DOUBLE PRECISION NOT NULL,
    "sign_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "priority_level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);
