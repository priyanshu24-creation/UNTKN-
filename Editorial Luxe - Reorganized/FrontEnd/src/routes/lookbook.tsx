import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Reveal, RevealImage } from "@/components/ui/Reveal";
import { lookbookQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook — UNTKN" },
      {
        name: "description",
        content:
          "The UNTKN lookbook: campaign photography shot on the streets of Kolkata, styled with heavyweight thermals and hand-drawn graphics.",
      },
      { property: "og:title", content: "Lookbook — UNTKN" },
      {
        property: "og:description",
        content: "Campaign photography from the UNTKN studio. Shot on location, styled in-house.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(lookbookQuery()),
  errorComponent: () => (
    <div className="shell py-40 text-center">
      <h1 className="display-md">The lookbook is unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
  component: LookbookPage,
});

function LookbookPage() {
  const { data: items } = useSuspenseQuery(lookbookQuery());

  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-3xl">
        <p className="label-xs text-muted-foreground">Lookbook</p>
        <h1 className="display-lg mt-6">Shot on location, styled in-house</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Every frame is photographed on the people who wear it — no studio lighting, no retouched
          bodies. Tap a frame to shop the piece.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="shell mt-24 pb-40 text-sm text-muted-foreground">
          The next lookbook is being shot. Check back shortly.
        </p>
      ) : (
        <div className="shell mt-20 grid grid-cols-1 gap-4 pb-40 md:grid-cols-2 md:gap-6">
          {items.map((item, i) => {
            const wide = item.span === "wide" || item.span === "full";
            const content = (
              <figure className="group relative">
                <RevealImage
                  src={`/assets/Girl_Model_${(items.indexOf(item) % 8) + 1}.PNG`}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallback) {
                      img.dataset.fallback = "true";
                      img.src = "/assets/Girl_Model_2.PNG";
                    }
                  }}
                  alt={item.title ?? item.caption ?? "UNTKN lookbook"}
                  className={cn(wide ? "aspect-[16/10]" : "aspect-[4/5]")}
                  delay={i * 0.05}
                />
                {(item.title || item.caption || item.product) && (
                  <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                    <div>
                      {item.title && <p className="font-sans text-sm">{item.title}</p>}
                      {item.caption && (
                        <p className="mt-1.5 label-xs text-muted-foreground">{item.caption}</p>
                      )}
                    </div>
                    {item.product && (
                      <span className="label-xs link-rule shrink-0">Shop the piece</span>
                    )}
                  </figcaption>
                )}
              </figure>
            );

            return (
              <Reveal key={item.id} className={cn(wide && "md:col-span-2")}>
                {item.product ? (
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.product.slug }}
                    aria-label={`Shop ${item.product.name}`}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
