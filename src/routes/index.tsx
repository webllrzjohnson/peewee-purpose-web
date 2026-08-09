import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import aboutImage from "@/assets/about-hands.jpg";
import headerBanner from "../../header-banner.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse & Purpose CPR | BLS, ACLS & PALS Training" },
      {
        name: "description",
        content:
          "American Heart Association aligned CPR, BLS, ACLS, PALS and First Aid training for healthcare professionals, workplaces and communities.",
      },
      { property: "og:title", content: "Pulse & Purpose CPR | Life-Saving Training" },
      {
        property: "og:description",
        content:
          "Hands-on CPR, BLS, ACLS, PALS and First Aid certification courses led by experienced clinical instructors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const coursePathways = [
  {
    title: "Healthcare Provider BLS",
    audience: "Nurses, dental teams, EMT students, clinical staff and healthcare professionals.",
    details: [
      "Online HeartCode + hands-on skills",
      "AHA BLS completion card",
      "Best for new or renewing providers",
    ],
    priceLabel: "From $100",
    ctaLabel: "Book BLS",
  },
  {
    title: "ACLS & PALS Certification",
    audience: "Advanced healthcare professionals who respond to cardiac or pediatric emergencies.",
    details: [
      "Instructor-led or blended options",
      "Initial and renewal pathways",
      "Scenario-based practice",
    ],
    priceLabel: "From $199",
    ctaLabel: "Ask about ACLS/PALS",
  },
  {
    title: "Heartsaver® CPR AED",
    audience:
      "Workplaces, community members, coaches, parents and anyone who wants CPR confidence.",
    details: [
      "No medical background required",
      "CPR and AED response",
      "Two-year course completion card",
    ],
    priceLabel: "Contact for dates",
    ctaLabel: "Request Heartsaver CPR",
  },
  {
    title: "Pediatric First Aid CPR AED",
    audience: "Childcare providers, teachers, camp counselors and youth program staff.",
    details: [
      "Child and infant emergency response",
      "First aid, CPR and AED",
      "Great for schools and childcare teams",
    ],
    priceLabel: "From $90",
    ctaLabel: "Book pediatric CPR",
  },
];

type CoursePathway = (typeof coursePathways)[number] & {
  id?: string;
  slug?: string;
  sortOrder?: number;
};

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
};

const courseFinder = [
  {
    need: "I work in healthcare",
    match: "Start with BLS; ask about ACLS or PALS if your role requires advanced certification.",
  },
  {
    need: "I already finished online HeartCode",
    match: "Choose the skills session only so you are not paying for the online portion twice.",
  },
  {
    need: "I work with children",
    match: "Choose Pediatric First Aid CPR AED for child and infant emergency response.",
  },
  {
    need: "I need workplace or community CPR",
    match: "Choose Heartsaver CPR AED or Heartsaver First Aid CPR AED.",
  },
];

const blsOptions = [
  {
    name: "BLS HeartCode complete package",
    bestFor: "New or renewing providers who need the online course and hands-on checkoff.",
    includes: "Online HeartCode + instructor-led skills session",
    price: "$100",
  },
  {
    name: "BLS skills session only",
    bestFor: "Students who already purchased and completed AHA HeartCode BLS online.",
    includes: "Hands-on skills practice and checkoff only",
    price: "$80",
  },
];

const credentials = [
  { value: "AHA", label: "Aligned curriculum" },
  { value: "2 yr", label: "Completion cards" },
  { value: "On-site", label: "Group training available" },
  { value: "7 days", label: "Flexible scheduling" },
];

function Index() {
  const [publishedCourses, setPublishedCourses] = useState<CoursePathway[]>(coursePathways);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) return;
        const courses = (await res.json()) as CoursePathway[];
        if (isMounted && courses.length > 0) {
          setPublishedCourses(courses);
        }
      } catch {
        // Keep the static content if the database-backed course catalog is unavailable.
      }
    }

    async function loadCurrentUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = (await res.json()) as { user: AuthUser | null };
        if (isMounted) {
          setAuthUser(data.user);
        }
      } catch {
        // Keep public navigation available if auth lookup fails.
      }
    }

    void loadCourses();
    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:justify-between">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-navy">
              <PulseMark />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold tracking-tight">
                Pulse &amp; Purpose CPR
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Where purposeful training saves lives
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#courses">
              Courses
            </a>
            <a className="transition-colors hover:text-foreground" href="#about">
              About
            </a>
            <a className="transition-colors hover:text-foreground" href="/book">
              Book
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {authUser?.role === "ADMIN" ? (
              <a
                href="/admin"
                className="hidden rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface sm:inline-flex"
              >
                Admin
              </a>
            ) : null}
            {authUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface sm:inline-flex"
              >
                Logout
              </button>
            ) : (
              <a
                href="/login"
                className="hidden rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface sm:inline-flex"
              >
                Login
              </a>
            )}
            <a
              href="/book"
              className="inline-flex items-center rounded-md bg-highlight px-4 py-2 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
            >
              Book now
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section
          className="border-b border-border bg-navy"
          aria-label="Pulse and Purpose CPR banner"
        >
          <img
            src={headerBanner}
            alt="Pulse and Purpose CPR banner with heart, heartbeat line and clinical education tagline"
            width={2172}
            height={428}
            className="block h-auto w-full"
          />
        </section>

        {/* Hero */}
        <section className="border-b border-border bg-navy text-navy-foreground">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="eyebrow text-pulse-light">Clinical education, delivered with purpose</p>
              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-[3.4rem]">
                Life-saving skills taught with clarity, rigor and confidence.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-foreground/75">
                Pulse and Purpose CPR LLC trains healthcare professionals, workplaces and community
                members in CPR, BLS, ACLS, PALS and First Aid — hands-on instruction that turns
                knowledge into calm, decisive action.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="/book"
                  className="inline-flex items-center rounded-md bg-highlight px-6 py-3 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
                >
                  Book a class
                </a>
                <a
                  href="#courses"
                  className="inline-flex items-center rounded-md border border-navy-foreground/25 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
                >
                  View course catalog
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-navy-foreground/10">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 py-8 sm:grid-cols-4">
              {credentials.map((c) => (
                <div key={c.label} className="px-2 py-2">
                  <dt className="font-display text-2xl font-semibold">{c.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-widest text-navy-foreground/60">
                    {c.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Courses</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Find the right CPR course before you book
              </h2>
              <p className="mt-4 text-muted-foreground">
                Choose by role, format and prerequisite instead of guessing from certification
                acronyms. Every pathway is built to end with confident hands-on performance.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6">
              <h3 className="font-display text-lg font-semibold">Which class do I need?</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {courseFinder.map((item) => (
                  <div key={item.need} className="border-l-2 border-pulse pl-4">
                    <p className="text-sm font-semibold">{item.need}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.match}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {publishedCourses.map((course) => (
              <article key={course.title} className="rounded-lg border border-border bg-card p-7">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-xl font-semibold leading-snug">
                    {course.title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-highlight/15 px-3 py-1 text-xs font-semibold text-highlight">
                    {course.priceLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {course.audience}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {course.details.map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/book"
                  className="mt-6 inline-flex text-sm font-semibold text-pulse transition-colors hover:text-highlight"
                >
                  {course.ctaLabel} →
                </a>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-border bg-navy p-6 text-navy-foreground sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="eyebrow text-highlight-bright">Avoid double booking</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">
                  BLS HeartCode vs. skills session only
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-navy-foreground/75">
                  If you already completed the AHA online HeartCode course, choose the skills
                  session only. If you need the full path, choose the complete BLS HeartCode
                  package.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {blsOptions.map((option) => (
                  <article
                    key={option.name}
                    className="rounded-md border border-navy-foreground/15 bg-navy-foreground/5 p-5"
                  >
                    <h4 className="font-semibold">{option.name}</h4>
                    <p className="mt-3 text-sm text-navy-foreground/70">{option.bestFor}</p>
                    <p className="mt-4 text-xs uppercase tracking-widest text-navy-foreground/50">
                      Includes
                    </p>
                    <p className="mt-1 text-sm">{option.includes}</p>
                    <p className="mt-5 font-display text-xl font-semibold text-highlight-bright">
                      {option.price}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-28">
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={aboutImage}
                alt="Close-up of hands performing chest compressions on a training manikin beside an AED"
                width={1200}
                height={1408}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="eyebrow">Our approach</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Clinical excellence meets educational empowerment
              </h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                We believe learning to save a life should be clear, practical and empowering. Our
                training is hands-on and easy to understand, designed to help individuals and
                community members feel calm and confident in an emergency — while helping healthcare
                professionals stay current and refresh their skills with certainty.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                We don't just teach the rhythm. We build the confidence behind it, so more people
                are ready, willing and able to step in when it matters most.
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "Experienced clinical instructors, not script readers",
                  "On-site training for schools, clinics and workplaces",
                  "Small class sizes with real practice time per student",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Booking CTA */}
        <section id="book" className="bg-navy text-navy-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
            <div className="max-w-2xl">
              <p className="eyebrow text-highlight-bright">Book today</p>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
                Secure your seat in the next certification class
              </h2>
              <p className="mt-4 text-navy-foreground/75">
                Individual seats, group sessions and on-site training. Tell us the course and dates
                that work for you and we'll confirm your booking.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="/book"
                className="inline-flex items-center justify-center rounded-md bg-highlight px-7 py-3.5 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
              >
                Request booking
              </a>
              <a
                href="/book"
                className="inline-flex items-center justify-center rounded-md border border-navy-foreground/30 px-7 py-3.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
              >
                Book a session
              </a>
              <a
                href="tel:+15108289140"
                className="inline-flex items-center justify-center rounded-md border border-navy-foreground/30 px-7 py-3.5 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
              >
                Call (510) 828-9140
              </a>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-xl">
              <p className="eyebrow">Get in touch</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Ready to schedule your training?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Contact us for individual registration, group sessions, or consulting and program
                inquiries. We'll respond with available dates and pricing.
              </p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <a
                href="mailto:cprpulseandpurpose@gmail.com"
                className="rounded-md border border-border bg-card px-6 py-4 transition-colors hover:border-pulse"
              >
                <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </span>
                <span className="mt-1 block font-medium">cprpulseandpurpose@gmail.com</span>
              </a>
              <a
                href="tel:+15108289140"
                className="rounded-md border border-border bg-card px-6 py-4 transition-colors hover:border-pulse"
              >
                <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                  Phone
                </span>
                <span className="mt-1 block font-medium">+1 (510) 828-9140</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-navy text-navy-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-navy-foreground/10">
              <PulseMark />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold">
                Pulse and Purpose CPR LLC
              </p>
              <p className="truncate text-xs text-navy-foreground/60">
                Where purposeful training saves lives
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-xs text-navy-foreground/60 lg:items-end">
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <a href="/privacy" className="transition-colors hover:text-navy-foreground">
                Privacy
              </a>
              <a href="/terms" className="transition-colors hover:text-navy-foreground">
                Terms
              </a>
              <a href="/disclaimer" className="transition-colors hover:text-navy-foreground">
                Disclaimer
              </a>
              <a href="/accessibility" className="transition-colors hover:text-navy-foreground">
                Accessibility
              </a>
            </nav>
            <p>© {new Date().getFullYear()} Pulse and Purpose CPR LLC</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PulseMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-pulse-light" fill="none" aria-hidden="true">
      <path
        d="M2 12h4l2.5-6 3.5 12 3-9 2 3h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
