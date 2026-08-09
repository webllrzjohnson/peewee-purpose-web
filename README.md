# Purposeful CPR

A professional website for CPR certification and training, focusing on professionalism and credibility.

## Development

Prefer working locally?

```sh
npm i
npm run dev
```

## PayPal webhook testing notes

The normal PayPal checkout flow can be tested locally in sandbox mode:

1. A customer selects **Pay now with PayPal** on `/book`.
2. PayPal Sandbox approves the payment.
3. The browser returns to `/book`.
4. The app captures the payment server-side.
5. The booking is confirmed and displays the booking reference.

This return/capture flow does **not** require PayPal webhooks.

PayPal webhooks are a backup path for cases where the customer pays but does not return to the site, such as closing the browser, mobile app interruption, or redirect failure. Webhooks require PayPal to reach a public HTTPS endpoint, so a local URL such as `http://localhost:8080/api/paypal/webhook` cannot be fully tested directly from PayPal.

To test or enable webhooks, use one of these options:

- Deploy the app and register the production webhook URL in PayPal Sandbox/Live:

  ```text
  https://your-domain.com/api/paypal/webhook
  ```

- Or expose local development with a public HTTPS tunnel such as ngrok or Cloudflare Tunnel, then register the tunnel URL:

  ```text
  https://your-tunnel-url.example/api/paypal/webhook
  ```

After creating the webhook in PayPal, set this environment variable:

```env
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

Subscribe the webhook to at least:

```text
CHECKOUT.ORDER.APPROVED
```

If `PAYPAL_WEBHOOK_ID` is not configured, normal PayPal checkout return/capture still works, but `/api/paypal/webhook` will return a “not configured” response.

## Booking email notifications

Booking emails are optional and use Resend's HTTPS email API so the app can run in serverless environments without direct SMTP access.

When configured, the app sends:

- a customer email for pay-on-site booking requests
- an admin email for new booking requests
- a customer email after PayPal payment is captured
- an admin email after PayPal payment is confirmed

Required environment variables:

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Purposeful CPR <bookings@your-domain.com>"
BOOKING_ADMIN_EMAIL=admin@example.com
```

`BOOKING_ADMIN_EMAIL` can also be provided as `NOTIFICATION_EMAIL_TO`.

If `RESEND_API_KEY` or `EMAIL_FROM` is missing, booking and payment still succeed, and the app logs that email notification was skipped.
