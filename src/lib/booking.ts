type BookingStatusLike = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
type SessionStatusLike = "DRAFT" | "PUBLISHED" | "CANCELLED";

export type GuestBookingRequest = {
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
};

export type SessionCapacitySnapshot = {
  status: SessionStatusLike;
  startTime: Date;
  capacity: number;
  bookings?: Array<{ status: BookingStatusLike }>;
  appointments?: Array<{ status: BookingStatusLike }>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTrimmedString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

export function parseGuestBookingRequest(input: unknown): GuestBookingRequest | null {
  if (input == null || typeof input !== "object") {
    return null;
  }

  const data = input as Record<string, unknown>;
  const sessionId = readTrimmedString(data, "sessionId");
  const customerName = readTrimmedString(data, "customerName");
  const customerEmail = readTrimmedString(data, "customerEmail").toLowerCase();
  const customerPhone = readTrimmedString(data, "customerPhone");
  const notes = readTrimmedString(data, "notes");

  if (!sessionId || !customerName || !customerPhone || !EMAIL_PATTERN.test(customerEmail)) {
    return null;
  }

  return {
    sessionId,
    customerName,
    customerEmail,
    customerPhone,
    notes: notes || null,
  };
}

export function getSessionAvailability(session: SessionCapacitySnapshot, now = new Date()) {
  const bookings = session.bookings ?? session.appointments ?? [];
  const activeBookingCount = bookings.filter(
    (booking) => booking.status === "PENDING" || booking.status === "CONFIRMED",
  ).length;
  const remainingCapacity = Math.max(session.capacity - activeBookingCount, 0);

  return {
    remainingCapacity,
    isBookable: session.status === "PUBLISHED" && session.startTime > now && remainingCapacity > 0,
  };
}
