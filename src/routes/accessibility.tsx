import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement | Pulse & Purpose CPR" },
      {
        name: "description",
        content:
          "Accessibility statement for Pulse and Purpose CPR LLC website and training inquiries.",
      },
    ],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Accessibility"
      title="Accessibility Statement"
      description="Pulse and Purpose CPR LLC aims to make its website and training inquiry process accessible and usable."
      updated="August 9, 2026"
      sections={[
        {
          title: "Our goal",
          body: (
            <p>
              We want visitors to be able to understand course options, contact us and request
              training without unnecessary barriers. The site is designed with readable text,
              keyboard-accessible links and responsive layouts.
            </p>
          ),
        },
        {
          title: "Training accommodations",
          body: (
            <p>
              Some skills courses include physical practice. If you may need an accommodation for a
              class, please contact us before your session so we can discuss options within course
              and certification requirements.
            </p>
          ),
        },
        {
          title: "Feedback",
          body: (
            <p>
              If you have trouble using this website or accessing training information, contact us
              at{" "}
              <a href="mailto:cprpulseandpurpose@gmail.com" className="font-semibold text-pulse">
                cprpulseandpurpose@gmail.com
              </a>{" "}
              or call{" "}
              <a href="tel:+15108289140" className="font-semibold text-pulse">
                +1 (510) 828-9140
              </a>
              . Please include the page, device and issue you experienced so we can investigate.
            </p>
          ),
        },
      ]}
    />
  );
}
