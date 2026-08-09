import { describe, expect, it } from "bun:test";

import { buildBookingEmailPreview } from "./booking-emails";

describe("booking email previews", () => {
  it("includes the booking reference and multi-day schedule", () => {
    const preview = buildBookingEmailPreview({
      bookingCode: "PP-20260809-1234",
      customerName: "Jane Student",
      customerEmail: "jane@example.com",
      customerPhone: "416-555-0101",
      courseTitle: "Advanced CPR",
      startTime: new Date("2026-08-20T09:00:00"),
      endTime: new Date("2026-08-22T16:00:00"),
      amountCents: 19900,
      currency: "CAD",
      paymentMethod: "PAYPAL",
      notes: "Storm date makeup class",
    });

    expect(preview.customerPaidText).toContain("PP-20260809-1234");
    expect(preview.customerPaidText).toContain("Advanced CPR");
    expect(preview.customerPaidText).toContain("August 20th, 2026");
    expect(preview.customerPaidText).toContain("August 22nd, 2026");
    expect(preview.adminRequestText).toContain("jane@example.com");
  });
});
