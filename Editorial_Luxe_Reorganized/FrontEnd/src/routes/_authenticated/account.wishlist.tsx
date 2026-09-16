import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { useWishlist } from "@/components/providers/WishlistProvider";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { getProductsByIds } from "@backend/lib/catalog.functions";

export const Route = createFileRoute("/_authenticated/account/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const wishlist = useWishlist();
  const ids = wishlist.productIds;

  const products = useQuery({
    queryKey: ["wishlist-products", ids],
    queryFn: () => getProductsByIds({ data: { ids } }),
    enabled: ids.length > 0,
  });

  return (
    <div>
      <h2 className="display-sm hairline-b pb-4">Wishlist</h2>

      {ids.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nothing saved yet. Tap the heart on any piece to keep it here.{" "}
          <Link to="/shop" search={{}} className="link-rule">
            Browse the shop
          </Link>
          .
        </p>
      ) : products.isLoading ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
          {[0, 1, 2].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.isError ? (
        <p className="mt-8 text-sm text-signal">We couldn&apos;t load your saved pieces.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
          {(products.data ?? []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
