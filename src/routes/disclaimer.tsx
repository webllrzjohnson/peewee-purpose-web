import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Training Disclaimer | Pulse & Purpose CPR" },
      {
        name: "description",
        content: "Training, medical and certification disclaimers for Pulse and Purpose CPR LLC.",
      },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Disclaimer"
      title="Training Disclaimer"
      description="Important limits and expectations for CPR, first aid and life-support training information on this website."
      updated="August 9, 2026"
      sections={[
        {
          title: "Emergency information",
          body: (
            <p>
              This website is not emergency medical advice. If there is an emergency, call 911 or
              your local emergency number immediately and follow instructions from emergency
              dispatchers and qualified responders.
            </p>
          ),
        },
        {
          title: "Educational content",
          body: (
            <p>
              Website content is provided for general educational and scheduling purposes. It does
              not replace formal instruction, current course materials, medical direction, employer
              policy or applicable laws and regulations.
            </p>
          ),
        },
        {
          title: "Certification requirements",
          body: (
            <p>
              Certification and completion-card requirements are set by the applicable course issuer
              and may change. Participants must complete all required course components and
              demonstrate required skills to receive any applicable completion card.
            </p>
          ),
        },
        {
          title: "Physical participation",
          body: (
            <p>
              CPR and first aid skills practice may involve kneeling, bending, standing, lifting and
              repetitive movement. Tell the instructor before class if you have a condition that may
              limit participation so reasonable accommodation options can be discussed within course
              requirements.
            </p>
          ),
        },
        {
          title: "Third-party names and marks",
          body: (
            <p>
              Course names, trademarks and certification references belong to their respective
              owners. Any references are used to describe training pathways and do not imply an
              endorsement beyond the instructor or training relationship actually in place.
            </p>
          ),
        },
      ]}
    />
  );
}
