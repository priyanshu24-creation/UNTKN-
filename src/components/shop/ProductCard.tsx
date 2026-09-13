import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";

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
  /** Enable immediate hover swap for collection cards only. */
  collectionHover?: boolean;
}) {
  const wishlist = useWishlist();
  const [clickedSecondary, setClickedSecondary] = useState(false);

  // Use the real campaign/product photographs supplied for UNTKN.
  // MISERY WORLD: hover the front image to reveal the model shot.
  // DRAGON FLAME: click the front image to reveal the model shot.
  const localPair =
    product.slug === "misery-world"
      ? { primary: MiseryFront, secondary: MiseryModel, mode: "hover" as const }
      : product.slug === "dragon-flame"
        ? { primary: DragonFront, secondary: DragonModel, mode: collectionHover ? ("hover" as const) : ("click" as const) }
        : null;

  const primary = localPair?.primary ?? product.images[0]?.image_url;
  const secondary = localPair?.secondary ?? product.images[1]?.image_url;
  const showSecondary = localPair ? clickedSecondary : false;
  const onSale = product.sale_price !== null && product.sale_price < product.base_price;
  const saved = wishlist.has(product.id);

  return (
    <article className={cn("group relative", className)}>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block"
        aria-label={product.name}
        onClick={(event) => {
          if (localPair?.mode === "click") {
            event.preventDefault();
            setClickedSecondary((value) => !value);
          }
        }}
      >
        <div
          className="relative aspect-[4/5] overflow-hidden bg-muted"
          onMouseEnter={() => {
            if (localPair?.mode === "hover") setClickedSecondary(true);
          }}
          onMouseLeave={() => {
            if (localPair?.mode === "hover") setClickedSecondary(false);
          }}
        >
          {primary && (
            <img
              src={primary}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={cn(
                "photo transition-[opacity,transform] duration-[500ms] ease-out",
                secondary && showSecondary ? "opacity-0" : "group-hover:scale-[1.02]",
              )}
            />
          )}
          {secondary && (
            <img
              src={secondary}
              alt=""
              aria-hidden="true"
              loading={collectionHover ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={collectionHover ? "high" : "auto"}
              className={cn(
                "photo absolute inset-0 transition-[opacity,transform] duration-[500ms] ease-out",
                localPair
                  ? showSecondary
                    ? "scale-100 opacity-100"
                    : "scale-[1.02] opacity-0"
                  : "scale-100 opacity-0 group-hover:scale-100 group-hover:opacity-100",
              )}
            />
          )}

          <div className="absolute left-0 top-0 flex flex-col items-start gap-px">
            {onSale && (
              <span className="bg-signal px-2 py-1 label-xs text-signal-foreground">Sale</span>
            )}
            {!product.in_stock && (
              <span className="bg-ink px-2 py-1 label-xs text-paper">Sold Out</span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wishlist.toggle(product.id)}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
        aria-pressed={saved}
        className="absolute right-2 top-2 grid size-9 place-items-center text-ink/70 transition-opacity hover:opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      >
        <Heart className={cn("size-[18px]", saved && "fill-signal text-signal")} />
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm">
            <Link to="/products/$slug" params={{ slug: product.slug }} className="link-rule">
              {product.name}
            </Link>
          </h3>
          {product.category && (
            <p className="mt-1.5 label-xs text-muted-foreground">{product.category.name}</p>
          )}
        </div>
        <p className="shrink-0 text-right font-sans text-sm tabular-nums">
          {onSale ? (
            <>
              <span className="text-signal">{formatPrice(product.sale_price)}</span>
              <span className="ml-2 text-muted-foreground line-through">
                {formatPrice(product.base_price)}
              </span>
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
