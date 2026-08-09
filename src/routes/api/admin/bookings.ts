import { createFileRoute } from "@tanstack/react-router";
import type { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { getDb } from "@/lib/prisma";

const BOOKING_VIEWS = ["needsAction", "upcoming", "history"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;
const APPOINTMENT_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const MAX_PAGE_SIZE = 100;

type BookingView = (typeof BOOKING_VIEWS)[number];

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseAppointmentStatus(value: string) {
  return APPOINTMENT_STATUSES.includes(value as (typeof APPOINTMENT_STATUSES)[number])
    ? (value as (typeof APPOINTMENT_STATUSES)[number])
    : null;
}

function parseBookingView(value: string | null): BookingView {
  return BOOKING_VIEWS.includes(value as BookingView) ? (value as BookingView) : "needsAction";
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parsePageSize(value: string | null) {
  const pageSize = Number(value);
  return Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : 25;
}

function buildViewWhere(view: BookingView, now: Date): Prisma.AppointmentWhereInput {
  if (view === "needsAction") {
    return {
      OR: [
        { status: "PENDING", paymentProvider: "ONSITE", paymentStatus: "UNPAID" },
        { status: "PENDING", paymentProvider: "PAYPAL", paymentStatus: "PENDING" },
        { paymentStatus: "FAILED" },
      ],
    };
  }

  if (view === "upcoming") {
    return {
      status: "CONFIRMED",
      startTime: { gte: now },
    };
  }

  return {
    OR: [
      { status: { in: ["COMPLETED", "CANCELLED"] } },
      { status: "CONFIRMED", startTime: { lt: now } },
    ],
  };
}

function buildSearchWhere(search: string): Prisma.AppointmentWhereInput | null {
  if (!search) return null;

  return {
    OR: [
      { bookingCode: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
      { paypalOrderId: { contains: search, mode: "insensitive" } },
      { paypalCaptureId: { contains: search, mode: "insensitive" } },
      { session: { course: { title: { contains: search, mode: "insensitive" } } } },
    ],
  };
}

export const Route = createFileRoute("/api/admin/bookings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const url = new URL(request.url);
        const view = parseBookingView(url.searchParams.get("view"));
        const page = parsePage(url.searchParams.get("page"));
        const pageSize = parsePageSize(url.searchParams.get("pageSize"));
        const search = (url.searchParams.get("search") ?? "").trim();
        const searchWhere = buildSearchWhere(search);
        const where: Prisma.AppointmentWhereInput = {
          AND: [buildViewWhere(view, new Date()), ...(searchWhere ? [searchWhere] : [])],
        };

        const db = getDb();
        const [bookings, totalItems, counts] = await Promise.all([
          db.appointment.findMany({
            where,
            include: {
              session: { include: { course: true } },
              user: { select: { email: true, name: true } },
            },
            orderBy: view === "history" ? { startTime: "desc" } : { startTime: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          db.appointment.count({ where }),
          Promise.all(
            BOOKING_VIEWS.map(
              async (nextView) =>
                [
                  nextView,
                  await db.appointment.count({ where: buildViewWhere(nextView, new Date()) }),
                ] as const,
            ),
          ),
        ]);

        return jsonResponse({
          data: bookings.map((booking) => ({
            id: booking.id,
            bookingCode: booking.bookingCode,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            paymentProvider: booking.paymentProvider,
            paypalOrderId: booking.paypalOrderId,
            paypalCaptureId: booking.paypalCaptureId,
            amountCents: booking.amountCents,
            currency: booking.currency,
            notes: booking.notes,
            courseTitle: booking.session?.course.title ?? "Legacy appointment",
            sessionId: booking.sessionId,
          })),
          counts: Object.fromEntries(counts),
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
          },
        });
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const body = await readJsonBody(request);
        if (body == null || typeof body !== "object") {
          return jsonResponse({ message: "Invalid request" }, { status: 400 });
        }

        const data = body as Record<string, unknown>;
        const id = readString(data, "id");
        const status = parseAppointmentStatus(readString(data, "status"));
        const notes = readString(data, "notes");

        if (!id || !status) {
          return jsonResponse({ message: "Booking id and status are required" }, { status: 400 });
        }

        try {
          const db = getDb();
          const booking = await db.appointment.update({
            where: { id },
            data: { status, notes: notes || null },
          });
          return jsonResponse(booking);
        } catch (error) {
          console.error("Admin booking update failed", error);
          return jsonResponse({ message: "Unable to update booking" }, { status: 500 });
        }
      },
    },
  },
});
