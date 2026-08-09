import { describe, expect, it } from "bun:test";

import { parsePaymentSettingsPayload } from "./payment-settings";

describe("parsePaymentSettingsPayload", () => {
  it("accepts disabled PayPal settings without credentials", () => {
    expect(parsePaymentSettingsPayload({ paypalMode: "DISABLED", currency: "usd" })).toEqual({
      paypalMode: "DISABLED",
      paypalClientId: null,
      paypalClientSecret: null,
      currency: "USD",
    });
  });

  it("accepts sandbox PayPal settings with client credentials", () => {
    expect(
      parsePaymentSettingsPayload({
        paypalMode: "SANDBOX",
        paypalClientId: "client-id_1234567890",
        paypalClientSecret: "  secret value  ",
        currency: "cad",
      }),
    ).toEqual({
      paypalMode: "SANDBOX",
      paypalClientId: "client-id_1234567890",
      paypalClientSecret: "secret value",
      currency: "CAD",
    });
  });

  it("rejects enabled PayPal settings without a valid client id", () => {
    expect(parsePaymentSettingsPayload({ paypalMode: "LIVE", currency: "USD" })).toBeNull();
    expect(
      parsePaymentSettingsPayload({ paypalMode: "LIVE", paypalClientId: "short", currency: "USD" }),
    ).toBeNull();
  });

  it("rejects invalid modes and currency codes", () => {
    expect(parsePaymentSettingsPayload({ paypalMode: "TEST", currency: "USD" })).toBeNull();
    expect(
      parsePaymentSettingsPayload({
        paypalMode: "SANDBOX",
        paypalClientId: "client-id_1234567890",
        currency: "USDD",
      }),
    ).toBeNull();
  });
});
