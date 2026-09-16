import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Reveal } from "@/components/ui/Reveal";
import { categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — UNTKN" },
      {
        name: "description",
        content:
          "Browse UNTKN by collection. Short-run capsules of heavyweight thermals, graphic knits and everyday layers.",
      },
      { property: "og:title", content: "Collections — UNTKN" },
      {
        property: "og:description",
        content: "Short-run capsules of heavyweight thermals, graphic knits and everyday layers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery()),
  errorComponent: () => (
    <div className="shell py-40 text-center">
      <h1 className="display-md">Collections are unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-3xl">
        <p className="label-xs text-muted-foreground">Collections</p>
        <h1 className="display-lg mt-6">Capsules, not seasons</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Each collection is cut in a short run, sold once and never reprinted.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="shell mt-24 pb-40 text-sm text-muted-foreground">
          No collections are live yet.
        </p>
      ) : (
        <div className="shell mt-20 grid grid-cols-1 gap-x-6 gap-y-16 pb-40 md:grid-cols-2">
          {categories.map((category, i) => (
            <Reveal key={category.id} delay={i * 0.06}>
              <Link
                to="/collections/$slug"
                params={{ slug: category.slug }}
                className="group block"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {true && (
                    <img
                      src={category.image_url || "/assets/Girl_Model_1(3).PNG"}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = "true";
                          img.src = "/assets/Girl_Model_1(3).PNG";
                        }
                      }}
                      alt={category.name}
                      loading="lazy"
                      className="photo transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="mt-6 flex items-baseline justify-between gap-6">
                  <h2 className="display-sm">{category.name}</h2>
                  <span className="label-xs link-rule shrink-0">View</span>
                </div>
                {category.description && (
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
