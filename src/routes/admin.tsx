import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Course = {
  id: string;
  slug: string;
  title: string;
  audience: string;
  description: string | null;
  details: string[];
  priceLabel: string;
  priceCents: number | null;
  ctaLabel: string;
  isPublished: boolean;
  sortOrder: number;
};

type PaymentSettings = {
  paypalMode: "DISABLED" | "SANDBOX" | "LIVE";
  paypalClientId: string | null;
  paypalClientSecretConfigured: boolean;
  currency: string;
  canStoreSecrets: boolean;
};

type PaymentForm = {
  paypalMode: PaymentSettings["paypalMode"];
  paypalClientId: string;
  paypalClientSecret: string;
  currency: string;
};

type Session = {
  id: string;
  courseId: string;
  courseTitle: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  bookingCount: number;
  remainingCapacity: number;
};

type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  courseTitle: string;
  startTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentProvider: string | null;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  amountCents: number | null;
  currency: string | null;
  notes: string | null;
};

type BookingView = "needsAction" | "upcoming" | "history";

type BookingPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type BookingListResponse = {
  data: Booking[];
  counts: Record<BookingView, number>;
  pagination: BookingPagination;
};

const bookingViews: Array<{ value: BookingView; label: string; description: string }> = [
  {
    value: "needsAction",
    label: "Needs action",
    description: "New requests, pending PayPal payments, and failed payments.",
  },
  {
    value: "upcoming",
    label: "Upcoming confirmed",
    description: "Confirmed future classes to prepare for.",
  },
  {
    value: "history",
    label: "History",
    description: "Completed, cancelled, and past confirmed bookings for records/search.",
  },
];

const emptyCourse = {
  title: "",
  slug: "",
  audience: "",
  description: "",
  details: "",
  priceLabel: "",
  priceAmount: "",
  ctaLabel: "Book now",
  sortOrder: "0",
  isPublished: true,
};

const emptyPaymentForm: PaymentForm = {
  paypalMode: "DISABLED",
  paypalClientId: "",
  paypalClientSecret: "",
  currency: "USD",
};

const emptySession = {
  courseId: "",
  startDate: "",
  endDate: "",
  startTime: "09:00",
  endTime: "11:00",
  capacity: "8",
  location: "",
  status: "PUBLISHED",
};

type SessionForm = typeof emptySession;

function AdminPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingView, setBookingView] = useState<BookingView>("needsAction");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingCounts, setBookingCounts] = useState<Record<BookingView, number>>({
    needsAction: 0,
    upcoming: 0,
    history: 0,
  });
  const [bookingPagination, setBookingPagination] = useState<BookingPagination>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionEditForm, setSessionEditForm] = useState<SessionForm>(emptySession);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [message, setMessage] = useState("Loading admin panel...");

  async function loadBookings(view = bookingView, page = bookingPage, search = bookingSearch) {
    const params = new URLSearchParams({
      view,
      page: String(page),
      pageSize: "25",
    });
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/admin/bookings?${params.toString()}`);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Unable to load bookings" });
      return;
    }

    const result = (await res.json()) as BookingListResponse;
    setBookings(result.data);
    setBookingCounts(result.counts);
    setBookingPagination(result.pagination);
  }

  async function loadAdminData() {
    const [courseRes, sessionRes, paymentRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/sessions"),
      fetch("/api/admin/payment-settings"),
    ]);

    if (courseRes.status === 401 || sessionRes.status === 401 || paymentRes.status === 401) {
      setMessage("Please log in with an admin account to manage the site.");
      return;
    }

    if (courseRes.status === 403 || sessionRes.status === 403 || paymentRes.status === 403) {
      setMessage("Your account does not have admin access.");
      return;
    }

    if (!courseRes.ok || !sessionRes.ok || !paymentRes.ok) {
      setMessage("Unable to load admin data. Check the database connection and migrations.");
      return;
    }

    const nextCourses = (await courseRes.json()) as Course[];
    const nextPaymentSettings = (await paymentRes.json()) as PaymentSettings;
    setCourses(nextCourses);
    setSessions((await sessionRes.json()) as Session[]);
    setPaymentSettings(nextPaymentSettings);
    setPaymentForm({
      paypalMode: nextPaymentSettings.paypalMode,
      paypalClientId: nextPaymentSettings.paypalClientId ?? "",
      paypalClientSecret: "",
      currency: nextPaymentSettings.currency,
    });
    setSessionForm((current) => ({
      ...current,
      courseId: current.courseId || nextCourses[0]?.id || "",
    }));
    setMessage("");
    await loadBookings();
  }

  useEffect(() => {
    void loadAdminData();
    // Initial admin load only; booking tabs/search call loadBookings explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...courseForm,
        priceCents: amountToCents(courseForm.priceAmount),
        sortOrder: Number(courseForm.sortOrder),
      }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Course not saved" });
      return;
    }

    setCourseForm(emptyCourse);
    toast({ title: "Course saved" });
    await loadAdminData();
  }

  async function updateCourse(course: Course) {
    const res = await fetch("/api/admin/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Course update failed" });
      return;
    }

    toast({ title: "Course updated" });
    await loadAdminData();
  }

  async function savePaymentSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/admin/payment-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });

    if (!res.ok) {
      const error = (await res.json().catch(() => null)) as { message?: string } | null;
      toast({
        variant: "destructive",
        title: "Payment settings not saved",
        description: error?.message ?? "Check the PayPal settings and try again.",
      });
      return;
    }

    toast({ title: "Payment settings saved" });
    await loadAdminData();
  }

  async function saveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sessionForm, capacity: Number(sessionForm.capacity) }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Session not saved" });
      return;
    }

    setSessionForm((current) => ({ ...emptySession, courseId: current.courseId }));
    toast({ title: "Session saved" });
    await loadAdminData();
  }

  async function updateSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSessionId) return;

    const res = await fetch("/api/admin/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sessionEditForm,
        id: editingSessionId,
        capacity: Number(sessionEditForm.capacity),
      }),
    });

    if (!res.ok) {
      const error = (await res.json().catch(() => null)) as { message?: string } | null;
      toast({
        variant: "destructive",
        title: "Session update failed",
        description: error?.message ?? "Check the session date, time, and capacity.",
      });
      return;
    }

    setEditingSessionId(null);
    setSessionEditForm(emptySession);
    toast({ title: "Session updated" });
    await loadAdminData();
  }

  async function updateBooking(booking: Booking, status: Booking["status"]) {
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, status, notes: booking.notes ?? "" }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Booking update failed" });
      return;
    }

    toast({ title: "Booking updated" });
    await loadBookings();
  }

  async function changeBookingView(view: BookingView) {
    setBookingView(view);
    setBookingPage(1);
    await loadBookings(view, 1, bookingSearch);
  }

  async function changeBookingPage(page: number) {
    setBookingPage(page);
    await loadBookings(bookingView, page, bookingSearch);
  }

  async function searchBookings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingPage(1);
    await loadBookings(bookingView, 1, bookingSearch);
  }

  function formatMoney(amountCents: number | null, currency: string | null) {
    if (amountCents == null || !currency) return "Not set";
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amountCents / 100,
    );
  }

  function amountToCents(value: string) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
  }

  function centsToAmount(value: number | null) {
    return value == null ? "" : (value / 100).toFixed(2).replace(/\.00$/, "");
  }

  function sessionToForm(session: Session): SessionForm {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return {
      courseId: session.courseId,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
      capacity: String(session.capacity),
      location: session.location ?? "",
      status: session.status,
    };
  }

  function formatSessionRange(session: Session) {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const isSameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
    return isSameDay
      ? `${format(start, "PPP p")}–${format(end, "p")}`
      : `${format(start, "PPP p")}–${format(end, "PPP p")}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-amber-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-navy via-pulse to-sky-500 p-6 text-white shadow-xl shadow-pulse/20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-highlight-bright">
              Admin
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Scheduling, booking and pricing</h1>
            <p className="mt-2 text-white/80">
              Update course prices, create training dates, and manage booking requests.
            </p>
          </div>
          <a
            className="rounded-md border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25"
            href="/"
          >
            View public site
          </a>
        </div>

        {message ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin panel unavailable</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Published courses"
                value={courses.filter((course) => course.isPublished).length}
                tone="from-sky-500 to-blue-700"
              />
              <StatCard
                label="Upcoming sessions"
                value={sessions.filter((session) => session.status === "PUBLISHED").length}
                tone="from-emerald-500 to-teal-700"
              />
              <StatCard
                label="Bookings needing action"
                value={bookingCounts.needsAction}
                tone="from-amber-400 to-orange-600"
              />
            </section>

            <Card className="overflow-hidden border-pulse/20 shadow-lg shadow-sky-100">
              <div className="h-1 bg-gradient-to-r from-pulse via-sky-400 to-highlight" />
              <CardHeader>
                <CardTitle>Payment settings</CardTitle>
                <CardDescription>
                  Configure PayPal for the next checkout phase. Secrets are never shown after save.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={savePaymentSettings} className="grid gap-4 md:grid-cols-2">
                  <Field label="PayPal mode">
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={paymentForm.paypalMode}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          paypalMode: event.target.value as PaymentSettings["paypalMode"],
                        })
                      }
                    >
                      <option value="DISABLED">Disabled</option>
                      <option value="SANDBOX">Sandbox</option>
                      <option value="LIVE">Live</option>
                    </select>
                  </Field>
                  <Field label="Currency">
                    <Input
                      value={paymentForm.currency}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          currency: event.target.value.toUpperCase(),
                        })
                      }
                      maxLength={3}
                      placeholder="USD"
                    />
                  </Field>
                  <Field label="PayPal client ID">
                    <Input
                      value={paymentForm.paypalClientId}
                      onChange={(event) =>
                        setPaymentForm({ ...paymentForm, paypalClientId: event.target.value })
                      }
                      placeholder="Paste PayPal app client ID"
                    />
                  </Field>
                  <Field label="PayPal client secret">
                    <Input
                      type="password"
                      value={paymentForm.paypalClientSecret}
                      onChange={(event) =>
                        setPaymentForm({ ...paymentForm, paypalClientSecret: event.target.value })
                      }
                      placeholder={
                        paymentSettings?.paypalClientSecretConfigured
                          ? "Leave blank to keep saved secret"
                          : "Paste PayPal app secret"
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Status: {paymentSettings?.paypalMode ?? "DISABLED"}
                      {paymentSettings?.paypalClientSecretConfigured ? " • Secret saved" : ""}
                      {paymentSettings && !paymentSettings.canStoreSecrets
                        ? " • Set PAYMENT_SETTINGS_ENCRYPTION_KEY or AUTH_SECRET before saving a secret"
                        : ""}
                    </p>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-pulse to-navy text-white shadow-md shadow-pulse/20 hover:from-pulse/90 hover:to-navy/90"
                    >
                      Save payment settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-200 shadow-lg shadow-emerald-100/70">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
              <CardHeader>
                <CardTitle>Course pricing</CardTitle>
                <CardDescription>
                  Add or update the courses and prices shown on the homepage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={saveCourse} className="grid gap-4 md:grid-cols-2">
                  <Field label="Title">
                    <Input
                      value={courseForm.title}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, title: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Price">
                    <Input
                      value={courseForm.priceLabel}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, priceLabel: event.target.value })
                      }
                      placeholder="From $100"
                      required
                    />
                  </Field>
                  <Field label="Checkout amount">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={courseForm.priceAmount}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, priceAmount: event.target.value })
                      }
                      placeholder="199.99"
                    />
                  </Field>
                  <Field label="Audience">
                    <Input
                      value={courseForm.audience}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, audience: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="CTA label">
                    <Input
                      value={courseForm.ctaLabel}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, ctaLabel: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Details, one per line">
                    <Textarea
                      value={courseForm.details}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, details: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Sort order">
                    <Input
                      type="number"
                      value={courseForm.sortOrder}
                      onChange={(event) =>
                        setCourseForm({ ...courseForm, sortOrder: event.target.value })
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-200 hover:from-emerald-600 hover:to-teal-800"
                    >
                      Add course
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_160px_120px_140px_auto] md:items-center"
                    >
                      <div>
                        <p className="font-semibold">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.audience}</p>
                      </div>
                      <Input
                        value={course.priceLabel}
                        onChange={(event) =>
                          setCourses((items) =>
                            items.map((item) =>
                              item.id === course.id
                                ? { ...item, priceLabel: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={centsToAmount(course.priceCents)}
                        placeholder="amount"
                        onChange={(event) =>
                          setCourses((items) =>
                            items.map((item) =>
                              item.id === course.id
                                ? {
                                    ...item,
                                    priceCents:
                                      event.target.value === ""
                                        ? null
                                        : amountToCents(event.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={course.isPublished ? "published" : "hidden"}
                        onChange={(event) =>
                          setCourses((items) =>
                            items.map((item) =>
                              item.id === course.id
                                ? { ...item, isPublished: event.target.value === "published" }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                      </select>
                      <Button
                        type="button"
                        className="bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                        onClick={() => updateCourse(course)}
                      >
                        Save
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-indigo-200 shadow-lg shadow-indigo-100/70">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-pulse to-sky-500" />
              <CardHeader>
                <CardTitle>Training schedule</CardTitle>
                <CardDescription>Create the dates and times customers can book.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={saveSession} className="grid gap-4 md:grid-cols-3">
                  <Field label="Course">
                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={sessionForm.courseId}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, courseId: event.target.value })
                      }
                      required
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Start date">
                    <Input
                      type="date"
                      value={sessionForm.startDate}
                      onChange={(event) =>
                        setSessionForm({
                          ...sessionForm,
                          startDate: event.target.value,
                          endDate: sessionForm.endDate || event.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      type="date"
                      value={sessionForm.endDate}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, endDate: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Start">
                    <Input
                      type="time"
                      value={sessionForm.startTime}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, startTime: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="End">
                    <Input
                      type="time"
                      value={sessionForm.endTime}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, endTime: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Capacity">
                    <Input
                      type="number"
                      min="1"
                      value={sessionForm.capacity}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, capacity: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={sessionForm.location}
                      onChange={(event) =>
                        setSessionForm({ ...sessionForm, location: event.target.value })
                      }
                      placeholder="Classroom / address"
                    />
                  </Field>
                  <div className="md:col-span-3">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-pulse text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-pulse/90"
                    >
                      Add session
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="rounded-lg border bg-white p-4">
                      {editingSessionId === session.id ? (
                        <form onSubmit={updateSession} className="grid gap-3 md:grid-cols-3">
                          <Field label="Course">
                            <select
                              className="h-10 rounded-md border bg-background px-3 text-sm"
                              value={sessionEditForm.courseId}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  courseId: event.target.value,
                                })
                              }
                              required
                            >
                              {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.title}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Start date">
                            <Input
                              type="date"
                              value={sessionEditForm.startDate}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  startDate: event.target.value,
                                  endDate: sessionEditForm.endDate || event.target.value,
                                })
                              }
                              required
                            />
                          </Field>
                          <Field label="End date">
                            <Input
                              type="date"
                              value={sessionEditForm.endDate}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  endDate: event.target.value,
                                })
                              }
                              required
                            />
                          </Field>
                          <Field label="Start">
                            <Input
                              type="time"
                              value={sessionEditForm.startTime}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  startTime: event.target.value,
                                })
                              }
                              required
                            />
                          </Field>
                          <Field label="End">
                            <Input
                              type="time"
                              value={sessionEditForm.endTime}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  endTime: event.target.value,
                                })
                              }
                              required
                            />
                          </Field>
                          <Field label="Capacity">
                            <Input
                              type="number"
                              min={session.bookingCount}
                              value={sessionEditForm.capacity}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  capacity: event.target.value,
                                })
                              }
                              required
                            />
                          </Field>
                          <Field label="Location">
                            <Input
                              value={sessionEditForm.location}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  location: event.target.value,
                                })
                              }
                              placeholder="Classroom / address"
                            />
                          </Field>
                          <Field label="Status">
                            <select
                              className="h-10 rounded-md border bg-background px-3 text-sm"
                              value={sessionEditForm.status}
                              onChange={(event) =>
                                setSessionEditForm({
                                  ...sessionEditForm,
                                  status: event.target.value,
                                })
                              }
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </Field>
                          <div className="flex flex-wrap items-end gap-2 md:col-span-3">
                            <Button
                              type="submit"
                              className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                            >
                              Save changes
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingSessionId(null);
                                setSessionEditForm(emptySession);
                              }}
                            >
                              Cancel edit
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {session.bookingCount} active booking(s); capacity cannot go below
                              this count.
                            </span>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{session.courseTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatSessionRange(session)} • {session.location || "Location TBD"}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                              {session.status}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                              {session.bookingCount}/{session.capacity} booked •{" "}
                              {session.remainingCapacity} open
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setSessionEditForm(sessionToForm(session));
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-amber-200 shadow-lg shadow-amber-100/70">
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-pulse" />
              <CardHeader>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>
                  Work from the action queue first, then search upcoming classes and history as
                  needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {bookingViews.map((view) => (
                    <Button
                      key={view.value}
                      type="button"
                      variant={bookingView === view.value ? "default" : "outline"}
                      className={
                        bookingView === view.value
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200 hover:from-amber-600 hover:to-orange-700"
                          : "border-amber-200 bg-white text-slate-700 hover:bg-amber-50"
                      }
                      onClick={() => void changeBookingView(view.value)}
                    >
                      {view.label} ({bookingCounts[view.value] ?? 0})
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  {bookingViews.find((view) => view.value === bookingView)?.description}
                </p>

                <form onSubmit={searchBookings} className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={bookingSearch}
                    onChange={(event) => setBookingSearch(event.target.value)}
                    placeholder="Search name, email, phone, reference, PayPal ID, or course"
                  />
                  <Button type="submit" className="bg-navy text-white shadow-sm hover:bg-navy/90">
                    Search
                  </Button>
                  {bookingSearch ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBookingSearch("");
                        setBookingPage(1);
                        void loadBookings(bookingView, 1, "");
                      }}
                    >
                      Clear
                    </Button>
                  ) : null}
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    Showing{" "}
                    {bookings.length
                      ? (bookingPagination.page - 1) * bookingPagination.pageSize + 1
                      : 0}
                    –
                    {Math.min(
                      bookingPagination.page * bookingPagination.pageSize,
                      bookingPagination.totalItems,
                    )}{" "}
                    of {bookingPagination.totalItems}
                  </span>
                  <span>
                    Page {bookingPagination.page} of {bookingPagination.totalPages}
                  </span>
                </div>

                {bookings.length ? (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {booking.customerName} — {booking.courseTitle}
                        </p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          Reference: {booking.bookingCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.startTime), "PPP p")} • {booking.customerEmail} •{" "}
                          {booking.customerPhone}
                        </p>
                        <p className="mt-1 text-sm">Status: {booking.status}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Payment: {booking.paymentStatus} •{" "}
                          {formatMoney(booking.amountCents, booking.currency)}
                          {booking.paymentProvider ? ` • ${booking.paymentProvider}` : ""}
                        </p>
                        {booking.paypalOrderId ? (
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            PayPal order: {booking.paypalOrderId}
                            {booking.paypalCaptureId
                              ? ` • Capture: ${booking.paypalCaptureId}`
                              : ""}
                          </p>
                        ) : null}
                        {booking.notes ? (
                          <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                            <span className="font-medium text-slate-950">Customer note:</span>{" "}
                            {booking.notes}
                          </p>
                        ) : null}
                      </div>
                      {bookingView === "history" ? null : (
                        <div className="flex flex-wrap gap-2">
                          {booking.status !== "CONFIRMED" ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                              onClick={() => updateBooking(booking, "CONFIRMED")}
                            >
                              Confirm
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                            onClick={() => updateBooking(booking, "COMPLETED")}
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBooking(booking, "CANCELLED")}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
                    No bookings found in this view.
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bookingPagination.page <= 1}
                    onClick={() => void changeBookingPage(bookingPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={bookingPagination.page >= bookingPagination.totalPages}
                    onClick={() => void changeBookingPage(bookingPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className={`border-0 bg-gradient-to-br ${tone} text-white shadow-lg`}>
      <CardHeader>
        <CardDescription className="text-white/80">{label}</CardDescription>
        <CardTitle className="text-3xl text-white">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
