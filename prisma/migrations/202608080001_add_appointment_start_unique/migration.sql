-- Baseline local schema for existing Prisma models plus duplicate-slot protection.
-- Uses idempotent DDL because this project had a schema but no tracked migrations.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentStatus') THEN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_startTime_key" ON "Appointment"("startTime");
CREATE INDEX IF NOT EXISTS "Appointment_startTime_endTime_idx" ON "Appointment"("startTime", "endTime");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Appointment_userId_fkey'
  ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
