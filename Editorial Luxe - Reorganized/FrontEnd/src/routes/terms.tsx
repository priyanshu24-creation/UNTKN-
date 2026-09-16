import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/marketing/PolicyPage";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — UNTKN" },
      {
        name: "description",
        content:
          "The terms that apply when you order from UNTKN: pricing, stock, orders, cancellations and use of our imagery.",
      },
      { property: "og:title", content: "Terms of Service — UNTKN" },
      { property: "og:description", content: "The terms that apply when you order from us." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms of service"
      intro={`By ordering from ${siteConfig.brand.name} you agree to the terms below.`}
      sections={[
        {
          heading: "Orders",
          body: (
            <p>
              An order is confirmed once payment is verified. We may cancel and refund an order if
              a piece sells out in the same moment or if we can&apos;t verify the payment.
            </p>
          ),
        },
        {
          heading: "Pricing & stock",
          body: (
            <p>
              Prices are in {siteConfig.commerce.currency} and include applicable taxes. Stock is
              counted per size and colour; the total you pay is always recalculated on our side
              before payment.
            </p>
          ),
        },
        {
          heading: "Cancellations",
          body: (
            <p>
              Ask to cancel before dispatch and we&apos;ll refund in full. After dispatch, our
              returns policy applies.
            </p>
          ),
        },
        {
          heading: "Imagery & design",
          body: (
            <p>
              All photography, graphics and garment designs on this site belong to{" "}
              {siteConfig.brand.name} and may not be reproduced without permission.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms? Write to{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
                {siteConfig.contact.email}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
