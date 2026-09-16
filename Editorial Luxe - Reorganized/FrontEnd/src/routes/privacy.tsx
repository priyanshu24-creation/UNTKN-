import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/marketing/PolicyPage";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — UNTKN" },
      {
        name: "description",
        content:
          "What personal data UNTKN collects, how it is used for orders and payments, and how to request deletion.",
      },
      { property: "og:title", content: "Privacy Policy — UNTKN" },
      { property: "og:description", content: "How we handle your personal data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="We collect the minimum needed to take your order, ship it and support you afterwards."
      sections={[
        {
          heading: "What we collect",
          body: (
            <p>
              Your name, email, phone number and shipping address; your order and payment history;
              and basic technical data such as your browser type when you visit the site.
            </p>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <p>
              To process and ship orders, verify payments, answer support requests, and — only if
              you opt in — send occasional release emails. We don&apos;t sell your data.
            </p>
          ),
        },
        {
          heading: "Payments",
          body: (
            <p>
              Card details never reach our servers. Payments are processed by our payment provider,
              who handles card data under their own security standards.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <p>
              You can view and edit your details, addresses and orders from your account at any
              time. Every record is restricted to your own login.
            </p>
          ),
        },
        {
          heading: "Deletion",
          body: (
            <p>
              Ask us to delete your account by writing to{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
                {siteConfig.contact.email}
              </a>
              . We keep order records where tax law requires it.
            </p>
          ),
        },
      ]}
    />
  );
}
