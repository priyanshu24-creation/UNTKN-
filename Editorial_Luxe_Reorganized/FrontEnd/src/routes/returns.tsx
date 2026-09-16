import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/marketing/PolicyPage";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Exchanges — UNTKN" },
      {
        name: "description",
        content:
          "How to return or exchange an UNTKN piece: the window, the condition we need it in, and how refunds are issued.",
      },
      { property: "og:title", content: "Returns & Exchanges — UNTKN" },
      { property: "og:description", content: "Our return window, conditions and refund process." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Returns"
      title="Returns & exchanges"
      intro="Sizing is personal. If a piece isn't right, send it back within 7 days of delivery."
      sections={[
        {
          heading: "The window",
          body: (
            <p>
              Email us within 7 days of delivery to open a return. We&apos;ll reply with the studio
              address and a reference to write on the parcel.
            </p>
          ),
        },
        {
          heading: "Condition",
          body: (
            <p>
              Unworn, unwashed, tags attached, in the original packaging. Anything worn or altered
              can&apos;t be accepted.
            </p>
          ),
        },
        {
          heading: "Exchanges",
          body: (
            <p>
              Exchanges depend on stock — runs are short, so we&apos;ll confirm your size is still
              available before you ship anything back.
            </p>
          ),
        },
        {
          heading: "Refunds",
          body: (
            <p>
              Once the parcel is inspected, refunds go back to the original payment method within 5
              to 7 working days. Return shipping is on you unless the piece arrived faulty.
            </p>
          ),
        },
        {
          heading: "Start a return",
          body: (
            <p>
              Email{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
                {siteConfig.contact.email}
              </a>{" "}
              with your order number and what you&apos;d like to do.
            </p>
          ),
        },
      ]}
    />
  );
}
