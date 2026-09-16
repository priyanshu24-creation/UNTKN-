import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { useWishlist } from "@/components/providers/WishlistProvider";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductSummary;
  priority?: boolean;
  className?: string;
}) {
  const wishlist = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const name = product.name.toLowerCase();

  const isKarmaHistory =
    name.includes("karma") && name.includes("history");

  const isBalanceKarma =
    name.includes("balance") && name.includes("karma");

  let frontImage = product.images[0]?.image_url;
  let backImage = product.images[1]?.image_url;

  /*
   * KARMA × HISTORY
   * Front = Girl_Model_2.PNG
   * Hover = Girl_Model_3.PNG
   */
  if (isKarmaHistory) {
    frontImage = "/assets/Girl_Model_2.PNG";
    backImage = "/assets/Girl_Model_3.PNG";
  }

  /*
   * BALANCE × KARMA
   * Front = Girl_Model_1.PNG
   * Hover = Girl_Model_2.PNG
   */
  if (isBalanceKarma) {
    frontImage = "/assets/Girl_Model_1.PNG";
    backImage = "/assets/Girl_Model_2.PNG";
  }

  const onSale =
    product.sale_price !== null &&
    product.sale_price < product.base_price;

  const saved = wishlist.has(product.id);

  return (
    <article className={cn("group relative", className)}>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block"
        aria-label={product.name}
      >
        <div
          className="relative aspect-[4/5] overflow-hidden bg-muted"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {frontImage && (
            <img
              src={isHovered && backImage ? backImage : frontImage}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="photo transition-opacity duration-500"
            />
          )}

          <div className="absolute left-0 top-0 flex flex-col items-start gap-px">
            {onSale && (
              <span className="bg-signal px-2 py-1 label-xs text-signal-foreground">
                Sale
              </span>
            )}

            {!product.in_stock && (
              <span className="bg-ink px-2 py-1 label-xs text-paper">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wishlist.toggle(product.id)}
        aria-label={
          saved
            ? `Remove ${product.name} from wishlist`
            : `Save ${product.name}`
        }
        aria-pressed={saved}
        className="absolute right-2 top-2 grid size-9 place-items-center text-ink/70 transition-opacity hover:opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
      >
        <Heart
          className={cn(
            "size-[18px]",
            saved && "fill-signal text-signal"
          )}
        />
      </button>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm">
            <Link
              to="/products/$slug"
              params={{ slug: product.slug }}
              className="link-rule"
            >
              {product.name}
            </Link>
          </h3>

          {product.category && (
            <p className="mt-1.5 label-xs text-muted-foreground">
              {product.category.name}
            </p>
          )}
        </div>

        <p className="shrink-0 text-right font-sans text-sm tabular-nums">
          {onSale ? (
            <>
              <span className="text-signal">
                {formatPrice(product.sale_price)}
              </span>
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
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted animate-pulse" />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-3/4 bg-muted animate-pulse" />
          <div className="mt-2 h-3 w-1/3 bg-muted animate-pulse" />
        </div>

        <div className="h-4 w-12 bg-muted animate-pulse" />
      </div>
    </article>
  );
}
