import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use | Pulse & Purpose CPR" },
      {
        name: "description",
        content:
          "Terms of use for Pulse and Purpose CPR LLC website, booking and training services.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Use"
      description="These terms set expectations for using this website and requesting or booking Pulse and Purpose CPR LLC training services."
      updated="August 9, 2026"
      sections={[
        {
          title: "Website use",
          body: (
            <p>
              You may use this website to learn about training options, contact Pulse and Purpose
              CPR LLC, create an account where available and request or book training. Do not misuse
              the site, interfere with its operation or submit false, harmful or unlawful content.
            </p>
          ),
        },
        {
          title: "Training registration",
          body: (
            <p>
              Course availability, dates, locations, prices, prerequisites and certification
              requirements may change. A registration is not final until confirmed by Pulse and
              Purpose CPR LLC or the applicable booking/payment system.
            </p>
          ),
        },
        {
          title: "Prerequisites and participation",
          body: (
            <p>
              Some courses require prior online work, provider eligibility or specific preparation.
              Participants are responsible for choosing the correct course path and notifying the
              instructor of any condition that may affect safe participation in skills practice.
            </p>
          ),
        },
        {
          title: "Cancellations and rescheduling",
          body: (
            <p>
              Cancellation, rescheduling and refund terms may depend on the course, timing and
              payment method. Any course-specific policy shown during booking or in a confirmation
              message controls for that registration.
            </p>
          ),
        },
        {
          title: "No guarantee of outcomes",
          body: (
            <p>
              Training is designed to build knowledge and skills, but certification, course
              completion, workplace acceptance and real-world emergency outcomes depend on many
              factors, including participant performance and issuer requirements.
            </p>
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              Questions about these terms can be sent to{" "}
              <a href="mailto:cprpulseandpurpose@gmail.com" className="font-semibold text-pulse">
                cprpulseandpurpose@gmail.com
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
