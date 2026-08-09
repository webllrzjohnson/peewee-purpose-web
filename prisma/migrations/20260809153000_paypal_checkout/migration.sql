-- Single-session PayPal checkout support.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
  END IF;
END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paypalOrderId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paypalCaptureId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "amountCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "currency" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_paypalOrderId_key" ON "Appointment"("paypalOrderId");
