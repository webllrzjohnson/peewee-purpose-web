import { createFileRoute } from "@tanstack/react-router";

import { sendPaidBookingEmails } from "@/lib/booking-emails";
import { jsonResponse } from "@/lib/http";
import { capturePayPalOrder, verifyPayPalWebhook } from "@/lib/paypal";
import { getDb } from "@/lib/prisma";

const SETTINGS_ID = "default";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
  };
};

function parseWebhookEvent(rawBody: string): PayPalWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as PayPalWebhookEvent;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/paypal/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookId = process.env["PAYPAL_WEBHOOK_ID"]?.trim();
        if (!webhookId) {
          return jsonResponse({ message: "PayPal webhook is not configured" }, { status: 503 });
        }

        const rawBody = await request.text();
        const event = parseWebhookEvent(rawBody);
        if (!event) {
          return jsonResponse({ message: "Invalid PayPal webhook payload" }, { status: 400 });
        }

        try {
          const db = getDb();
          const settings = await db.paymentSettings.findUnique({ where: { id: SETTINGS_ID } });
          if (!settings || settings.paypalMode === "DISABLED") {
            return jsonResponse({ message: "PayPal checkout is not enabled" }, { status: 400 });
          }

          const verified = await verifyPayPalWebhook({
            settings,
            webhookId,
            rawBody,
            headers: request.headers,
          });

          if (!verified) {
            return jsonResponse({ message: "PayPal webhook verification failed" }, { status: 401 });
          }

          if (event.event_type !== "CHECKOUT.ORDER.APPROVED") {
            return jsonResponse({ received: true, ignored: event.event_type ?? "unknown" });
          }

          const orderId = event.resource?.id;
          if (!orderId) {
            return jsonResponse(
              { message: "PayPal order id missing from webhook" },
              { status: 400 },
            );
          }

          const booking = await db.appointment.findUnique({
            where: { paypalOrderId: orderId },
            include: { session: { include: { course: true } } },
          });
          if (!booking) {
            return jsonResponse({ received: true, ignored: "booking_not_found" });
          }

          if (booking.paymentStatus === "PAID") {
            return jsonResponse({ received: true, bookingId: booking.id, alreadyPaid: true });
          }

          const capture = await capturePayPalOrder(settings, orderId);
          const updatedBooking = await db.appointment.update({
            where: { id: booking.id },
            include: { session: { include: { course: true } } },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paypalCaptureId: capture.captureId,
              currency: capture.currency,
            },
          });

          await sendPaidBookingEmails({
            bookingCode: updatedBooking.bookingCode,
            customerName: updatedBooking.customerName,
            customerEmail: updatedBooking.customerEmail,
            customerPhone: updatedBooking.customerPhone,
            courseTitle: updatedBooking.session?.course.title ?? "Training session",
            startTime: updatedBooking.startTime,
            endTime: updatedBooking.endTime,
            amountCents: updatedBooking.amountCents,
            currency: updatedBooking.currency,
            paymentMethod: "PAYPAL",
            notes: updatedBooking.notes,
          });

          return jsonResponse({
            received: true,
            bookingId: updatedBooking.id,
            bookingCode: updatedBooking.bookingCode,
          });
        } catch (error) {
          console.error("PayPal webhook handling failed", error);
          return jsonResponse({ message: "Unable to process PayPal webhook" }, { status: 500 });
        }
      },
    },
  },
});
