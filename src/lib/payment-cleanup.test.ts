import { describe, expect, it } from "bun:test";

import { ABANDONED_PAYPAL_MINUTES } from "./payment-cleanup";

describe("payment cleanup settings", () => {
  it("expires abandoned PayPal bookings after a short operational window", () => {
    expect(ABANDONED_PAYPAL_MINUTES).toBe(30);
  });
});
