import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/marketing/PolicyPage";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping — UNTKN" },
      {
        name: "description",
        content:
          "UNTKN shipping rates, free shipping threshold, dispatch times and estimated delivery windows across India.",
      },
      { property: "og:title", content: "Shipping — UNTKN" },
      { property: "og:description", content: "Rates, dispatch times and delivery windows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const { shipping } = siteConfig;
  return (
    <PolicyPage
      eyebrow="Shipping"
      title="Shipping"
      intro={shipping.note}
      sections={[
        {
          heading: "Rates",
          body: (
            <p>
              Standard shipping is {formatPrice(shipping.flatFee)} anywhere in{" "}
              {siteConfig.commerce.country}. Orders over{" "}
              {formatPrice(shipping.freeShippingThreshold)} ship free.
            </p>
          ),
        },
        {
          heading: "Dispatch",
          body: (
            <p>
              Orders leave the studio within 2 working days. You&apos;ll get a tracking link by
              email as soon as the parcel is scanned.
            </p>
          ),
        },
        {
          heading: "Delivery",
          body: (
            <p>
              Expect delivery in {shipping.estimatedDelivery} after dispatch. Remote pin codes can
              take a little longer.
            </p>
          ),
        },
        {
          heading: "Something wrong?",
          body: (
            <p>
              If a parcel is delayed or arrives damaged, email{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
                {siteConfig.contact.email}
              </a>{" "}
              with your order number and we&apos;ll sort it.
            </p>
          ),
        },
      ]}
    />
  );
}
