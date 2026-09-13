import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import Picture1 from "@/assets/Picture_1.jpeg";
import Picture2 from "@/assets/Picture_2.jpeg";
import Picture3 from "@/assets/Picture_3.jpeg";
import Picture4 from "@/assets/Picture_4.jpeg";
import Picture5 from "@/assets/Picture_5.jpeg";
import Picture6 from "@/assets/Picture_6.jpeg";
import Picture7 from "@/assets/Picture_7.jpeg";
import Picture8 from "@/assets/Picture_8.jpeg";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ProductCard } from "@/components/shop/ProductCard";
import { siteConfig } from "@/config/site";
import { homepageSectionsQuery, lookbookQuery, productsQuery } from "@/lib/queries";
import type { HomepageSection } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNTKN — Independent Streetwear" },
      {
        name: "description",
        content:
          "UNTKN — heavyweight thermals, hand-drawn graphics and short-run streetwear from India.",
      },
      { property: "og:title", content: "UNTKN — Independent Streetwear" },
      {
        property: "og:description",
        content: "Heavyweight thermals and hand-drawn graphics, made in short runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homepageSectionsQuery()),
      context.queryClient.ensureQueryData(productsQuery({ sort: "newest", limit: 2 })),
      context.queryClient.ensureQueryData(productsQuery({ featuredOnly: true, limit: 2 })),
      context.queryClient.ensureQueryData(lookbookQuery()),
    ]);
  },
  component: HomePage,
});

function useSection(sections: HomepageSection[], key: string) {
  return sections.find((s) => s.section_key === key) ?? null;
}

const campaignImages = [
  { src: Picture3, title: "MISERY WORLD", caption: "Movement / 01" },
  { src: Picture4, title: "MISERY WORLD", caption: "Texture / 02" },
  { src: Picture6, title: "WAFFLE PROGRAMME", caption: "Short Run / 03" },
  { src: Picture7, title: "WAFFLE PROGRAMME", caption: "Graphic / 04" },
  { src: Picture8, title: "MISERY WORLD", caption: "Form / 05" },
];

function HomePage() {
  const { data: sections } = useSuspenseQuery(homepageSectionsQuery());
  const { data: products } = useSuspenseQuery(productsQuery({ sort: "newest", limit: 2 }));
  const { data: lookbook } = useSuspenseQuery(lookbookQuery());

  const hero = useSection(sections, "hero");
  const collection = useSection(sections, "featured_collection");
  const story = useSection(sections, "brand_story");
  const newsletter = useSection(sections, "newsletter");

  return (
    <div className="home-page">
      <Hero section={hero} />

      <main>
        <section className="home-section home-section--products" aria-labelledby="new-arrivals">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest drop</p>
              <h2 id="new-arrivals">New arrivals</h2>
            </div>
            <Link to="/shop" search={{ sort: "newest" }} className="text-link">
              View all
            </Link>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="editorial-intro" aria-labelledby="waffle-programme">
          <div className="editorial-intro__image">
            <img src={Picture2} alt="UNTKN Misery World heavyweight thermal" loading="lazy" />
          </div>
          <div className="editorial-intro__copy">
            <p className="eyebrow">{collection?.eyebrow ?? "Capsule 01"}</p>
            <h2 id="waffle-programme">
              {collection?.title ?? "The Waffle Programme"}
            </h2>
            <p>
              {collection?.body ??
                "Heavyweight thermals, hand-drawn graphics and short production runs."}
            </p>
            <Link to="/shop" className="solid-link">
              Shop the collection
            </Link>
          </div>
        </section>

        <section className="home-section home-section--lookbook" aria-labelledby="campaign">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Editorial</p>
              <h2 id="campaign">Campaign 01</h2>
            </div>
            <Link to="/lookbook" className="text-link">
              Full lookbook
            </Link>
          </div>

          <div className="lookbook-grid">
            {campaignImages.map((item, index) => (
              <Link
                key={item.src}
                to="/lookbook"
                className={`lookbook-card lookbook-card--${index + 1}`}
              >
                <img src={item.src} alt={item.title} loading="lazy" />
                <div className="lookbook-card__meta">
                  <span>{item.title}</span>
                  <span>{item.caption}</span>
                </div>
              </Link>
            ))}
          </div>
          {lookbook.length === 0 && <p className="sr-only">Campaign images</p>}
        </section>

        {story && <BrandStory section={story} />}

        <section className="campaign-wide" aria-label="UNTKN campaign">
          <img src={Picture5} alt="UNTKN Misery World campaign" loading="lazy" />
          <div className="campaign-wide__overlay" />
          <div className="campaign-wide__content">
            <p className="eyebrow">Capsule 01</p>
            <h2>Made in short runs.</h2>
            <Link to="/lookbook" className="light-link">
              Explore the lookbook
            </Link>
          </div>
        </section>

        <section className="home-newsletter" aria-labelledby="newsletter">
          <div>
            <p className="eyebrow">{newsletter?.eyebrow ?? "Studio list"}</p>
            <h2 id="newsletter">{newsletter?.title ?? "Never miss a drop."}</h2>
          </div>
          <div>
            <p>{newsletter?.subtitle ?? "New capsules and limited releases, first."}</p>
            <NewsletterForm className="newsletter-form--minimal" source="homepage" />
          </div>
        </section>
      </main>
    </div>
  );
}

function Hero({ section }: { section: HomepageSection | null }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero__image" src={Picture5} alt="UNTKN Misery World campaign" fetchPriority="high" />
      <div className="hero__shade" />

      <div className="hero__content">
        <p className="hero__eyebrow">{section?.eyebrow ?? "Capsule 01 — Waffle Programme"}</p>
        <h1 id="hero-title">{section?.title ?? "MISERY WORLD"}</h1>
        <p className="hero__description">
          {section?.subtitle ??
            "Heavyweight waffle thermals, printed sleeve to sleeve, made in short runs and never reprinted."}
        </p>
        <div className="hero__actions">
          <Link to="/shop" className="hero-button hero-button--light">
            Shop collection
          </Link>
          <Link to="/lookbook" className="hero-button hero-button--outline">
            Explore lookbook
          </Link>
        </div>
      </div>
    </section>
  );
}

function BrandStory({ section }: { section: HomepageSection }) {
  return (
    <section className="story" aria-labelledby="brand-story">
      <div className="story__image">
        <img src={Picture1} alt="UNTKN heavyweight graphic thermal" loading="lazy" />
      </div>
      <div className="story__copy">
        <p className="eyebrow">{section.eyebrow ?? "UNTKN"}</p>
        <h2 id="brand-story">{section.title ?? "Made in short runs."}</h2>
        <p>
          {section.body ??
            "Hand-drawn graphics, heavyweight construction and limited production. Nothing overproduced. Nothing repeated."}
        </p>
        <Link to="/about" className="text-link">
          About UNTKN
        </Link>
      </div>
    </section>
  );
}
