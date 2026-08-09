import type { PrismaClient } from "@prisma/client";

const ABANDONED_PAYPAL_MINUTES = 30;

export async function expireAbandonedPayPalBookings(db: PrismaClient, now = new Date()) {
  const expiresBefore = new Date(now.getTime() - ABANDONED_PAYPAL_MINUTES * 60 * 1000);

  return db.appointment.updateMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentProvider: "PAYPAL",
      paypalCaptureId: null,
      createdAt: { lt: expiresBefore },
    },
    data: {
      status: "CANCELLED",
      paymentStatus: "FAILED",
      notes: "PayPal checkout expired before payment was completed.",
    },
  });
}

export { ABANDONED_PAYPAL_MINUTES };
