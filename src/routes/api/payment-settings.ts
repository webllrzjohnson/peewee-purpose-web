import { createFileRoute } from "@tanstack/react-router";

import { jsonResponse } from "@/lib/http";
import { getDb } from "@/lib/prisma";

const SETTINGS_ID = "default";

export const Route = createFileRoute("/api/payment-settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = getDb();
          const settings = await db.paymentSettings.findUnique({ where: { id: SETTINGS_ID } });
          return jsonResponse({
            paypalMode: settings?.paypalMode ?? "DISABLED",
            currency: settings?.currency ?? "USD",
            isPayPalEnabled: Boolean(
              settings &&
              settings.paypalMode !== "DISABLED" &&
              settings.paypalClientId &&
              settings.encryptedPaypalClientSecret,
            ),
          });
        } catch (error) {
          console.error("Public payment settings lookup failed", error);
          return jsonResponse({ paypalMode: "DISABLED", currency: "USD", isPayPalEnabled: false });
        }
      },
    },
  },
});
