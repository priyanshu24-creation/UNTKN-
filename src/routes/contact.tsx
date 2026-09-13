import { createFileRoute } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UNTKN" },
      {
        name: "description",
        content:
          "Reach the UNTKN studio about an order, a return, sizing or stockist enquiries. Email, phone and studio address.",
      },
      { property: "og:title", content: "Contact — UNTKN" },
      { property: "og:description", content: "Reach the UNTKN studio in Kolkata." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="max-w-3xl">
        <p className="label-xs text-muted-foreground">Contact</p>
        <h1 className="display-lg mt-6">Talk to the studio</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Orders, returns, sizing or stockist enquiries — one of us reads every message.
          {" "}
          {siteConfig.contact.supportHours}.
        </p>
      </header>

      <div className="mt-20 grid gap-12 md:grid-cols-3">
        <section>
          <h2 className="label-xs text-muted-foreground">Email</h2>
          <p className="mt-4 text-sm">
            <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
              {siteConfig.contact.email}
            </a>
          </p>
        </section>
        <section>
          <h2 className="label-xs text-muted-foreground">Phone</h2>
          <p className="mt-4 text-sm">
            <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`} className="link-rule">
              {siteConfig.contact.phone}
            </a>
          </p>
        </section>
        <section>
          <h2 className="label-xs text-muted-foreground">Studio</h2>
          <address className="mt-4 not-italic text-sm leading-relaxed text-muted-foreground">
            {siteConfig.contact.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
        </section>
      </div>

      <section className="mt-24 hairline-t pt-16">
        <h2 className="display-sm">Newsletter</h2>
        <div className="mt-8 max-w-md">
          <NewsletterForm source="contact" />
        </div>
      </section>
    </div>
  );
}
