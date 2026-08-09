-- Admin-managed courses, training sessions, and guest booking support.
-- Idempotent because this Lovable-synced project may have local databases at different states.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrainingSessionStatus') THEN
    CREATE TYPE "TrainingSessionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CourseOffering" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "description" TEXT,
  "details" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "priceLabel" TEXT NOT NULL,
  "ctaLabel" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrainingSession" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 1,
  "location" TEXT,
  "status" "TrainingSessionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourseOffering_slug_key" ON "CourseOffering"("slug");
CREATE INDEX IF NOT EXISTS "CourseOffering_isPublished_sortOrder_idx" ON "CourseOffering"("isPublished", "sortOrder");
CREATE INDEX IF NOT EXISTS "TrainingSession_status_startTime_idx" ON "TrainingSession"("status", "startTime");
CREATE INDEX IF NOT EXISTS "TrainingSession_courseId_startTime_idx" ON "TrainingSession"("courseId", "startTime");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TrainingSession_courseId_fkey'
  ) THEN
    ALTER TABLE "TrainingSession"
      ADD CONSTRAINT "TrainingSession_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;

UPDATE "Appointment"
SET
  "customerName" = COALESCE("customerName", 'Existing customer'),
  "customerEmail" = COALESCE("customerEmail", 'unknown@example.com'),
  "customerPhone" = COALESCE("customerPhone", 'Unknown')
WHERE "customerName" IS NULL OR "customerEmail" IS NULL OR "customerPhone" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "customerName" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "customerEmail" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "customerPhone" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "userId" DROP NOT NULL;

DROP INDEX IF EXISTS "Appointment_startTime_key";
CREATE INDEX IF NOT EXISTS "Appointment_customerEmail_idx" ON "Appointment"("customerEmail");
CREATE INDEX IF NOT EXISTS "Appointment_sessionId_status_idx" ON "Appointment"("sessionId", "status");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_userId_fkey') THEN
    ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";
  END IF;

  ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_sessionId_fkey') THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
