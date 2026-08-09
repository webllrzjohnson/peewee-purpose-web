export type PayPalMode = "DISABLED" | "SANDBOX" | "LIVE";

export type PaymentSettingsPayload = {
  paypalMode: PayPalMode;
  paypalClientId: string | null;
  paypalClientSecret: string | null;
  currency: string;
};

const PAYPAL_CLIENT_ID_PATTERN = /^[A-Za-z0-9._-]{10,}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function readString(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value.trim() : "";
}

function parsePayPalMode(value: string): PayPalMode | null {
  if (value === "DISABLED" || value === "SANDBOX" || value === "LIVE") return value;
  return null;
}

export function parsePaymentSettingsPayload(input: unknown): PaymentSettingsPayload | null {
  if (input == null || typeof input !== "object") return null;

  const data = input as Record<string, unknown>;
  const paypalMode = parsePayPalMode(readString(data, "paypalMode"));
  const paypalClientId = readString(data, "paypalClientId");
  const paypalClientSecret = readString(data, "paypalClientSecret");
  const currency = readString(data, "currency").toUpperCase() || "USD";

  if (!paypalMode || !CURRENCY_PATTERN.test(currency)) return null;

  if (paypalMode !== "DISABLED") {
    if (!paypalClientId || !PAYPAL_CLIENT_ID_PATTERN.test(paypalClientId)) return null;
  }

  return {
    paypalMode,
    paypalClientId: paypalClientId || null,
    paypalClientSecret: paypalClientSecret || null,
    currency,
  };
}
