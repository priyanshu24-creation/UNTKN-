import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import MiseryFront from "@/assets/Picture_2.jpeg";
import MiseryModel from "@/assets/Picture_4.jpeg";
import DragonFront from "@/assets/Picture_1.jpeg";
import DragonModel from "@/assets/Picture_7.jpeg";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  className,
  collectionHover = false,
}: {
  product: ProductSummary;
  priority?: boolean;
  className?: string;
  /** Enables the collection-page editorial hover treatment. */
  collectionHover?: boolean;
}) {
  const wishlist = useWishlist();

  const isMisery = product.slug === "misery-world";
  const isDragon = product.slug === "dragon-flame";

  // Keep the existing MISERY WORLD hover everywhere.
  // DRAGON FLAME gets hover ONLY when this card is rendered by Collections.
  const hoverPair = isMisery || (isDragon && collectionHover);
  const primary = isMisery
    ? MiseryFront
    : isDragon
      ? DragonFront
      : product.images[0]?.image_url;
  const secondary = isMisery
    ? MiseryModel
    : isDragon
      ? DragonModel
      : product.images[1]?.image_url;

  const onSale = product.sale_price !== null && product.sale_price < product.base_price;
  const saved = wishlist.has(product.id);

  return (
    <article className={cn("product-card group relative", className)}>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block"
        aria-label={product.name}
      >
        <div className="product-media relative aspect-[4/5] overflow-hidden bg-muted">
          {primary && (
            <img
              src={primary}
              alt={product.name}
              loading={priority || hoverPair ? "eager" : "lazy"}
              decoding="async"
              className={cn(
                "photo transition-opacity duration-300 ease-out",
                hoverPair && secondary ? "group-hover:opacity-0" : "group-hover:scale-[1.02]",
              )}
            />
          )}

          {secondary && hoverPair && (
            <img
              src={secondary}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="photo absolute inset-0 scale-100 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            />
          )}

          {!hoverPair && secondary && (
            <img
              src={secondary}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="photo absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-muted" />
      <div className="mt-4 h-3 w-2/3 bg-muted" />
      <div className="mt-2 h-3 w-1/3 bg-muted" />
    </div>
  );
}
