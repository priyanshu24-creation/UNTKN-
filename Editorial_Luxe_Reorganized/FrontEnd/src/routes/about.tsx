import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { homepageSectionsQuery } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — UNTKN" },
      {
        name: "description",
        content:
          "UNTKN is an independent streetwear label from Kolkata. Hand-drawn graphics, heavyweight fabric, short runs — the story behind the label.",
      },
      { property: "og:title", content: "About — UNTKN" },
      {
        property: "og:description",
        content: "An independent streetwear label from Kolkata. Hand-drawn, heavyweight, short-run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homepageSectionsQuery()),
  component: AboutPage,
});

function AboutPage() {
  const { data: sections } = useSuspenseQuery(homepageSectionsQuery());
  const story = sections.find((s) => s.section_key === "brand_story") ?? null;

  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-4xl">
        <p className="label-xs text-muted-foreground">{story?.eyebrow ?? "About the label"}</p>
        <h1 className="display-lg mt-6">{story?.title ?? siteConfig.brand.tagline}</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {story?.body ?? siteConfig.brand.shortDescription}
        </p>
      </header>

      {story?.image_url && (
        <div className="shell mt-20">
          <RevealImage
            src={story.image_url}
            alt={story.title ?? siteConfig.brand.name}
            className="aspect-[16/9]"
            priority
          />
        </div>
      )}

      <section className="shell mt-32 grid gap-12 md:grid-cols-3">
        {[
          {
            title: "Drawn by hand",
            body: "Every graphic starts as ink on paper in the studio. Nothing is licensed, nothing is traced.",
          },
          {
            title: "Heavyweight only",
            body: "Waffle knits and brushed cottons chosen for weight and drape, cut for a relaxed, boxy fit.",
          },
          {
            title: "Short runs",
            body: "Each piece is produced in a small batch, sold once, and never reprinted.",
          },
        ].map((item, i) => (
          <Reveal key={item.title} delay={i * 0.08}>
            <h2 className="display-sm">{item.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="shell mt-32 hairline-t pt-16">
        <h2 className="display-sm">Studio</h2>
        <div className="mt-8 grid gap-10 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">
          <address className="not-italic">
            {siteConfig.contact.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
          <div>
            <p>{siteConfig.contact.email}</p>
            <p className="mt-1">{siteConfig.contact.phone}</p>
            <p className="mt-1">{siteConfig.contact.supportHours}</p>
          </div>
          <ul>
            {siteConfig.social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="link-rule">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="shell mt-32 pb-40 hairline-t pt-16">
        <h2 className="display-sm">Get the next drop first</h2>
        <div className="mt-8 max-w-md">
          <NewsletterForm source="about" />
        </div>
      </section>
    </div>
  );
}
