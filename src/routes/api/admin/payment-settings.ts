import { createFileRoute } from "@tanstack/react-router";

import { requireAdmin } from "@/lib/auth";
import { jsonResponse, readJsonBody } from "@/lib/http";
import { parsePaymentSettingsPayload } from "@/lib/payment-settings";
import { getDb } from "@/lib/prisma";
import { canEncryptSecrets, encryptSecret } from "@/lib/secret-box";

const SETTINGS_ID = "default";

function serializeSettings(settings: {
  paypalMode: "DISABLED" | "SANDBOX" | "LIVE";
  paypalClientId: string | null;
  encryptedPaypalClientSecret: string | null;
  currency: string;
}) {
  return {
    paypalMode: settings.paypalMode,
    paypalClientId: settings.paypalClientId,
    paypalClientSecretConfigured: Boolean(settings.encryptedPaypalClientSecret),
    currency: settings.currency,
    canStoreSecrets: canEncryptSecrets(),
  };
}

export const Route = createFileRoute("/api/admin/payment-settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const db = getDb();
        const settings = await db.paymentSettings.upsert({
          where: { id: SETTINGS_ID },
          create: { id: SETTINGS_ID },
          update: {},
        });

        return jsonResponse(serializeSettings(settings));
      },
      PATCH: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.user) return jsonResponse({ message: auth.message }, { status: auth.status });

        const payload = parsePaymentSettingsPayload(await readJsonBody(request));
        if (!payload) {
          return jsonResponse(
            { message: "PayPal mode, valid client ID, and three-letter currency are required" },
            { status: 400 },
          );
        }

        if (payload.paypalClientSecret && !canEncryptSecrets()) {
          return jsonResponse(
            { message: "Set PAYMENT_SETTINGS_ENCRYPTION_KEY or AUTH_SECRET before saving secrets" },
            { status: 400 },
          );
        }

        const db = getDb();
        const current = await db.paymentSettings.upsert({
          where: { id: SETTINGS_ID },
          create: { id: SETTINGS_ID },
          update: {},
        });

        const encryptedPaypalClientSecret = payload.paypalClientSecret
          ? await encryptSecret(payload.paypalClientSecret)
          : payload.paypalMode === "DISABLED"
            ? null
            : current.encryptedPaypalClientSecret;

        const settings = await db.paymentSettings.update({
          where: { id: SETTINGS_ID },
          data: {
            paypalMode: payload.paypalMode,
            paypalClientId: payload.paypalMode === "DISABLED" ? null : payload.paypalClientId,
            encryptedPaypalClientSecret,
            currency: payload.currency,
          },
        });

        return jsonResponse(serializeSettings(settings));
      },
    },
  },
});
