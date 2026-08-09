import { createFileRoute } from "@tanstack/react-router";

import { sendPaidBookingEmails } from "@/lib/booking-emails";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { capturePayPalOrder } from "@/lib/paypal";
import { getDb } from "@/lib/prisma";

const SETTINGS_ID = "default";

function readOrderId(input: unknown) {
  if (input == null || typeof input !== "object") return "";
  const value = (input as Record<string, unknown>)["orderId"];
  return typeof value === "string" ? value.trim() : "";
}

export const Route = createFileRoute("/api/paypal/capture-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const orderId = readOrderId(await readJsonBody(request));
        if (!orderId) {
          return jsonResponse({ message: "PayPal order id is required" }, { status: 400 });
        }

        try {
          const db = getDb();
          const booking = await db.appointment.findUnique({
            where: { paypalOrderId: orderId },
            include: { session: { include: { course: true } } },
          });
          if (!booking) {
            return jsonResponse(
              { message: "Booking for this PayPal order was not found" },
              { status: 404 },
            );
          }

          if (booking.paymentStatus === "PAID") {
            return jsonResponse({
              message: "Payment already captured",
              bookingId: booking.id,
              bookingCode: booking.bookingCode,
              courseTitle: booking.session?.course.title ?? "Training session",
              startTime: booking.startTime.toISOString(),
              endTime: booking.endTime.toISOString(),
              amountCents: booking.amountCents,
              currency: booking.currency,
            });
          }

          const settings = await db.paymentSettings.findUnique({ where: { id: SETTINGS_ID } });
          if (!settings || settings.paypalMode === "DISABLED") {
            return jsonResponse({ message: "PayPal checkout is not enabled" }, { status: 400 });
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
            message: "Payment captured and booking confirmed",
            bookingId: updatedBooking.id,
            bookingCode: updatedBooking.bookingCode,
            courseTitle: updatedBooking.session?.course.title ?? "Training session",
            startTime: updatedBooking.startTime.toISOString(),
            endTime: updatedBooking.endTime.toISOString(),
            amountCents: updatedBooking.amountCents,
            currency: updatedBooking.currency,
          });
        } catch (error) {
          console.error("PayPal order capture failed", error);
          return jsonResponse({ message: "Unable to capture PayPal payment" }, { status: 500 });
        }
      },
    },
  },
});
