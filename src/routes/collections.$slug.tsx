import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";

import { useWishlist } from "@/components/providers/WishlistProvider";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { categoryQuery, productsQuery } from "@/lib/queries";
import type { ProductSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const [category] = await Promise.all([
      context.queryClient.ensureQueryData(categoryQuery(params.slug)),
      context.queryClient.ensureQueryData(productsQuery({ category: params.slug })),
    ]);
    return { category };
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category;
    const title = category ? `${category.name} — UNTKN` : "Collection — UNTKN";
    const description = category?.description ?? siteConfig.seo.defaultDescription;
    const image = category?.image_url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <div className="shell py-40 text-center">
      <h1 className="display-md">This collection is unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data: category } = useSuspenseQuery(categoryQuery(slug));
  const { data: products } = useSuspenseQuery(productsQuery({ category: slug }));

  if (!category) {
    return (
      <div className="shell py-40 text-center">
        <p className="label-xs text-muted-foreground">404</p>
        <h1 className="display-md mt-4">No such collection</h1>
        <Link to="/collections" className="mt-8 inline-block label-xs link-rule">
          All Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-3xl">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 label-xs text-muted-foreground">
            <li>
              <Link to="/collections" className="link-rule">
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">{category.name}</li>
          </ol>
        </nav>
        <h1 className="display-lg mt-6">{category.name}</h1>
        {category.description && (
          <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      {products.length === 0 ? (
        <div className="shell mt-24 pb-40">
          <p className="text-sm text-muted-foreground">
            This collection is sold out. See what else is live in the{" "}
            <Link to="/shop" search={{}} className="link-rule">
              shop
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="shell mt-20 grid grid-cols-2 gap-x-4 gap-y-12 pb-40 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.05}>
              <CollectionProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Collection-only product card.
 *
 * The hover image is preloaded and switched with React state instead of relying
 * on CSS group-hover + lazy loading. This prevents the second image from
 * appearing only after a click/navigation.
 */
function CollectionProductCard({ product }: { product: ProductSummary }) {
  const wishlist = useWishlist();
  const [hovered, setHovered] = useState(false);
  const primary = product.images[0];
  const secondary = product.images[1];
  const onSale = product.sale_price !== null && product.sale_price < product.base_price;
  const saved = wishlist.has(product.id);

  useEffect(() => {
    if (!secondary?.image_url) return;
    const image = new Image();
    image.decoding = "async";
    image.src = secondary.image_url;
  }, [secondary?.image_url]);

  return (
    <article
      className="product-card group relative"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHovered(false);
        }
      }}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block"
        aria-label={product.name}
      >
        <div className="product-media relative aspect-[4/5] overflow-hidden bg-muted">
          {primary && (
            <img
              src={primary.image_url}
              alt={primary.alt_text ?? product.name}
              loading="eager"
              decoding="async"
              className={cn(
                "photo transition-[opacity,transform] duration-500 ease-out",
                secondary && hovered ? "opacity-0" : "opacity-100",
              )}
            />
          )}

          {secondary && (
            <img
              src={secondary.image_url}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              className={cn(
                "photo absolute inset-0 transition-[opacity,transform] duration-500 ease-out",
                hovered ? "opacity-100 scale-100" : "opacity-0 scale-[1.015]",
              )}
            />
          )}

          <div className="absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <span className="flex h-10 items-center justify-center bg-paper/95 px-4 label-xs text-ink backdrop-blur-sm">
              View Product
            </span>
          </div>

          <div className="absolute left-0 top-0 flex flex-col items-start gap-px">
            {onSale && <span className="bg-signal px-2 py-1 label-xs text-signal-foreground">Sale</span>}
            {!product.in_stock && <span className="bg-ink px-2 py-1 label-xs text-paper">Sold Out</span>}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wishlist.toggle(product.id)}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
        aria-pressed={saved}
        className="absolute right-2 top-2 grid size-9 place-items-center text-ink/75 transition-opacity hover:opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      >
        <Heart className={cn("size-[18px]", saved && "fill-signal text-signal")} strokeWidth={1.5} />
      </button>

      <div className="mt-3 flex items-start justify-between gap-3 md:mt-4">
        <div className="min-w-0">
          <h3 className="font-sans text-[0.78rem] md:text-sm">
            <Link to="/products/$slug" params={{ slug: product.slug }} className="link-rule">
              {product.name}
            </Link>
          </h3>
          {product.category && (
            <p className="mt-1.5 label-xs text-muted-foreground">{product.category.name}</p>
          )}
        </div>

        <p className="shrink-0 text-right font-sans text-[0.78rem] tabular-nums md:text-sm">
          {onSale ? (
            <>
              <span className="text-signal">{formatPrice(product.sale_price)}</span>
              <span className="ml-1.5 text-muted-foreground line-through">{formatPrice(product.base_price)}</span>
            </>
          ) : (
            formatPrice(product.base_price)
          )}
        </p>
      </div>
    </article>
  );
}
