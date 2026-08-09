import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  sessionId: z.string().min(1, "Please select a training session"),
  customerName: z.string().min(2, "Please enter your name"),
  customerEmail: z.string().email("Please enter a valid email"),
  customerPhone: z.string().min(7, "Please enter your phone number"),
  paymentMethod: z.enum(["PAYPAL", "ONSITE"]),
  notes: z.string().optional(),
});

type TrainingSessionOption = {
  id: string;
  courseTitle: string;
  priceLabel: string;
  priceCents: number | null;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  location: string | null;
};

type PublicPaymentSettings = {
  paypalMode: "DISABLED" | "SANDBOX" | "LIVE";
  currency: string;
  isPayPalEnabled: boolean;
};

type PaymentConfirmation = {
  bookingCode: string;
  courseTitle: string;
  startTime: string;
  endTime: string;
  amountCents: number | null;
  currency: string | null;
};

export const Route = createFileRoute("/book")({
  component: BookingComponent,
});

function BookingComponent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<TrainingSessionOption[]>([]);
  const [sessionMessage, setSessionMessage] = useState("Loading available classes...");
  const [paymentSettings, setPaymentSettings] = useState<PublicPaymentSettings>({
    paypalMode: "DISABLED",
    currency: "USD",
    isPayPalEnabled: false,
  });
  const [paymentConfirmation, setPaymentConfirmation] = useState<PaymentConfirmation | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      sessionId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentMethod: "PAYPAL",
      notes: "",
    },
  });

  const selectedSessionId = watch("sessionId");
  const paymentMethod = watch("paymentMethod");
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const canPayWithPayPal = Boolean(
    paymentSettings.isPayPalEnabled &&
    selectedSession?.priceCents &&
    selectedSession.priceCents > 0,
  );
  const shouldPayWithPayPal = canPayWithPayPal && paymentMethod === "PAYPAL";

  function formatSessionRange(session: TrainingSessionOption) {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const isSameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
    return isSameDay
      ? `${format(start, "PPP p")}–${format(end, "p")}`
      : `${format(start, "PPP p")}–${format(end, "PPP p")}`;
  }

  function formatConfirmationRange(confirmation: PaymentConfirmation) {
    const start = new Date(confirmation.startTime);
    const end = new Date(confirmation.endTime);
    const isSameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
    return isSameDay
      ? `${format(start, "PPP p")}–${format(end, "p")}`
      : `${format(start, "PPP p")}–${format(end, "PPP p")}`;
  }

  function formatMoney(amountCents: number | null, currency: string | null) {
    if (amountCents == null || !currency) return "";
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amountCents / 100,
    );
  }

  async function loadSessions() {
    try {
      const res = await fetch("/api/training-sessions");
      if (!res.ok) {
        setSessionMessage(
          "Unable to load available training dates. Please contact us for scheduling.",
        );
        return;
      }

      const nextSessions = (await res.json()) as TrainingSessionOption[];
      setSessions(nextSessions);
      setSessionMessage(
        nextSessions.length
          ? ""
          : "No public training dates are available yet. Please contact us and we will help you schedule.",
      );
    } catch {
      setSessionMessage(
        "Unable to load available training dates. Please contact us for scheduling.",
      );
    }
  }

  async function loadPaymentSettings() {
    try {
      const res = await fetch("/api/payment-settings");
      if (!res.ok) return;
      setPaymentSettings((await res.json()) as PublicPaymentSettings);
    } catch {
      // Keep manual booking request available if payment settings cannot load.
    }
  }

  async function captureReturnedPayPalOrder() {
    const params = new URLSearchParams(window.location.search);
    const paypalStatus = params.get("paypal");
    const orderId = params.get("token");

    if (paypalStatus === "cancelled") {
      toast({ title: "Payment cancelled", description: "Your seat was not confirmed." });
      window.history.replaceState({}, "", "/book");
      return;
    }

    if (paypalStatus !== "success" || !orderId) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const confirmation = (await res.json()) as PaymentConfirmation;
        setPaymentConfirmation(confirmation);
        toast({
          title: "Payment received",
          description: `Your booking is confirmed. Reference: ${confirmation.bookingCode}`,
        });
        reset();
        await loadSessions();
      } else {
        const err = await res.json();
        toast({
          variant: "destructive",
          title: "Payment confirmation failed",
          description: err.message || "Please contact us to confirm your booking.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Payment confirmation failed",
        description: "Please contact us to confirm your booking.",
      });
    } finally {
      setIsLoading(false);
      window.history.replaceState({}, "", "/book");
    }
  }

  useEffect(() => {
    void loadSessions();
    void loadPaymentSettings();
    void captureReturnedPayPalOrder();
    // Capture should run only on the initial PayPal redirect landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: z.infer<typeof bookingSchema>) {
    setIsLoading(true);
    try {
      const checkoutEndpoint = shouldPayWithPayPal
        ? "/api/paypal/create-order"
        : "/api/appointments/book";
      const res = await fetch(checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        if (shouldPayWithPayPal) {
          const order = (await res.json()) as { approveUrl: string };
          window.location.href = order.approveUrl;
          return;
        }

        toast({
          title: "Booking request received",
          description: "We will review the request and confirm your training session.",
        });
        reset();
        await loadSessions();
      } else {
        const err = await res.json();
        toast({
          variant: "destructive",
          title: "Booking failed",
          description: err.message || "Please choose another session or contact us.",
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "A network error occurred" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Book Your Training</CardTitle>
          <CardDescription>
            Select an available class and send your contact details. No account is required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentConfirmation ? (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <p className="font-semibold">Payment received — booking confirmed</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-emerald-700">Reference</dt>
                  <dd className="font-semibold">{paymentConfirmation.bookingCode}</dd>
                </div>
                <div>
                  <dt className="text-emerald-700">Amount</dt>
                  <dd className="font-semibold">
                    {formatMoney(paymentConfirmation.amountCents, paymentConfirmation.currency)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-emerald-700">Class</dt>
                  <dd className="font-semibold">{paymentConfirmation.courseTitle}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-emerald-700">Schedule</dt>
                  <dd>{formatConfirmationRange(paymentConfirmation)}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionId">Available class</Label>
              <select
                id="sessionId"
                {...register("sessionId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select a class</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.courseTitle} — {formatSessionRange(session)} — {session.priceLabel}
                  </option>
                ))}
              </select>
              {sessionMessage ? (
                <p className="text-sm text-muted-foreground">{sessionMessage}</p>
              ) : null}
              {errors.sessionId ? (
                <p className="text-sm text-red-500">{errors.sessionId.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input id="customerName" {...register("customerName")} placeholder="Jane Student" />
                {errors.customerName ? (
                  <p className="text-sm text-red-500">{errors.customerName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  {...register("customerPhone")}
                  placeholder="416-555-0101"
                />
                {errors.customerPhone ? (
                  <p className="text-sm text-red-500">{errors.customerPhone.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
                placeholder="name@example.com"
              />
              {errors.customerEmail ? (
                <p className="text-sm text-red-500">{errors.customerEmail.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Questions, group details, or scheduling needs"
              />
            </div>

            {canPayWithPayPal ? (
              <fieldset className="space-y-3 rounded-md border p-4">
                <legend className="px-1 text-sm font-medium">Payment option</legend>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    value="PAYPAL"
                    {...register("paymentMethod")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">Pay now with PayPal</span>
                    <span className="text-muted-foreground">
                      Secure your seat online for {selectedSession?.priceLabel}.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="radio"
                    value="ONSITE"
                    {...register("paymentMethod")}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">Pay on site</span>
                    <span className="text-muted-foreground">
                      Submit a booking request and pay in person when confirmed.
                    </span>
                  </span>
                </label>
              </fieldset>
            ) : null}

            <Button type="submit" className="w-full" disabled={isLoading || sessions.length === 0}>
              {isLoading
                ? "Submitting..."
                : shouldPayWithPayPal
                  ? `Pay ${selectedSession?.priceLabel ?? "with PayPal"}`
                  : "Request booking"}
            </Button>
            {shouldPayWithPayPal ? (
              <p className="text-center text-xs text-muted-foreground">
                You will be redirected to PayPal {paymentSettings.paypalMode.toLowerCase()}{" "}
                checkout.
              </p>
            ) : null}
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/contact" className="text-primary underline">
              Contact us
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
