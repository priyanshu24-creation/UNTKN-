import { Link, createFileRoute } from "@tanstack/react-router";

import { Reveal, RevealImage } from "@/components/ui/Reveal";

import picture3 from "@/assets/Picture_3.jpeg";
import picture4 from "@/assets/Picture_4.jpeg";
import picture5 from "@/assets/Picture_5.jpeg";
import picture6 from "@/assets/Picture_6.jpeg";
import picture7 from "@/assets/Picture_7.jpeg";
import picture8 from "@/assets/Picture_8.jpeg";
import karmaFront from "@/assets/Girl_Model_1.PNG";
import karmaBack from "@/assets/Girl_Model_2.PNG";
import historyBack from "@/assets/Girl_Model_6.PNG";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — UNTKN" },
      {
        name: "description",
        content:
          "UNTKN lookbook — shot on location, styled in-house. Real campaign photography and everyday frames from the collection.",
      },
      { property: "og:title", content: "Lookbook — UNTKN" },
      {
        property: "og:description",
        content: "Shot on location. Styled in-house.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookbookPage,
});

type Look = {
  image: string;
  title: string;
  caption: string;
  product?: "misery-world" | "dragon-flame";
  wide?: boolean;
};

const looks: Look[] = [
  {
    image: picture3,
    title: "Ledge",
    caption: "MISERY WORLD THERMAL · WIDE-LEG",
    product: "misery-world",
  },
  {
    image: picture4,
    title: "Window Light",
    caption: "SLEEVE PRINT · FULL LENGTH",
    product: "misery-world",
  },
  {
    image: picture5,
    title: "Corridor",
    caption: "SHOT ON LOCATION, UNRETOUCHED",
    product: "misery-world",
    wide: true,
  },
  {
    image: picture6,
    title: "Stairwell",
    caption: "DRAGON FLAME THERMAL",
    product: "dragon-flame",
  },
  {
    image: picture7,
    title: "Mural",
    caption: "FOUR-COLOUR PRINT, FULL WRAP",
    product: "dragon-flame",
  },
  {
    image: picture8,
    title: "Overhead",
    caption: "CRAFTED WITH PRIDE",
    product: "misery-world",
  },
  {
    image: karmaFront,
    title: "Karma",
    caption: "KARMA FRONT — OVERSIZED FIT",
  },
  {
    image: historyBack,
    title: "History",
    caption: "HISTORY BACK — EMPRES RISE, EMPRES FALL",
  },
  {
    image: karmaBack,
    title: "Chakras",
    caption: "SEVEN CHAKRAS BACK PRINT",
  },
];

function LookbookPage() {
  return (
    <main className="lookbook-page">
      <section className="lookbook-intro shell">
        <p className="label-xs text-muted-foreground">Lookbook</p>
        <h1>Shot on location, styled in-house</h1>
        <p>
          Every frame is photographed on the people who wear it — no studio lighting, no retouched
          bodies. Tap a frame to shop the piece.
        </p>
      </section>

      <section className="lookbook-gallery shell" aria-label="UNTKN lookbook">
        {looks.map((look, index) => (
          <Reveal
            key={`${look.title}-${index}`}
            className={look.wide ? "lookbook-card lookbook-card--wide" : "lookbook-card"}
          >
            <figure>
              <LookLink product={look.product} title={look.title}>
                <RevealImage
                  src={look.image}
                  alt={`${look.title} — UNTKN lookbook`}
                  className="lookbook-card__image"
                  delay={Math.min(index * 0.035, 0.2)}
                />
              </LookLink>
              <figcaption>
                <div>
                  <p className="lookbook-card__title">{look.title}</p>
                  <p className="lookbook-card__caption">{look.caption}</p>
                </div>
                {look.product ? (
                  <Link
                    to="/products/$slug"
                    params={{ slug: look.product }}
                    className="lookbook-card__shop"
                  >
                    Shop the piece
                  </Link>
                ) : (
                  <span className="lookbook-card__shop">Shop the piece</span>
                )}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </section>
    </main>
  );
}

function LookLink({
  product,
  title,
  children,
}: {
  product?: Look["product"];
  title: string;
  children: React.ReactNode;
}) {
  if (!product) return <div aria-label={title}>{children}</div>;
  return (
    <Link to="/products/$slug" params={{ slug: product }} aria-label={`Shop ${title}`}>
      {children}
    </Link>
  );
}
