import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { ProductCard } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/EditorialButton";
import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { homepageSectionsQuery, lookbookQuery, productsQuery } from "@/lib/queries";
import type { HomepageSection } from "@/lib/types";
import picture2 from "@/assets/Picture_2.jpeg";
import picture3 from "@/assets/Picture_3.jpeg";
import picture5 from "@/assets/Picture_5.jpeg";
import picture7 from "@/assets/Picture_7.jpeg";
import picture8 from "@/assets/Picture_8.jpeg";
import girlModel1 from "@/assets/Girl_Model_1.PNG";
import girlModel2 from "@/assets/Girl_Model_2.PNG";
import girlModel6 from "@/assets/Girl_Model_6.PNG";

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
      { property: "og:description", content: "Limited streetwear drops from UNTKN. Wear your story." },
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

const REAL_EDITORIAL = [
  { image: picture7, title: "DRAGON FLAME", meta: "MURAL / ON LOCATION" },
  { image: girlModel1, title: "KARMA", meta: "OVERSIZED / FRONT" },
  { image: picture8, title: "MISERY WORLD", meta: "OVERHEAD / LOCATION" },
  { image: girlModel6, title: "HISTORY", meta: "BACK PRINT / FRONTIER" },
  { image: girlModel2, title: "CHAKRAS", meta: "SEVEN CHAKRAS / BACK" },
] as const;

function HomePage() {
  const { data: sections } = useSuspenseQuery(homepageSectionsQuery());
  const { data: newArrivals } = useSuspenseQuery(productsQuery({ sort: "newest", limit: 4 }));
  useSuspenseQuery(productsQuery({ featuredOnly: true, limit: 4 }));
  useSuspenseQuery(lookbookQuery());

  const hero = section(sections, "hero");
  const collection = section(sections, "featured_collection");
  const story = section(sections, "brand_story");
  const newsletter = section(sections, "newsletter");

  return (
    <main className="genz-v2-home">
      <section className="genz-v2-hero">
        <div className="genz-v2-hero-panel">
          <div className="genz-v2-hero-panel-top">
            <span>DROP 01 / 2026</span>
          </div>
          <div className="genz-v2-hero-copy">
            <p className="genz-v2-eyebrow">{hero?.eyebrow ?? "CAPSULE 01 — WAFFLE PROGRAMME"}</p>
            <h1>{hero?.title ?? "MISERY WORLD"}</h1>
            <p>{hero?.subtitle ?? "Heavyweight waffle thermals, printed sleeve to sleeve, made in short runs and never reprinted."}</p>
            <div className="genz-v2-actions">
              <ButtonLink to={(hero?.cta_href ?? "/shop") as string} variant="solid" size="md">
                {hero?.cta_label ?? "Shop collection"}
              </ButtonLink>
            </div>
          </div>
          <div className="genz-v2-hero-panel-bottom">
            <span>UNKNOWN BY NAME. UNFORGETTABLE BY STYLE.</span>
          </div>
        </div>
        <div className="genz-v2-hero-photo">
          <img src={picture3} alt="UNTKN MISERY WORLD real campaign photograph" fetchPriority="high" decoding="async" />
          <span className="genz-v2-hero-made">MADE IN KOLKATA</span>
          <span className="genz-v2-hero-scroll">SCROLL ↓</span>
        </div>
        <nav className="genz-v2-hero-nav" aria-label="Primary navigation">
          <Link to="/shop">SHOP</Link>
          <Link to="/collections">COLLECTIONS</Link>
          <Link to="/lookbook">LOOKBOOK</Link>
          <Link to="/about">ABOUT</Link>
        </nav>
      </section>

      <section className="genz-v2-intro shell">
        <div className="genz-v2-intro-index">01</div>
        <div>
          <p className="genz-v2-eyebrow">THE NEW DROP</p>
          <h2>Pieces with a point of view.</h2>
        </div>
        <Link to="/shop" className="genz-v2-link">Shop all <span>↗</span></Link>
      </section>

      <section className="genz-v2-products shell" aria-label="New arrivals">
        <div className="genz-v2-product-grid">
          {newArrivals.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.04} className="genz-v2-product-item">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="genz-v2-feature shell" aria-labelledby="collection-title">
        <div className="genz-v2-feature-image">
          <RevealImage src={picture2} alt="MISERY WORLD real product photograph" />
          <span>01 / MISERY WORLD</span>
        </div>
        <div className="genz-v2-feature-copy">
          <p className="genz-v2-eyebrow">{collection?.subtitle ?? "THE COLLECTION"}</p>
          <h2 id="collection-title">{collection?.title ?? "MISERY WORLD"}</h2>
          <p>{collection?.body ?? "A graphic-led uniform for days that don't need explaining."}</p>
          <ButtonLink to={(collection?.cta_href ?? "/shop") as string} variant="outline" size="md">
            {collection?.cta_label ?? "Explore the collection"}
          </ButtonLink>
        </div>
      </section>

      <section className="genz-v2-editorial shell" aria-labelledby="editorial-title">
        <div className="genz-v2-section-head">
          <div>
            <p className="genz-v2-eyebrow">02 / ON LOCATION</p>
            <h2 id="editorial-title">No studio. No pretending.</h2>
          </div>
          <p>Real people. Real places. The clothes as they actually look.</p>
        </div>
        <div className="genz-v2-editorial-grid">
          {REAL_EDITORIAL.map((item, index) => (
            <Reveal key={item.title + index} className={`genz-v2-editorial-card genz-v2-editorial-card-${index + 1}`}>
              <Link to="/lookbook">
                <div className="genz-v2-editorial-media">
                  <img src={item.image} alt={`${item.title} — UNTKN`} loading="lazy" decoding="async" />
                </div>
                <div className="genz-v2-editorial-meta">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="genz-v2-centered-link"><Link to="/lookbook" className="genz-v2-link">Enter the lookbook <span>↗</span></Link></div>
      </section>

      <section className="genz-v2-manifesto">
        <div className="shell">
          <p className="genz-v2-eyebrow">03 / UNTKN</p>
          <h2>Wear less noise.<br />Leave more impression.</h2>
          <div className="genz-v2-manifesto-foot">
            <p>{story?.body ?? "Short runs. Strong graphics. Honest photography. Built for people who don't need a uniform to belong."}</p>
            <Link to={story?.cta_href ?? "/about"} className="genz-v2-invert-link">Our story ↗</Link>
          </div>
        </div>
      </section>

      <section className="genz-v2-last-image shell">
        <div className="genz-v2-last-image-wrap">
          <img src={picture5} alt="UNTKN real on-location campaign photograph" loading="lazy" decoding="async" />
          <div className="genz-v2-last-caption">
            <span>SHOT ON LOCATION</span>
            <span>UNTKN / 001</span>
          </div>
        </div>
      </section>

      <section className="genz-v2-newsletter shell" aria-labelledby="newsletter-title">
        <div>
          <p className="genz-v2-eyebrow">04 / THE LIST</p>
          <h2 id="newsletter-title">Be there<br />when it drops.</h2>
        </div>
        <div className="genz-v2-newsletter-copy">
          <p>{newsletter?.body ?? "Early access, new drops and occasional things worth knowing."}</p>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
}
