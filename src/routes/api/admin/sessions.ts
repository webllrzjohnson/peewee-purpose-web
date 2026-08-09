import { createFileRoute } from "@tanstack/react-router";
import { addMinutes, isValid, parseISO } from "date-fns";

import { getSessionAvailability } from "@/lib/booking";
import { requireAdmin } from "@/lib/auth";
import { buildBookingEmailDetails, sendBookingUpdateEmail } from "@/lib/booking-emails";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(data: Record<string, unknown>, key: string, fallback: number) {
  const value = data[key];
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : fallback;
}

function parseSessionDateTime(data: Record<string, unknown>) {
  const date = readString(data, "startDate") || readString(data, "date");
  const endDate = readString(data, "endDate") || date;
  const startTime = readString(data, "startTime");
  const endTime = readString(data, "endTime");

  const start = parseISO(`${date}T${startTime}:00`);
  const end = endTime ? parseISO(`${endDate}T${endTime}:00`) : addMinutes(start, 120);

  if (!date || !endDate || !startTime || !isValid(start) || !isValid(end) || end <= start) {
    return null;
  }

  return { start, end };
}

function parseStatus(value: string) {
  return value === "DRAFT" || value === "PUBLISHED" || value === "CANCELLED" ? value : "DRAFT";
}

function parseSessionPayload(input: unknown) {
  if (input == null || typeof input !== "object") return null;

  const data = input as Record<string, unknown>;
  const courseId = readString(data, "courseId");
  const dateTime = parseSessionDateTime(data);
  const capacity = readInteger(data, "capacity", 1);

  if (!courseId || !dateTime || capacity < 1) return null;

  return {
    courseId,
    startTime: dateTime.start,
    endTime: dateTime.end,
    capacity,
    location: readString(data, "location") || null,
    status: parseStatus(readString(data, "status")),
  };
}

export const Route = createFileRoute("/api/admin/sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const db = getDb();
        const sessions = await db.trainingSession.findMany({
          include: {
            course: true,
            appointments: { select: { status: true } },
          },
          orderBy: { startTime: "asc" },
        });

        return jsonResponse(
          sessions.map((session) => ({
            id: session.id,
            courseId: session.courseId,
            courseTitle: session.course.title,
            startTime: session.startTime.toISOString(),
            endTime: session.endTime.toISOString(),
            capacity: session.capacity,
            location: session.location,
            status: session.status,
            bookingCount: session.appointments.filter(
              (booking) => booking.status === "PENDING" || booking.status === "CONFIRMED",
            ).length,
            ...getSessionAvailability(session),
          })),
        );
      },
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const payload = parseSessionPayload(await readJsonBody(request));
        if (!payload) {
          return jsonResponse(
            { message: "Course, date, valid time range, and capacity are required" },
            { status: 400 },
          );
        }

        try {
          const db = getDb();
          const session = await db.trainingSession.create({ data: payload });
          return jsonResponse(session, { status: 201 });
        } catch (error) {
          console.error("Admin session create failed", error);
          return jsonResponse({ message: "Unable to save session" }, { status: 500 });
        }
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const body = await readJsonBody(request);
        if (body == null || typeof body !== "object") {
          return jsonResponse({ message: "Invalid request" }, { status: 400 });
        }

        const id = readString(body as Record<string, unknown>, "id");
        const payload = parseSessionPayload(body);
        if (!id || !payload)
          return jsonResponse(
            { message: "Session id and valid fields are required" },
            { status: 400 },
          );

        try {
          const db = getDb();
          const activeBookings = await db.appointment.count({
            where: { sessionId: id, status: { in: ["PENDING", "CONFIRMED"] } },
          });
          if (payload.capacity < activeBookings && payload.status !== "CANCELLED") {
            return jsonResponse(
              { message: "Capacity cannot be lower than active booking count" },
              { status: 400 },
            );
          }

          const { session, updatedBookings } = await db.$transaction(async (tx) => {
            const updatedSession = await tx.trainingSession.update({
              where: { id },
              data: payload,
            });
            await tx.appointment.updateMany({
              where: { sessionId: id, status: { in: ["PENDING", "CONFIRMED"] } },
              data: { startTime: payload.startTime, endTime: payload.endTime },
            });
            const bookings = await tx.appointment.findMany({
              where: { sessionId: id, status: { in: ["PENDING", "CONFIRMED"] } },
              include: { session: { include: { course: true } } },
            });
            return { session: updatedSession, updatedBookings: bookings };
          });
          await Promise.all(
            updatedBookings.map((booking) =>
              sendBookingUpdateEmail(buildBookingEmailDetails(booking)),
            ),
          );
          return jsonResponse(session);
        } catch (error) {
          console.error("Admin session update failed", error);
          return jsonResponse({ message: "Unable to update session" }, { status: 500 });
        }
      },
    },
  },
});
