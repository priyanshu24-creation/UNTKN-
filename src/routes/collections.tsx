import { Link, createFileRoute } from "@tanstack/react-router";

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
        content: "Explore UNTKN collections — limited-run pieces designed with an editorial streetwear point of view.",
      },
      { property: "og:title", content: "Collections — UNTKN" },
      {
        property: "og:description",
        content: "Explore UNTKN collections — limited-run pieces designed with an editorial streetwear point of view.",
      },
    ],
  }),
  component: CollectionsPage,
});

const collections = [
  {
    slug: "thermals",
    name: "Thermals",
    eyebrow: "01 / CAPSULE",
    description: "Heavyweight waffle thermals built around MISERY WORLD and DRAGON FLAME graphics.",
    image: miseryWorld,
    secondaryImage: dragonFlame,
  },
  {
    slug: "graphic-tees",
    name: "Graphic Tees",
    eyebrow: "02 / CAPSULE",
    description: "Oversized graphic pieces featuring KARMA and HISTORY — made for everyday rotation.",
    image: karma,
    secondaryImage: history,
  },
];

function CollectionsPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#111]">
      <section className="mx-auto max-w-[1440px] px-5 pb-14 pt-28 md:px-8 md:pb-20 md:pt-36">
        <div className="max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">UNTKN / COLLECTIONS</p>
          <h1 className="mt-5 text-[clamp(3.5rem,9vw,8.5rem)] font-medium leading-[0.86] tracking-[-0.065em]">
            Collections
          </h1>
          <p className="mt-8 max-w-2xl text-sm leading-7 text-black/60 md:text-base">
            Short-run capsules. Strong graphics. No unnecessary seasons. Explore the collections that define UNTKN.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-8 md:pb-36">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-6">
          {collections.map((collection, index) => (
            <Link
              key={collection.slug}
              to="/collections/$slug"
              params={{ slug: collection.slug }}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#e9e7e1]">
                <img
                  src={collection.image}
                  alt={`${collection.name} collection`}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.025] group-hover:opacity-0"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <img
                  src={collection.secondaryImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-[1.025] group-hover:opacity-100"
                  loading="lazy"
                />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/15 to-transparent p-6 pt-32 text-white md:p-8 md:pt-40">
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/65">{collection.eyebrow}</p>
                    <h2 className="text-4xl font-medium tracking-[-0.045em] md:text-5xl">{collection.name}</h2>
                  </div>
                  <span className="border border-white/70 px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors group-hover:bg-white group-hover:text-black">
                    Explore
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-start justify-between gap-8 border-t border-black/10 pt-4">
                <p className="max-w-xl text-sm leading-6 text-black/55">{collection.description}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-black/35">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
