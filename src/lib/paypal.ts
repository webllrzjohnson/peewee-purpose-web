import { decryptSecret } from "./secret-box";

type PaymentSettingsRecord = {
  paypalMode: "DISABLED" | "SANDBOX" | "LIVE";
  paypalClientId: string | null;
  encryptedPaypalClientSecret: string | null;
  currency: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  links?: Array<{ href?: string; rel?: string }>;
};

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

type PayPalWebhookVerificationResponse = {
  verification_status?: "SUCCESS" | "FAILURE";
};

function getPayPalBaseUrl(mode: PaymentSettingsRecord["paypalMode"]) {
  return mode === "LIVE" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function centsToAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function makeBasicAuth(clientId: string, clientSecret: string) {
  return btoa(`${clientId}:${clientSecret}`);
}

async function getAccessToken(settings: PaymentSettingsRecord) {
  if (settings.paypalMode === "DISABLED" || !settings.paypalClientId) {
    throw new Error("PayPal is not enabled");
  }

  const clientSecret = settings.encryptedPaypalClientSecret
    ? await decryptSecret(settings.encryptedPaypalClientSecret)
    : null;

  if (!clientSecret) {
    throw new Error("PayPal client secret is not configured or cannot be decrypted");
  }

  const response = await fetch(`${getPayPalBaseUrl(settings.paypalMode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${makeBasicAuth(settings.paypalClientId, clientSecret)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("PayPal did not return an access token");
  }

  return data.access_token;
}

export async function createPayPalOrder({
  settings,
  amountCents,
  description,
  referenceCode,
  returnUrl,
  cancelUrl,
}: {
  settings: PaymentSettingsRecord;
  amountCents: number;
  description: string;
  referenceCode: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const accessToken = await getAccessToken(settings);
  const response = await fetch(`${getPayPalBaseUrl(settings.paypalMode)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          custom_id: referenceCode,
          invoice_id: referenceCode,
          amount: {
            currency_code: settings.currency,
            value: centsToAmount(amountCents),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to create PayPal order");
  }

  const order = (await response.json()) as PayPalOrderResponse;
  const approveUrl = order.links?.find((link) => link.rel === "payer-action")?.href;

  if (!order.id || !approveUrl) {
    throw new Error("PayPal order response was incomplete");
  }

  return { orderId: order.id, approveUrl };
}

export async function capturePayPalOrder(settings: PaymentSettingsRecord, orderId: string) {
  const accessToken = await getAccessToken(settings);
  const response = await fetch(
    `${getPayPalBaseUrl(settings.paypalMode)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to capture PayPal order");
  }

  const data = (await response.json()) as PayPalCaptureResponse;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  if (data.status !== "COMPLETED" || !capture?.id || capture.status !== "COMPLETED") {
    throw new Error("PayPal order capture was not completed");
  }

  return {
    orderId: data.id ?? orderId,
    captureId: capture.id,
    currency: capture.amount?.currency_code ?? settings.currency,
    amountValue: capture.amount?.value ?? null,
  };
}

export async function verifyPayPalWebhook({
  settings,
  webhookId,
  rawBody,
  headers,
}: {
  settings: PaymentSettingsRecord;
  webhookId: string;
  rawBody: string;
  headers: Headers;
}) {
  const accessToken = await getAccessToken(settings);
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const response = await fetch(
    `${getPayPalBaseUrl(settings.paypalMode)}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    },
  );

  if (!response.ok) return false;
  const data = (await response.json()) as PayPalWebhookVerificationResponse;
  return data.verification_status === "SUCCESS";
}
