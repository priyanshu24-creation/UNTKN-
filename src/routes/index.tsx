import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ProductCard } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/EditorialButton";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { homepageSectionsQuery, lookbookQuery, productsQuery } from "@/lib/queries";
import type { HomepageSection } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNTKN — Unknown by Name. Unforgettable by Style." },
      {
        name: "description",
        content:
          "UNTKN is independent streetwear from Kolkata — limited drops, heavyweight pieces and graphics made to be remembered.",
      },
      { property: "og:title", content: "UNTKN — Unknown by Name. Unforgettable by Style." },
      {
        property: "og:description",
        content: "Limited streetwear drops from UNTKN. Wear your story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homepageSectionsQuery()),
      context.queryClient.ensureQueryData(productsQuery({ sort: "newest", limit: 4 })),
      context.queryClient.ensureQueryData(productsQuery({ featuredOnly: true, limit: 4 })),
      context.queryClient.ensureQueryData(lookbookQuery()),
    ]);
  },
  component: HomePage,
});

function section(sections: HomepageSection[], key: string) {
  return sections.find((item) => item.section_key === key) ?? null;
}

function HomePage() {
  const { data: sections } = useSuspenseQuery(homepageSectionsQuery());
  const { data: newArrivals } = useSuspenseQuery(productsQuery({ sort: "newest", limit: 4 }));
  const { data: featured } = useSuspenseQuery(productsQuery({ featuredOnly: true, limit: 4 }));
  const { data: lookbook } = useSuspenseQuery(lookbookQuery());

  const hero = section(sections, "hero");
  const collection = section(sections, "featured_collection");
  const story = section(sections, "brand_story");
  const gallery = section(sections, "gallery");
  const newsletter = section(sections, "newsletter");

  return (
    <main className="genz-home">
      <Hero section={hero} />

      <div className="genz-marquee" aria-hidden="true">
        <div className="genz-marquee-track">
          <span>UNKNOWN BY NAME</span><i>✳</i><span>UNFORGETTABLE BY STYLE</span><i>✳</i>
          <span>LIMITED DROPS</span><i>✳</i><span>MADE IN KOLKATA</span><i>✳</i>
          <span>UNKNOWN BY NAME</span><i>✳</i><span>UNFORGETTABLE BY STYLE</span><i>✳</i>
        </div>
      </div>

      <section className="genz-section genz-drop shell" aria-labelledby="new-drop">
        <SectionIntro number="01" eyebrow="THE DROP" title="Made to stand out." href="/shop" />
        <div className="genz-product-grid">
          {newArrivals.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.05} className="genz-product-wrap">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="genz-statement" aria-labelledby="statement-title">
        <div className="shell genz-statement-inner">
          <Reveal>
            <p className="genz-kicker">UNTKN / 001</p>
            <h2 id="statement-title">Unknown by name.<br />Unforgettable by style.</h2>
            <p>
              No loud logos. No overthinking. Just pieces with enough attitude to become yours.
            </p>
            <ButtonLink to="/shop" variant="onImage" size="md" className="genz-dark-button">
              Shop the drop
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {collection && (
        <section className="genz-section shell genz-feature" aria-labelledby="feature-title">
          <div className="genz-feature-media">
            <RevealImage src={collection.image_url ?? ""} alt={collection.title ?? "UNTKN collection"} priority />
            <span className="genz-floating-label">DROP 01 / 2026</span>
          </div>
          <div className="genz-feature-copy">
            <p className="genz-kicker">02 / COLLECTION</p>
            <h2 id="feature-title">{collection.title ?? "MISERY WORLD"}</h2>
            {collection.subtitle && <p className="genz-feature-subtitle">{collection.subtitle}</p>}
            {collection.body && <p className="genz-body">{collection.body}</p>}
            <ButtonLink to={(collection.cta_href ?? "/shop") as string} variant="outline" size="md">
              {collection.cta_label ?? "Explore collection"}
            </ButtonLink>
          </div>
        </section>
      )}

      {lookbook.length > 0 && (
        <section className="genz-section shell" aria-labelledby="lookbook-title">
          <SectionIntro number="03" eyebrow="ON LOCATION" title="Seen in the real world." href="/lookbook" linkLabel="Open lookbook" />
          <div className="genz-lookbook-grid">
            {lookbook.slice(0, 4).map((item, index) => (
              <Reveal key={item.id} delay={index * 0.06} className={index === 0 ? "genz-lookbook-card genz-lookbook-card--large" : "genz-lookbook-card"}>
                <Link to="/lookbook" className="group block">
                  <div className="genz-lookbook-media">
                    <img src={item.image_url} alt={item.title ?? "UNTKN lookbook"} loading="lazy" decoding="async" />
                    <span className="genz-lookbook-arrow">↗</span>
                  </div>
                  <div className="genz-lookbook-meta">
                    <strong>{item.title ?? "UNTKN"}</strong>
                    <span>{item.caption ?? "Shot on location"}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="genz-section shell genz-story" aria-labelledby="story-title">
        <div className="genz-story-copy">
          <p className="genz-kicker">04 / THE LABEL</p>
          <h2 id="story-title">Less noise.<br />More identity.</h2>
          <p className="genz-body">
            {story?.body ??
              "UNTKN is built around short runs, honest photography and graphics that feel personal. Wear it your way, then make it yours."}
          </p>
          <Link to={story?.cta_href ?? "/about"} className="genz-text-link">
            {story?.cta_label ?? "Our story"} <span>↗</span>
          </Link>
        </div>
        <div className="genz-story-image">
          {story?.image_url ? (
            <RevealImage src={story.image_url} alt={story.title ?? "UNTKN story"} />
          ) : lookbook[4]?.image_url ? (
            <RevealImage src={lookbook[4].image_url} alt="UNTKN campaign" />
          ) : null}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="genz-section shell" aria-labelledby="selected-title">
          <SectionIntro number="05" eyebrow="SELECTED" title="The pieces people notice." href="/shop" linkLabel="Shop all" />
          <div className="genz-product-grid genz-product-grid--selected">
            {featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.05} className="genz-product-wrap">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {gallery && lookbook.length > 0 && (
        <section className="genz-campaign">
          <div className="shell genz-campaign-head">
            <div>
              <p className="genz-kicker">06 / CAMPAIGN</p>
              <h2>{gallery.title ?? "No studio. Just real."}</h2>
            </div>
            <p>{gallery.subtitle ?? "Photographed where the clothes actually live."}</p>
          </div>
          <div className="genz-campaign-strip">
            {lookbook.slice(0, 5).map((item) => (
              <Link key={item.id} to="/lookbook" className="genz-campaign-image">
                <img src={item.image_url} alt={item.title ?? "UNTKN campaign"} loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="genz-newsletter shell" aria-labelledby="newsletter-title">
        <div>
          <p className="genz-kicker">07 / THE LIST</p>
          <h2 id="newsletter-title">First to know.<br />Never too much.</h2>
        </div>
        <div className="genz-newsletter-form">
          <p>{newsletter?.subtitle ?? "New drops, limited runs and the occasional thing worth knowing."}</p>
          <NewsletterForm className="mt-6" source="homepage" />
        </div>
      </section>
    </main>
  );
}

function SectionIntro({
  number,
  eyebrow,
  title,
  href,
  linkLabel = "View all",
}: {
  number: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="genz-section-intro">
      <div>
        <p className="genz-kicker">{number} / {eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <Link to={href} className="genz-text-link">{linkLabel} <span>↗</span></Link>
    </div>
  );
}

function Hero({ section }: { section: HomepageSection | null }) {
  const image = section?.image_url;

  return (
    <section className="genz-hero">
      <div className="genz-hero-image">
        {image && <img src={image} alt="UNTKN campaign" fetchPriority="high" decoding="async" />}
        <div className="genz-hero-shade" />
        <div className="genz-hero-sticker">DROP 01<br />LIMITED RUN</div>
      </div>
      <div className="genz-hero-copy">
        <div>
          <p className="genz-kicker">{section?.eyebrow ?? "CAPSULE 01 — WAFFLE PROGRAMME"}</p>
          <h1>{section?.title ?? siteConfig.brand.tagline ?? "MISERY WORLD"}</h1>
          <p className="genz-hero-description">
            {section?.subtitle ?? "Heavyweight texture. Hand-drawn graphics. Built for everyday wear."}
          </p>
          <div className="genz-hero-actions">
            <ButtonLink to={(section?.cta_href ?? "/shop") as string} variant="solid" size="md">{section?.cta_label ?? "Shop collection"}</ButtonLink>
            <ButtonLink to={(section?.secondary_cta_href ?? "/lookbook") as string} variant="outline" size="md">{section?.secondary_cta_label ?? "View lookbook"}</ButtonLink>
          </div>
        </div>
        <div className="genz-hero-bottom">
          <span>IND / KOLKATA</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </div>
    </section>
  );
}
