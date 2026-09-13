import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Reveal } from "@/components/ui/Reveal";
import { categoriesQuery } from "@/lib/queries";

import dragonFlame from "@/assets/Picture_1.jpeg";
import miseryWorld from "@/assets/Picture_2.jpeg";
import karma from "@/assets/Girl_Model_1.PNG";
import history from "@/assets/Girl_Model_6.PNG";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — UNTKN" },
      {
        name: "description",
        content:
          "Explore UNTKN collections — limited-run pieces designed with an editorial streetwear point of view.",
      },
      { property: "og:title", content: "Collections — UNTKN" },
      {
        property: "og:description",
        content: "Explore UNTKN collections — limited-run pieces designed with an editorial streetwear point of view.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery()),
  errorComponent: () => (
    <div className="shell py-40 text-center">
      <p className="label-xs text-muted-foreground">UNTKN COLLECTIONS</p>
      <h1 className="display-md mt-4">Collections are unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
  component: CollectionsPage,
});

const fallbackImages: Record<string, string> = {
  thermals: miseryWorld,
  "graphic-tees": karma,
  "graphic tees": karma,
  karma,
  history,
  dragon: dragonFlame,
  "dragon-flame": dragonFlame,
};

function getFallbackImage(slug: string, name: string) {
  const key = slug.toLowerCase();
  if (fallbackImages[key]) return fallbackImages[key];
  const normalized = name.toLowerCase();
  if (normalized.includes("thermal")) return miseryWorld;
  if (normalized.includes("dragon")) return dragonFlame;
  if (normalized.includes("history")) return history;
  if (normalized.includes("karma") || normalized.includes("graphic")) return karma;
  return miseryWorld;
}

function CollectionsPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  return (
    <main className="bg-[#f7f6f2] text-[#111]">
      <section className="shell pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-5xl">
          <p className="label-xs tracking-[0.22em] text-black/50">UNTKN / COLLECTIONS</p>
          <h1 className="mt-5 text-[clamp(3.2rem,8vw,8rem)] font-medium leading-[0.88] tracking-[-0.055em]">
            Collections
          </h1>
          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-base leading-relaxed text-black/60 md:text-lg">
              Short-run capsules. Strong graphics. No unnecessary seasons. Explore the pieces that define the UNTKN world.
            </p>
            <span className="label-xs text-black/40">{categories.length} COLLECTION{categories.length === 1 ? "" : "S"}</span>
          </div>
        </div>
      </section>

      {categories.length === 0 ? (
        <section className="shell pb-40">
          <div className="border-t border-black/15 py-10">
            <p className="text-sm text-black/55">No collections are live yet.</p>
          </div>
        </section>
      ) : (
        <section className="shell pb-32 md:pb-40">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-6 md:gap-y-20">
            {categories.map((category, i) => {
              const image = category.image_url || getFallbackImage(category.slug, category.name);
              return (
                <Reveal key={category.id} delay={i * 0.06}>
                  <Link
                    to="/collections/$slug"
                    params={{ slug: category.slug }}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e7e1]">
                      <img
                        src={image}
                        alt={category.name}
                        loading={i < 2 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/65 via-black/15 to-transparent p-6 pt-24 text-white md:p-8 md:pt-28">
                        <div>
                          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/70">Collection</p>
                          <h2 className="text-3xl font-medium tracking-[-0.03em] md:text-4xl">{category.name}</h2>
                        </div>
                        <span className="border border-white/70 px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors group-hover:bg-white group-hover:text-black">
                          Explore
                        </span>
                      </div>
                    </div>
                    {category.description && (
                      <div className="mt-5 flex items-start justify-between gap-6">
                        <p className="max-w-lg text-sm leading-relaxed text-black/55">{category.description}</p>
                        <span className="hidden text-[10px] uppercase tracking-[0.16em] text-black/35 md:block">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                    )}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
