import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ProductCard } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/EditorialButton";
import { Reveal, RevealImage, RevealWords } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { homepageSectionsQuery, lookbookQuery, productsQuery } from "@/lib/queries";
import type { HomepageSection } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNTKN — Heavyweight Waffle Thermals, Printed by Hand" },
      {
        name: "description",
        content:
          "Independent streetwear from Kolkata. Hand-drawn graphics on heavyweight waffle thermals, made in short runs and never reprinted.",
      },
      { property: "og:title", content: "UNTKN — Heavyweight Waffle Thermals, Printed by Hand" },
      {
        property: "og:description",
        content:
          "Independent streetwear from Kolkata. Hand-drawn graphics on heavyweight waffle thermals, made in short runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homepageSectionsQuery()),
      context.queryClient.ensureQueryData(productsQuery({ sort: "newest", limit: 4 })),
      context.queryClient.ensureQueryData(productsQuery({ category: "graphic-tees", limit: 2 })),
      context.queryClient.ensureQueryData(productsQuery({ featuredOnly: true, limit: 4 })),
      context.queryClient.ensureQueryData(lookbookQuery()),
    ]);
  },
  component: HomePage,
});

function useSection(sections: HomepageSection[], key: string) {
  return sections.find((s) => s.section_key === key) ?? null;
}

function HomePage() {
  const { data: sections } = useSuspenseQuery(homepageSectionsQuery());
  const { data: newArrivals } = useSuspenseQuery(productsQuery({ sort: "newest", limit: 4 }));
  const { data: graphicTees } = useSuspenseQuery(productsQuery({ category: "graphic-tees", limit: 2 }));
  const { data: featured } = useSuspenseQuery(productsQuery({ featuredOnly: true, limit: 4 }));
  const { data: lookbook } = useSuspenseQuery(lookbookQuery());

  const hero = useSection(sections, "hero");
  const collection = useSection(sections, "featured_collection");
  const story = useSection(sections, "brand_story");
  const promo = useSection(sections, "promo");
  const gallery = useSection(sections, "gallery");
  const newsletter = useSection(sections, "newsletter");

  return (
    <>
      <Hero section={hero} />

      <section className="home-section shell" aria-labelledby="new-arrivals">
        <SectionHeader eyebrow="01 / THE DROP" title="New Arrivals" href="/shop" />
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-10 md:grid-cols-4 md:gap-x-5 md:gap-y-14">
          {newArrivals.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.05}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {graphicTees.length > 0 && (
        <section className="home-section shell" aria-labelledby="graphic-tees">
          <SectionHeader eyebrow="02 / GRAPHIC TEES" title="Karma / History" href="/shop" linkLabel="Shop Tees" />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-10 md:grid-cols-2 md:gap-x-5 md:gap-y-14">
            {graphicTees.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {collection && <FeaturedCollection section={collection} />}

      {lookbook.length > 0 && <EditorialLookbook images={lookbook} />}

      {story && <BrandStory section={story} />}

      {promo && <PromoBanner section={promo} />}

      {featured.length > 0 && (
        <section className="home-section shell" aria-labelledby="featured-products">
          <SectionHeader eyebrow="05 / SELECTED" title="Featured" href="/shop" linkLabel="Shop Featured" />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-10 md:grid-cols-4 md:gap-x-5 md:gap-y-14">
            {featured.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {gallery && lookbook.length > 0 && <GalleryStrip section={gallery} images={lookbook} />}

      <Newsletter section={newsletter} />
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "View All",
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="editorial-section-header">
      <div>
        <p className="label-xs text-muted-foreground">{eyebrow}</p>
        <h2 className="display-md mt-3">{title}</h2>
      </div>
      <Link to={href} className="label-xs link-rule shrink-0">
        {linkLabel}
      </Link>
    </div>
  );
}

/* ------------------------------- hero ------------------------------- */

function Hero({ section }: { section: HomepageSection | null }) {
  const image = section?.image_url;
  const headline = section?.title ?? siteConfig.brand.tagline;

  return (
    <section className="hero-frame">
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="hero-image"
          style={{ objectPosition: "center center" }}
        />
      )}

      <div className="hero-vignette" />

      <div className="hero-content shell">
        <div className="max-w-2xl text-paper">
          {section?.eyebrow && (
            <Reveal y={14} duration={0.7}>
              <p className="hero-eyebrow">{section.eyebrow}</p>
            </Reveal>
          )}

          <h1 className="hero-title">
            <RevealWords text={headline} delay={0.12} />
          </h1>

          {section?.subtitle && (
            <Reveal y={18} delay={0.42} className="mt-5 max-w-xl md:mt-6">
              <p className="hero-description">{section.subtitle}</p>
            </Reveal>
          )}

          <Reveal y={18} delay={0.58} className="mt-7 flex flex-wrap gap-3 md:mt-9">
            <ButtonLink
              to={(section?.cta_href ?? "/shop") as string}
              variant="onImage"
              size="md"
              className="hero-primary-button"
            >
              {section?.cta_label ?? "Shop Collection"}
            </ButtonLink>

            {section?.secondary_cta_label && (
              <ButtonLink
                to={(section.secondary_cta_href ?? "/lookbook") as string}
                variant="onImage"
                size="md"
                className="hero-secondary-button"
              >
                {section.secondary_cta_label}
              </ButtonLink>
            )}
          </Reveal>
        </div>
      </div>

      <div className="hero-index label-xs" aria-hidden="true">
        SCROLL TO EXPLORE
      </div>
    </section>
  );
}

/* ------------------------ featured collection ------------------------ */

function FeaturedCollection({ section }: { section: HomepageSection }) {
  return (
    <section className="home-section shell" aria-labelledby="featured-collection">
      <div className="editorial-split">
        <RevealImage
          src={section.image_url ?? ""}
          alt={section.title ?? "Featured collection"}
          priority
          className="editorial-image editorial-image-tall"
        />

        <div className="editorial-copy">
          <Reveal>
            <p className="label-xs text-muted-foreground">{section.eyebrow}</p>
            <h2 id="featured-collection" className="display-lg mt-5">
              {section.title}
            </h2>
            {section.subtitle && <p className="mt-5 label-sm text-muted-foreground">{section.subtitle}</p>}
            {section.body && <p className="body-lg mt-7 max-w-md">{section.body}</p>}
            {section.cta_label && section.cta_href && (
              <ButtonLink to={section.cta_href} variant="outline" size="md" className="mt-9">
                {section.cta_label}
              </ButtonLink>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- editorial lookbook --------------------------- */

function EditorialLookbook({
  images,
}: {
  images: Array<{ id: string; image_url: string; title: string | null; caption?: string | null }>;
}) {
  const items = images.slice(0, 5);

  return (
    <section className="home-section shell" aria-labelledby="editorial-lookbook">
      <div className="editorial-section-header">
        <div>
          <p className="label-xs text-muted-foreground">03 / EDITORIAL</p>
          <h2 id="editorial-lookbook" className="display-md mt-3">
            Campaign 01
          </h2>
        </div>
        <Link to="/lookbook" className="label-xs link-rule">
          Full Lookbook
        </Link>
      </div>

      <div className="lookbook-grid mt-8 md:mt-10">
        {items.map((item, i) => (
          <Reveal
            as="figure"
            key={item.id}
            delay={i * 0.07}
            className={`lookbook-item lookbook-item-${i + 1}`}
          >
            <Link to="/lookbook" className="group block">
              <div className="lookbook-media">
                <img
                  src={item.image_url}
                  alt={item.title ?? "UNTKN campaign photograph"}
                  loading="lazy"
                  decoding="async"
                  className="photo photo-zoom"
                />
                <span className="lookbook-number">0{i + 1}</span>
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                <span className="label-xs">{item.title ?? "UNTKN"}</span>
                {item.caption && <span className="label-xs text-muted-foreground">{item.caption}</span>}
              </figcaption>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- brand story --------------------------- */

function BrandStory({ section }: { section: HomepageSection }) {
  return (
    <section className="home-section shell" aria-labelledby="brand-story">
      <div className="editorial-story">
        <div className="editorial-story-copy">
          <Reveal>
            <p className="label-xs text-muted-foreground">04 / THE LABEL</p>
            <h2 id="brand-story" className="display-lg mt-5 max-w-xl">
              {section.title}
            </h2>
            {section.body && (
              <div className="mt-7 max-w-lg space-y-5">
                {section.body.split("\n\n").map((para) => (
                  <p key={para.slice(0, 24)} className="body-lg">
                    {para}
                  </p>
                ))}
              </div>
            )}
            {section.cta_label && section.cta_href && (
              <ButtonLink to={section.cta_href} variant="ghost" size="bare" className="mt-8">
                <span className="link-rule">{section.cta_label}</span>
              </ButtonLink>
            )}
          </Reveal>
        </div>

        <RevealImage
          src={section.image_url ?? ""}
          alt={section.title ?? "UNTKN"}
          className="editorial-story-image"
        />
      </div>
    </section>
  );
}

/* ---------------------------- promo banner ---------------------------- */

function PromoBanner({ section }: { section: HomepageSection }) {
  return (
    <section className="promo-frame">
      {section.image_url && (
        <img
          src={section.image_url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="photo absolute inset-0"
          style={{ objectPosition: "center 38%" }}
        />
      )}
      <div className="promo-overlay" />
      <div className="shell relative z-10 flex h-full items-center">
        <div className="max-w-2xl text-paper">
          <Reveal>
            <p className="label-xs text-paper/70">{section.eyebrow}</p>
            <h2 className="display-lg mt-5">{section.title}</h2>
            {section.subtitle && <p className="mt-5 label-sm text-paper/75">{section.subtitle}</p>}
            {section.body && <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-paper/80">{section.body}</p>}
            {section.cta_label && section.cta_href && (
              <ButtonLink to={section.cta_href} variant="onImage" size="md" className="mt-9">
                {section.cta_label}
              </ButtonLink>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- gallery strip ---------------------------- */

function GalleryStrip({
  section,
  images,
}: {
  section: HomepageSection;
  images: Array<{ id: string; image_url: string; title: string | null }>;
}) {
  return (
    <section className="home-section shell" aria-labelledby="gallery">
      <div className="editorial-section-header">
        <div>
          <p className="label-xs text-muted-foreground">06 / CAMPAIGN</p>
          <h2 id="gallery" className="display-md mt-3">{section.title}</h2>
        </div>
        {section.subtitle && <p className="label-xs text-muted-foreground">{section.subtitle}</p>}
      </div>

      <ul className="gallery-strip mt-8 md:mt-10">
        {images.slice(0, 5).map((item, i) => (
          <Reveal as="li" key={item.id} delay={i * 0.05}>
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={item.image_url}
                alt={item.title ?? "Campaign photograph"}
                loading="lazy"
                decoding="async"
                className="photo photo-zoom"
              />
            </div>
          </Reveal>
        ))}
      </ul>

      {section.cta_label && section.cta_href && (
        <div className="mt-8">
          <ButtonLink to={section.cta_href} variant="outline" size="md">{section.cta_label}</ButtonLink>
        </div>
      )}
    </section>
  );
}

/* ----------------------------- newsletter ----------------------------- */

function Newsletter({ section }: { section: HomepageSection | null }) {
  return (
    <section className="newsletter-frame shell" aria-labelledby="newsletter">
      <div className="newsletter-inner">
        <div>
          <p className="label-xs text-muted-foreground">{section?.eyebrow ?? "07 / STUDIO LIST"}</p>
          <h2 id="newsletter" className="display-lg mt-5 max-w-2xl">
            {section?.title ?? "Never miss a drop."}
          </h2>
        </div>

        <div className="max-w-md md:pb-1">
          <p className="body-lg">
            {section?.subtitle ?? "Short runs sell out. Subscribers hear before anyone else."}
          </p>
          <NewsletterForm className="mt-6" source="homepage" />
        </div>
      </div>
    </section>
  );
}
