import { describe, expect, it } from "bun:test";

import { createBookingCode } from "./booking-code";

describe("createBookingCode", () => {
  it("creates a readable date-based booking code", () => {
    expect(createBookingCode(new Date("2026-08-09T12:00:00.000Z"), 0)).toBe("PP-20260809-0000");
  });

  it("pads the random suffix", () => {
    expect(createBookingCode(new Date("2026-08-09T12:00:00.000Z"), 1 / 36 ** 4)).toBe(
      "PP-20260809-0001",
    );
  });
});
