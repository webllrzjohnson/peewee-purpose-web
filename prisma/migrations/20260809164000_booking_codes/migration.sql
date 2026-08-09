-- Human-readable booking references for PayPal/admin reconciliation.
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "bookingCode" TEXT;

UPDATE "Appointment"
SET "bookingCode" = 'PP-' || to_char("createdAt", 'YYYYMMDD') || '-' || upper(substr(md5("id"), 1, 6))
WHERE "bookingCode" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "bookingCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_bookingCode_key" ON "Appointment"("bookingCode");
