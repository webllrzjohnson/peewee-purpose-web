import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Pulse & Purpose CPR" },
      {
        name: "description",
        content:
          "Privacy policy for Pulse and Purpose CPR LLC training inquiries, registrations and appointment booking.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      description="This page explains what information Pulse and Purpose CPR LLC may collect when you contact us, create an account, register for training or book a session."
      updated="August 9, 2026"
      sections={[
        {
          title: "Information we collect",
          body: (
            <>
              <p>
                We may collect information you provide directly, including your name, email address,
                phone number, course interest, appointment details, account login information and
                any message you send through the site.
              </p>
              <p>
                If online accounts are used, passwords are intended to be stored as password hashes,
                not as readable plain text. Please do not submit sensitive medical information
                through general contact or booking forms.
              </p>
            </>
          ),
        },
        {
          title: "How we use information",
          body: (
            <p>
              We use information to respond to inquiries, schedule and manage training, confirm
              registrations, support account access, provide customer service, maintain business
              records and improve the training experience.
            </p>
          ),
        },
        {
          title: "Sharing information",
          body: (
            <p>
              We do not sell personal information. We may share information with service providers
              that help us operate the website, scheduling, communications, payments or course
              administration. We may also disclose information when required by law or to protect
              our rights, users or business operations.
            </p>
          ),
        },
        {
          title: "Cookies and analytics",
          body: (
            <p>
              The site uses essential cookies or similar technologies for account access, security,
              booking, payment flow and to remember your cookie notice choice. We are not currently
              using advertising or analytics cookies. If analytics, advertising or third-party
              tracking tools are added later, this policy and any required consent controls should
              be updated before launch.
            </p>
          ),
        },
        {
          title: "Data security and retention",
          body: (
            <p>
              We use reasonable safeguards appropriate for a small training business, but no website
              or internet transmission is completely secure. We keep information only as long as
              needed for training administration, legal, accounting or business purposes.
            </p>
          ),
        },
        {
          title: "Contact and privacy requests",
          body: (
            <p>
              To request access, correction or deletion of your information, contact us at{" "}
              <a href="mailto:cprpulseandpurpose@gmail.com" className="font-semibold text-pulse">
                cprpulseandpurpose@gmail.com
              </a>
              . We may need to verify your identity before completing a request.
            </p>
          ),
        },
      ]}
    />
  );
}
