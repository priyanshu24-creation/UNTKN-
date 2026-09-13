import { Link, createFileRoute } from "@tanstack/react-router";

import { Reveal, RevealImage } from "@/components/ui/Reveal";
import GirlModel1 from "@/assets/Girl_Model_1.PNG";
import GirlModel2 from "@/assets/Girl_Model_2.PNG";
import GirlModel3 from "@/assets/Girl_Model_3.PNG";
import GirlModel4 from "@/assets/Girl_Model_4.PNG";
import GirlModel5 from "@/assets/Girl_Model_5.PNG";
import GirlModel6 from "@/assets/Girl_Model_6.PNG";
import GirlModel7 from "@/assets/Girl_Model_7.PNG";
import GirlModel8 from "@/assets/Girl_Model_8.PNG";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — UNTKN" },
      {
        name: "description",
        content:
          "The UNTKN lookbook — real campaign photography featuring the collection.",
      },
      { property: "og:title", content: "Lookbook — UNTKN" },
      {
        property: "og:description",
        content: "Real campaign photography from UNTKN.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookbookPage,
});

const LOOKBOOK_IMAGES = [
  { src: GirlModel1, title: "KARMA", caption: "Front look" },
  { src: GirlModel2, title: "KARMA", caption: "Back look" },
  { src: GirlModel3, title: "HISTORY", caption: "Front / back" },
  { src: GirlModel4, title: "HISTORY", caption: "Front / back" },
  { src: GirlModel5, title: "KARMA", caption: "Editorial look" },
  { src: GirlModel6, title: "KARMA", caption: "Editorial look" },
  { src: GirlModel7, title: "HISTORY", caption: "Editorial look" },
  { src: GirlModel8, title: "HISTORY", caption: "Editorial look" },
];

function LookbookPage() {
  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-3xl">
        <p className="label-xs text-muted-foreground">Lookbook</p>
        <h1 className="display-lg mt-6">Real pieces. Real people.</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Explore the UNTKN collection through real campaign photography. Every image
          below comes from the brand&apos;s own product shoot — no stock or placeholder
          fashion images.
        </p>
      </header>

      <div className="shell mt-20 grid grid-cols-1 gap-4 pb-40 md:grid-cols-2 md:gap-6">
        {LOOKBOOK_IMAGES.map((item, i) => {
          const wide = i === 0 || i === 3;

          return (
            <Reveal
              key={`${item.title}-${i}`}
              className={cn(wide && "md:col-span-2")}
            >
              <Link
                to="/shop"
                className="group block"
                aria-label={`Shop ${item.title}`}
              >
                <figure>
                  <RevealImage
                    src={item.src}
                    alt={`${item.title} — ${item.caption}`}
                    className={cn(
                      "w-full object-cover object-center",
                      wide ? "aspect-[16/10]" : "aspect-[4/5]",
                    )}
                    delay={i * 0.04}
                  />
                  <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                    <div>
                      <p className="font-sans text-sm">{item.title}</p>
                      <p className="mt-1.5 label-xs text-muted-foreground">
                        {item.caption}
                      </p>
                    </div>
                    <span className="label-xs link-rule shrink-0">Shop the collection</span>
                  </figcaption>
                </figure>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
