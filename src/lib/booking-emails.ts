import type { Prisma } from "@prisma/client";
import { format } from "date-fns";

const resendApiKey = process.env["RESEND_API_KEY"]?.trim();
const emailFrom = process.env["EMAIL_FROM"]?.trim();
const adminEmail =
  process.env["BOOKING_ADMIN_EMAIL"]?.trim() || process.env["NOTIFICATION_EMAIL_TO"]?.trim();

export type BookingEmailDetails = {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  courseTitle: string;
  startTime: Date;
  endTime: Date;
  amountCents: number | null;
  currency: string | null;
  paymentMethod: "PAYPAL" | "ONSITE" | "MANUAL";
  notes: string | null;
};

type BookingWithSession = Prisma.AppointmentGetPayload<{
  include: { session: { include: { course: true } } };
}>;

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function isEmailConfigured() {
  return Boolean(resendApiKey && emailFrom);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatSessionRange(details: Pick<BookingEmailDetails, "startTime" | "endTime">) {
  const sameDay = format(details.startTime, "yyyy-MM-dd") === format(details.endTime, "yyyy-MM-dd");
  return sameDay
    ? `${format(details.startTime, "PPP p")}–${format(details.endTime, "p")}`
    : `${format(details.startTime, "PPP p")}–${format(details.endTime, "PPP p")}`;
}

function formatAmount(amountCents: number | null, currency: string | null) {
  if (amountCents == null || !currency) return "To be confirmed";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

function buildCustomerSubject(details: BookingEmailDetails, paid: boolean) {
  return paid
    ? `Payment received: ${details.courseTitle} (${details.bookingCode})`
    : `Booking request received: ${details.courseTitle} (${details.bookingCode})`;
}

function isPaidBooking(details: BookingEmailDetails) {
  return details.paymentMethod === "PAYPAL" && details.amountCents != null;
}

export function buildBookingEmailDetails(booking: BookingWithSession): BookingEmailDetails {
  return {
    bookingCode: booking.bookingCode,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    courseTitle: booking.session?.course.title ?? "Training session",
    startTime: booking.startTime,
    endTime: booking.endTime,
    amountCents: booking.amountCents,
    currency: booking.currency,
    paymentMethod: booking.paymentProvider === "PAYPAL" ? "PAYPAL" : "ONSITE",
    notes: booking.notes,
  };
}

function buildCustomerText(details: BookingEmailDetails, paid: boolean) {
  const statusLine = paid
    ? "Your payment was received and your booking is confirmed."
    : "Your booking request was received. We will review it and confirm your training session.";

  return [
    `Hi ${details.customerName},`,
    "",
    statusLine,
    "",
    `Booking reference: ${details.bookingCode}`,
    `Class: ${details.courseTitle}`,
    `Schedule: ${formatSessionRange(details)}`,
    `Amount: ${formatAmount(details.amountCents, details.currency)}`,
    `Payment method: ${details.paymentMethod === "PAYPAL" ? "PayPal" : "Pay on site"}`,
    "",
    "Please keep this email for your records.",
    "",
    "Purposeful CPR",
  ].join("\n");
}

function buildCustomerHtml(details: BookingEmailDetails, paid: boolean) {
  const statusLine = paid
    ? "Your payment was received and your booking is confirmed."
    : "Your booking request was received. We will review it and confirm your training session.";

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <p>Hi ${escapeHtml(details.customerName)},</p>
      <p>${escapeHtml(statusLine)}</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Booking reference</td><td><strong>${escapeHtml(details.bookingCode)}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Class</td><td>${escapeHtml(details.courseTitle)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Schedule</td><td>${escapeHtml(formatSessionRange(details))}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Amount</td><td>${escapeHtml(formatAmount(details.amountCents, details.currency))}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Payment method</td><td>${details.paymentMethod === "PAYPAL" ? "PayPal" : "Pay on site"}</td></tr>
      </table>
      <p>Please keep this email for your records.</p>
      <p>Purposeful CPR</p>
    </div>
  `;
}

function buildAdminText(details: BookingEmailDetails, paid: boolean) {
  return [
    paid ? "A PayPal booking payment was confirmed." : "A new booking request was submitted.",
    "",
    `Booking reference: ${details.bookingCode}`,
    `Class: ${details.courseTitle}`,
    `Schedule: ${formatSessionRange(details)}`,
    `Amount: ${formatAmount(details.amountCents, details.currency)}`,
    `Payment method: ${details.paymentMethod === "PAYPAL" ? "PayPal" : "Pay on site"}`,
    "",
    `Customer: ${details.customerName}`,
    `Email: ${details.customerEmail}`,
    `Phone: ${details.customerPhone}`,
    `Notes: ${details.notes || "None"}`,
  ].join("\n");
}

function buildAdminHtml(details: BookingEmailDetails, paid: boolean) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <p>${paid ? "A PayPal booking payment was confirmed." : "A new booking request was submitted."}</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Booking reference</td><td><strong>${escapeHtml(details.bookingCode)}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Class</td><td>${escapeHtml(details.courseTitle)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Schedule</td><td>${escapeHtml(formatSessionRange(details))}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Amount</td><td>${escapeHtml(formatAmount(details.amountCents, details.currency))}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Payment method</td><td>${details.paymentMethod === "PAYPAL" ? "PayPal" : "Pay on site"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Customer</td><td>${escapeHtml(details.customerName)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Email</td><td>${escapeHtml(details.customerEmail)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Phone</td><td>${escapeHtml(details.customerPhone)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Notes</td><td>${escapeHtml(details.notes || "None")}</td></tr>
      </table>
    </div>
  `;
}

async function sendEmail(input: SendEmailInput) {
  if (!isEmailConfigured()) {
    console.info("Email notification skipped: RESEND_API_KEY and EMAIL_FROM are not configured");
    return { sent: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unable to read provider response");
    throw new Error(
      `Email provider rejected message with status ${response.status}: ${errorText.slice(0, 500)}`,
    );
  }

  return { sent: true, skipped: false };
}

async function sendSafely(input: SendEmailInput) {
  try {
    await sendEmail(input);
  } catch (error) {
    console.error("Email notification failed", error);
  }
}

export async function sendBookingRequestEmails(details: BookingEmailDetails) {
  await Promise.all([
    sendSafely({
      to: details.customerEmail,
      subject: buildCustomerSubject(details, false),
      text: buildCustomerText(details, false),
      html: buildCustomerHtml(details, false),
    }),
    adminEmail
      ? sendSafely({
          to: adminEmail,
          subject: `New booking request: ${details.courseTitle} (${details.bookingCode})`,
          text: buildAdminText(details, false),
          html: buildAdminHtml(details, false),
        })
      : Promise.resolve(),
  ]);
}

export async function sendPaidBookingEmails(details: BookingEmailDetails) {
  await Promise.all([
    sendSafely({
      to: details.customerEmail,
      subject: buildCustomerSubject(details, true),
      text: buildCustomerText(details, true),
      html: buildCustomerHtml(details, true),
    }),
    adminEmail
      ? sendSafely({
          to: adminEmail,
          subject: `Paid booking confirmed: ${details.courseTitle} (${details.bookingCode})`,
          text: buildAdminText(details, true),
          html: buildAdminHtml(details, true),
        })
      : Promise.resolve(),
  ]);
}

export async function resendBookingConfirmationEmail(details: BookingEmailDetails) {
  const paid = isPaidBooking(details);
  await sendEmail({
    to: details.customerEmail,
    subject: `Resent confirmation: ${details.courseTitle} (${details.bookingCode})`,
    text: buildCustomerText(details, paid),
    html: buildCustomerHtml(details, paid),
  });
}

export async function sendBookingUpdateEmail(details: BookingEmailDetails) {
  await sendSafely({
    to: details.customerEmail,
    subject: `Booking update: ${details.courseTitle} (${details.bookingCode})`,
    text: [
      `Hi ${details.customerName},`,
      "",
      "Your training booking details have been updated.",
      "",
      `Booking reference: ${details.bookingCode}`,
      `Class: ${details.courseTitle}`,
      `Schedule: ${formatSessionRange(details)}`,
      `Amount: ${formatAmount(details.amountCents, details.currency)}`,
      "",
      "Please keep this email for your records.",
      "",
      "Purposeful CPR",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <p>Hi ${escapeHtml(details.customerName)},</p>
        <p>Your training booking details have been updated.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Booking reference</td><td><strong>${escapeHtml(details.bookingCode)}</strong></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Class</td><td>${escapeHtml(details.courseTitle)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Schedule</td><td>${escapeHtml(formatSessionRange(details))}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; color: #475569;">Amount</td><td>${escapeHtml(formatAmount(details.amountCents, details.currency))}</td></tr>
        </table>
        <p>Please keep this email for your records.</p>
        <p>Purposeful CPR</p>
      </div>
    `,
  });
}

export function buildBookingEmailPreview(details: BookingEmailDetails) {
  return {
    customerRequestText: buildCustomerText(details, false),
    customerPaidText: buildCustomerText(details, true),
    adminRequestText: buildAdminText(details, false),
    adminPaidText: buildAdminText(details, true),
  };
}
