import { createFileRoute } from "@tanstack/react-router";

import { createBookingCode } from "@/lib/booking-code";
import { sendBookingRequestEmails } from "@/lib/booking-emails";
import { getSessionAvailability, parseGuestBookingRequest } from "@/lib/booking";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

export const Route = createFileRoute("/api/appointments/book")({
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
          const settings = await db.paymentSettings.findUnique({ where: { id: "default" } });
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

          const availability = getSessionAvailability(session);
          if (!availability.isBookable) {
            return jsonResponse(
              { message: "That training session is full or no longer available" },
              { status: 409 },
            );
          }

          const booking = await db.appointment.create({
            data: {
              bookingCode: createBookingCode(),
              sessionId: session.id,
              customerName: bookingRequest.customerName,
              customerEmail: bookingRequest.customerEmail,
              customerPhone: bookingRequest.customerPhone,
              startTime: session.startTime,
              endTime: session.endTime,
              status: "PENDING",
              paymentStatus: "UNPAID",
              paymentProvider: session.course.priceCents ? "ONSITE" : null,
              amountCents: session.course.priceCents,
              currency: session.course.priceCents ? (settings?.currency ?? "USD") : null,
              notes: bookingRequest.notes,
            },
          });

          await sendBookingRequestEmails({
            bookingCode: booking.bookingCode,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            courseTitle: session.course.title,
            startTime: booking.startTime,
            endTime: booking.endTime,
            amountCents: booking.amountCents,
            currency: booking.currency,
            paymentMethod: "ONSITE",
            notes: booking.notes,
          });

          return jsonResponse(
            { message: "Booking request submitted successfully" },
            { status: 201 },
          );
        } catch (error) {
          console.error("Guest booking failed", error);
          return jsonResponse({ message: "Booking failed" }, { status: 500 });
        }
      },
    },
  },
});
