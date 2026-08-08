import { createFileRoute } from "@tanstack/react-router";

import { getDayRange, getRemainingSlotTimes } from "@/lib/appointments";
import { jsonResponse } from "@/lib/http";
import { getDb } from "@/lib/prisma";

export const Route = createFileRoute("/api/appointments/slots")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const date = new URL(request.url).searchParams.get("date")?.trim() ?? "";
        const dayRange = getDayRange(date);

        if (!dayRange) {
          return jsonResponse({ message: "A valid date is required" }, { status: 400 });
        }

        try {
          const db = getDb();
          const existingAppointments = await db.appointment.findMany({
            where: {
              startTime: {
                gte: dayRange.start,
                lt: dayRange.end,
              },
              status: {
                not: "CANCELLED",
              },
            },
            select: {
              startTime: true,
            },
          });

          return jsonResponse(
            getRemainingSlotTimes(
              date,
              existingAppointments.map((appointment) => appointment.startTime),
            ),
          );
        } catch (error) {
          console.error("Appointment slots lookup failed", error);
          return jsonResponse({ message: "Unable to load appointment slots" }, { status: 500 });
        }
      },
    },
  },
});
