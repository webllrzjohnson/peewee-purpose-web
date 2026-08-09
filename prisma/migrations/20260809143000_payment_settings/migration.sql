-- Payment setup foundation: course numeric pricing and PayPal admin settings.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayPalMode') THEN
    CREATE TYPE "PayPalMode" AS ENUM ('DISABLED', 'SANDBOX', 'LIVE');
  END IF;
END $$;

ALTER TABLE "CourseOffering" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;

CREATE TABLE IF NOT EXISTS "PaymentSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "paypalMode" "PayPalMode" NOT NULL DEFAULT 'DISABLED',
  "paypalClientId" TEXT,
  "encryptedPaypalClientSecret" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PaymentSettings" ("id", "paypalMode", "currency", "updatedAt")
VALUES ('default', 'DISABLED', 'USD', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
