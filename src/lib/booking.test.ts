import { describe, expect, it } from "bun:test";

import {
  getSessionAvailability,
  parseGuestBookingRequest,
  type SessionCapacitySnapshot,
} from "./booking";

describe("parseGuestBookingRequest", () => {
  it("accepts guest booking contact details and trims input", () => {
    expect(
      parseGuestBookingRequest({
        sessionId: "session_123",
        customerName: "  Jane Student  ",
        customerEmail: "  JANE@EXAMPLE.COM  ",
        customerPhone: "  416-555-0101  ",
        notes: "  Needs evening class  ",
      }),
    ).toEqual({
      sessionId: "session_123",
      customerName: "Jane Student",
      customerEmail: "jane@example.com",
      customerPhone: "416-555-0101",
      notes: "Needs evening class",
    });
  });

  it("rejects missing contact details or malformed email", () => {
    expect(parseGuestBookingRequest({ sessionId: "s1", customerName: "Jane" })).toBeNull();
    expect(
      parseGuestBookingRequest({
        sessionId: "s1",
        customerName: "Jane",
        customerEmail: "not-an-email",
        customerPhone: "416-555-0101",
      }),
    ).toBeNull();
  });
});

describe("getSessionAvailability", () => {
  const future = new Date("2099-03-15T10:00:00");

  it("marks a published future session with remaining capacity as bookable", () => {
    const session: SessionCapacitySnapshot = {
      status: "PUBLISHED",
      startTime: future,
      capacity: 8,
      bookings: [{ status: "PENDING" }, { status: "CONFIRMED" }],
    };

    expect(getSessionAvailability(session, new Date("2099-03-01T09:00:00"))).toEqual({
      remainingCapacity: 6,
      isBookable: true,
    });
  });

  it("does not count cancelled bookings against capacity", () => {
    const session: SessionCapacitySnapshot = {
      status: "PUBLISHED",
      startTime: future,
      capacity: 1,
      bookings: [{ status: "CANCELLED" }],
    };

    expect(getSessionAvailability(session, new Date("2099-03-01T09:00:00"))).toEqual({
      remainingCapacity: 1,
      isBookable: true,
    });
  });

  it("blocks draft, past, and full sessions", () => {
    expect(
      getSessionAvailability(
        { status: "DRAFT", startTime: future, capacity: 8, bookings: [] },
        new Date("2099-03-01T09:00:00"),
      ).isBookable,
    ).toBe(false);

    expect(
      getSessionAvailability(
        {
          status: "PUBLISHED",
          startTime: new Date("2020-01-01T10:00:00"),
          capacity: 8,
          bookings: [],
        },
        new Date("2099-03-01T09:00:00"),
      ).isBookable,
    ).toBe(false);

    expect(
      getSessionAvailability(
        {
          status: "PUBLISHED",
          startTime: future,
          capacity: 1,
          bookings: [{ status: "PENDING" }],
        },
        new Date("2099-03-01T09:00:00"),
      ).isBookable,
    ).toBe(false);
  });
});
