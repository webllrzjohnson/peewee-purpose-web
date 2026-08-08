import { createFileRoute } from "@tanstack/react-router";
import { Prisma } from "@prisma/client";

import {
  getAppointmentEndTime,
  getAppointmentStartTime,
  isPastAppointment,
  parseAppointmentRequest,
} from "@/lib/appointments";
import { getSession } from "@/lib/auth";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

export const Route = createFileRoute("/api/appointments/book")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await getSession(request);
        const userId = typeof session?.["userId"] === "string" ? session["userId"] : null;

        if (!userId) {
          return jsonResponse({ message: "Authentication required" }, { status: 401 });
        }

        const appointmentRequest = parseAppointmentRequest(await readJsonBody(request));
        if (!appointmentRequest) {
          return jsonResponse(
            { message: "A valid date and time slot are required" },
            { status: 400 },
          );
        }

        const startTime = getAppointmentStartTime(appointmentRequest);
        if (!startTime) {
          return jsonResponse(
            { message: "A valid date and time slot are required" },
            { status: 400 },
          );
        }

        if (isPastAppointment(startTime)) {
          return jsonResponse(
            { message: "Please choose a future appointment slot" },
            { status: 400 },
          );
        }

        try {
          const db = getDb();
          await db.appointment.create({
            data: {
              userId,
              startTime,
              endTime: getAppointmentEndTime(startTime),
              status: "PENDING",
            },
          });

          return jsonResponse({ message: "Appointment booked successfully" }, { status: 201 });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return jsonResponse(
              { message: "That appointment slot is no longer available" },
              { status: 409 },
            );
          }

          console.error("Appointment booking failed", error);
          return jsonResponse({ message: "Booking failed" }, { status: 500 });
        }
      },
    },
  },
});
