import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/hero-training.jpg";
import aboutImage from "@/assets/about-hands.jpg";

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

const courses = [
  {
    title: "Blended Learning HeartCode® BLS, ACLS & PALS",
    body: "Complete the online portion at your own pace, then finish with a hands-on skills session led by an Association Instructor, voice-assisted manikin or Simulation Station.",
    tag: "Online + Skills Check",
  },
  {
    title: "Instructor-Led BLS, ACLS & PALS",
    body: "Full-length, instructor-led classroom training that builds strong skills proficiency and confident, current providers.",
    tag: "In Person",
  },
  {
    title: "Heartsaver® CPR AED",
    body: "Recognize cardiac arrest, act fast, and deliver effective CPR and AED support until emergency responders arrive.",
    tag: "Community & Workplace",
  },
  {
    title: "Heartsaver® First Aid CPR AED",
    body: "OSHA-compliant first aid and CPR training for anyone with little or no medical background. Earns a two-year course completion card.",
    tag: "OSHA Compliant",
  },
];

const credentials = [
  { value: "AHA", label: "Aligned curriculum" },
  { value: "2 yr", label: "Completion cards" },
  { value: "On-site", label: "Group training available" },
  { value: "7 days", label: "Flexible scheduling" },
];

function Index() {
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
            <a className="transition-colors hover:text-foreground" href="#register">
              Register
            </a>
          </nav>
          <a
            href="/register"
            className="inline-flex shrink-0 items-center rounded-md bg-highlight px-4 py-2 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
          >
            Register
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="border-b border-border bg-navy text-navy-foreground">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
            <div>
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
                  href="/register"
                  className="inline-flex items-center rounded-md bg-highlight px-6 py-3 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
                >
                  Register for a class
                </a>
                <a
                  href="#courses"
                  className="inline-flex items-center rounded-md border border-navy-foreground/25 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
                >
                  View course catalog
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-navy-foreground/15">
              <img
                src={heroImage}
                alt="Instructor guiding students practicing chest compressions on CPR training manikins"
                width={1408}
                height={1008}
                className="h-full w-full object-cover"
              />
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
          <div className="max-w-2xl">
            <p className="eyebrow">Courses</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Certification pathways for every level of responder
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every course follows current Association science and ends with a hands-on skills
              evaluation, so you leave certified and genuinely prepared.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {courses.map((course) => (
              <article key={course.title} className="bg-card p-8">
                <span className="eyebrow text-muted-foreground">{course.tag}</span>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">
                  {course.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{course.body}</p>
              </article>
            ))}
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

        {/* Register CTA */}
        <section id="register" className="bg-navy text-navy-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
            <div className="max-w-2xl">
              <p className="eyebrow text-highlight-bright">Register today</p>
              <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
                Secure your seat in the next certification class
              </h2>
              <p className="mt-4 text-navy-foreground/75">
                Individual seats, group sessions and on-site training. Tell us the course and dates
                that work for you and we'll confirm your registration.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-highlight px-7 py-3.5 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90"
              >
                Create account
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
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-8 sm:flex sm:justify-between">
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
          <p className="text-xs text-navy-foreground/60">
            © {new Date().getFullYear()} Pulse and Purpose CPR LLC
          </p>
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
