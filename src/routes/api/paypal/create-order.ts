import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { createBookingCode } from "@/lib/booking-code";
import { getSessionAvailability, parseGuestBookingRequest } from "@/lib/booking";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { expireAbandonedPayPalBookings } from "@/lib/payment-cleanup";
import { createPayPalOrder } from "@/lib/paypal";
import { getDb } from "@/lib/prisma";

const SETTINGS_ID = "default";

export const Route = createFileRoute("/api/paypal/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bookingRequest = parseGuestBookingRequest(await readJsonBody(request));
        if (!bookingRequest) {
          return jsonResponse(
            { message: "Session, name, valid email, and phone are required" },
            { status: 400 },
          );
        }

        try {
          const db = getDb();
          await expireAbandonedPayPalBookings(db);
          const settings = await db.paymentSettings.findUnique({ where: { id: SETTINGS_ID } });
          if (!settings || settings.paypalMode === "DISABLED") {
            return jsonResponse({ message: "PayPal checkout is not enabled" }, { status: 400 });
          }

          const session = await db.trainingSession.findUnique({
            where: { id: bookingRequest.sessionId },
            include: {
              course: true,
              appointments: { select: { status: true } },
            },
          });

          if (!session || !session.course.isPublished) {
            return jsonResponse(
              { message: "That training session is not available" },
              { status: 404 },
            );
          }

          if (!getSessionAvailability(session).isBookable) {
            return jsonResponse(
              { message: "That training session is full or no longer available" },
              { status: 409 },
            );
          }

          if (!session.course.priceCents || session.course.priceCents <= 0) {
            return jsonResponse(
              { message: "This training session does not have online checkout pricing" },
              { status: 400 },
            );
          }

          const url = new URL(request.url);
          const returnUrl = new URL("/book", url.origin);
          returnUrl.searchParams.set("paypal", "success");
          const cancelUrl = new URL("/book", url.origin);
          cancelUrl.searchParams.set("paypal", "cancelled");

          const bookingCode = createBookingCode();
          const sameDay =
            format(session.startTime, "yyyy-MM-dd") === format(session.endTime, "yyyy-MM-dd");
          const paymentDescription = sameDay
            ? `${session.course.title} — ${format(session.startTime, "PPP p")}–${format(session.endTime, "p")}`
            : `${session.course.title} — ${format(session.startTime, "PPP p")}–${format(session.endTime, "PPP p")}`;

          const order = await createPayPalOrder({
            settings,
            amountCents: session.course.priceCents,
            description: paymentDescription,
            referenceCode: bookingCode,
            returnUrl: returnUrl.toString(),
            cancelUrl: cancelUrl.toString(),
          });

          await db.appointment.create({
            data: {
              bookingCode,
              sessionId: session.id,
              customerName: bookingRequest.customerName,
              customerEmail: bookingRequest.customerEmail,
              customerPhone: bookingRequest.customerPhone,
              startTime: session.startTime,
              endTime: session.endTime,
              status: "PENDING",
              paymentStatus: "PENDING",
              paymentProvider: "PAYPAL",
              paypalOrderId: order.orderId,
              amountCents: session.course.priceCents,
              currency: settings.currency,
              notes: bookingRequest.notes,
            },
          });

          return jsonResponse(order, { status: 201 });
        } catch (error) {
          console.error("PayPal order create failed", error);
          return jsonResponse({ message: "Unable to start PayPal checkout" }, { status: 500 });
        }
      },
    },
  },
});
