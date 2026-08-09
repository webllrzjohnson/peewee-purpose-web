import { createFileRoute } from "@tanstack/react-router";

import { getSessionAvailability } from "@/lib/booking";
import { jsonResponse } from "@/lib/http";
import { expireAbandonedPayPalBookings } from "@/lib/payment-cleanup";
import { getDb } from "@/lib/prisma";

export const Route = createFileRoute("/api/training-sessions")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = getDb();
          await expireAbandonedPayPalBookings(db);
          const sessions = await db.trainingSession.findMany({
            where: {
              status: "PUBLISHED",
              startTime: { gt: new Date() },
              course: { isPublished: true },
            },
            include: {
              course: true,
              appointments: { select: { status: true } },
            },
            orderBy: { startTime: "asc" },
          });

          return jsonResponse(
            sessions
              .map((session) => ({
                id: session.id,
                courseId: session.courseId,
                courseTitle: session.course.title,
                priceLabel: session.course.priceLabel,
                priceCents: session.course.priceCents,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime.toISOString(),
                capacity: session.capacity,
                location: session.location,
                ...getSessionAvailability(session),
              }))
              .filter((session) => session.isBookable),
          );
        } catch (error) {
          console.error("Training session lookup failed", error);
          return jsonResponse({ message: "Unable to load training sessions" }, { status: 500 });
        }
      },
    },
  },
});
