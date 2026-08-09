import type { ReactNode } from "react";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, description, updated, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <a
            href="/"
            className="text-sm font-semibold text-navy-foreground/75 hover:text-navy-foreground"
          >
            ← Back to Pulse &amp; Purpose CPR
          </a>
          <p className="eyebrow mt-10 text-highlight-bright">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-navy-foreground/75">{description}</p>
          <p className="mt-6 text-sm text-navy-foreground/55">Last updated: {updated}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14 lg:py-20">
        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-lg border border-border bg-card p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Pulse and Purpose CPR LLC</p>
          <nav className="flex flex-wrap gap-4">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="/disclaimer" className="hover:text-foreground">
              Disclaimer
            </a>
            <a href="/accessibility" className="hover:text-foreground">
              Accessibility
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
