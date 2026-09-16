import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { ProductCard } from "@/components/shop/ProductCard";
import { ActionButton } from "@/components/ui/EditorialButton";
import { Reveal } from "@/components/ui/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { productQuery, productsByIdsQuery, relatedProductsQuery } from "@/lib/queries";
import type { ProductDetail, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECENT_KEY = "untkn.recent.v1";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (product) {
      await context.queryClient.ensureQueryData(
        relatedProductsQuery(params.slug, product.category?.slug ?? null),
      );
    }
    return { product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    const title = product ? `${product.seo_title ?? product.name} — UNTKN` : "Product — UNTKN";
    const description =
      product?.seo_description ??
      product?.short_description ??
      siteConfig.seo.defaultDescription;
    const image = product?.images[0]?.image_url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
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
      <h1 className="display-md">Something went wrong</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        We couldn&apos;t load this product. Please try again.
      </p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));

  if (!product) {
    return (
      <div className="shell py-40 text-center">
        <p className="label-xs text-muted-foreground">404</p>
        <h1 className="display-md mt-4">This piece is no longer available</h1>
        <Link to="/shop" search={{}} className="mt-8 inline-block label-xs link-rule">
          Back to Shop
        </Link>
      </div>
    );
  }

  return <ProductView product={product} />;
}

function ProductView({ product }: { product: ProductDetail }) {
  const cart = useCart();
  const ui = useUI();
  const wishlist = useWishlist();

  const sizes = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sort_order: number }>();
    for (const v of product.variants) if (v.size) map.set(v.size.id, v.size);
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [product.variants]);

  const colors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; hex_code: string | null }>();
    for (const v of product.variants) if (v.color) map.set(v.color.id, v.color);
    return [...map.values()];
  }, [product.variants]);

  const [colorId, setColorId] = useState<string | null>(colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setColorId(colors[0]?.id ?? null);
    setSizeId(null);
    setQuantity(1);
    setActiveImage(0);
  }, [product.id, colors]);

  // recently viewed
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [product.id, ...list.filter((id) => id !== product.id)].slice(0, 8);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, [product.id]);

  const matches = (v: ProductVariant) =>
    (colorId === null || v.color?.id === colorId) && (sizeId === null || v.size?.id === sizeId);

  const selected = sizeId ? (product.variants.find(matches) ?? null) : null;
  const stockFor = (id: string, axis: "size" | "color") =>
    product.variants
      .filter((v) =>
        axis === "size"
          ? v.size?.id === id && (colorId === null || v.color?.id === colorId)
          : v.color?.id === id,
      )
      .reduce((sum, v) => sum + v.stock_quantity, 0);

  const onSale = product.sale_price !== null && product.sale_price < product.base_price;
  const price = selected?.price ?? product.sale_price ?? product.base_price;
  const lowStock = selected !== null && selected.stock_quantity > 0 && selected.stock_quantity <= 3;
  const soldOut = selected !== null && selected.stock_quantity === 0;

  const images = product.images.length ? product.images : [];
  const current = images[activeImage];

  const addToCart = () => {
    if (!selected || soldOut) return;
    cart.addItem(selected.id, quantity);
    ui.open("cart");
  };

  const saved = wishlist.has(product.id);

  return (
    <div className="pt-24 md:pt-32">
      <nav aria-label="Breadcrumb" className="shell pb-8">
        <ol className="flex items-center gap-2 label-xs text-muted-foreground">
          <li>
            <Link to="/shop" search={{}} className="link-rule">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="shell grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* gallery */}
        <div>
          <div
            className={cn(
              "relative aspect-[4/5] overflow-hidden bg-muted",
              zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
            onClick={() => setZoomed((z) => !z)}
          >
            {current && (
              <img
                src={current.image_url}
                alt={current.alt_text ?? product.name}
                className={cn(
                  "photo transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  zoomed && "scale-[1.6]",
                )}
              />
            )}
          </div>

          {/* mobile swipe strip */}
          {images.length > 1 && (
            <div className="mt-3 flex snap-x gap-3 overflow-x-auto lg:hidden">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "size-20 shrink-0 snap-start overflow-hidden bg-muted",
                    i === activeImage && "ring-1 ring-foreground",
                  )}
                >
                  <img src={img.image_url} alt="" className="photo" />
                </button>
              ))}
            </div>
          )}

          {images.length > 1 && (
            <div className="mt-4 hidden grid-cols-5 gap-3 lg:grid">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === activeImage}
                  className={cn(
                    "aspect-square overflow-hidden bg-muted transition-opacity",
                    i === activeImage ? "ring-1 ring-foreground" : "opacity-60 hover:opacity-100",
                  )}
                >
                  <img src={img.image_url} alt="" className="photo" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.category && (
            <Link
              to="/shop"
              search={{ category: product.category.slug }}
              className="label-xs text-muted-foreground link-rule"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="display-md mt-4">{product.name}</h1>

          <p className="mt-5 font-sans text-base tabular-nums">
            {onSale ? (
              <>
                <span className="text-signal">{formatPrice(price)}</span>
                <span className="ml-3 text-muted-foreground line-through">
                  {formatPrice(product.base_price)}
                </span>
              </>
            ) : (
              formatPrice(price)
            )}
          </p>

          {product.short_description && (
            <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {product.short_description}
            </p>
          )}

          {colors.length > 1 && (
            <fieldset className="mt-10">
              <legend className="label-xs text-muted-foreground">Colour</legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {colors.map((color) => {
                  const disabled = stockFor(color.id, "color") === 0;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setColorId(color.id);
                        setSizeId(null);
                      }}
                      aria-pressed={colorId === color.id}
                      className={cn(
                        "h-10 px-4 border label-xs transition-colors",
                        colorId === color.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground",
                        disabled && "opacity-40 line-through",
                      )}
                    >
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset className="mt-8">
              <legend className="label-xs text-muted-foreground">Size</legend>
              <div className="mt-4 flex flex-wrap gap-3">
                {sizes.map((size) => {
                  const disabled = stockFor(size.id, "size") === 0;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSizeId(size.id)}
                      aria-pressed={sizeId === size.id}
                      className={cn(
                        "size-12 border label-xs transition-colors",
                        sizeId === size.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground",
                        disabled && "opacity-40 line-through",
                      )}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex items-center gap-6">
            <div className="flex items-center border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="grid size-11 place-items-center hover:opacity-60"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-sans text-sm tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(selected?.stock_quantity ?? 10, q + 1))
                }
                aria-label="Increase quantity"
                className="grid size-11 place-items-center hover:opacity-60"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {selected && (
              <p className="label-xs text-muted-foreground">
                {soldOut
                  ? "Sold out"
                  : lowStock
                    ? `Only ${selected.stock_quantity} left`
                    : "In stock"}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <ActionButton
              variant="solid"
              size="lg"
              full
              disabled={!selected || soldOut}
              onClick={addToCart}
            >
              {!selected ? "Select a size" : soldOut ? "Sold out" : "Add to cart"}
            </ActionButton>
            <div className="flex gap-3">
              <ActionButton
                variant="outline"
                size="lg"
                full
                disabled={!selected || soldOut}
                onClick={() => {
                  if (!selected) return;
                  cart.addItem(selected.id, quantity);
                  window.location.assign("/checkout");
                }}
              >
                Buy now
              </ActionButton>
              <ActionButton
                variant="outline"
                size="lg"
                aria-pressed={saved}
                onClick={() => wishlist.toggle(product.id)}
                className="px-6"
              >
                <Heart className={cn("size-4", saved && "fill-signal text-signal")} />
                <span className="sr-only">{saved ? "Saved" : "Save"}</span>
              </ActionButton>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-14">
            {product.description && (
              <AccordionItem value="details">
                <AccordionTrigger className="label-xs">Product Details</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
            )}
            {product.materials && (
              <AccordionItem value="materials">
                <AccordionTrigger className="label-xs">Materials & Care</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.materials}
                  {product.care_instructions ? `\n\n${product.care_instructions}` : ""}
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="size-guide">
              <AccordionTrigger className="label-xs">Size Guide</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                Relaxed, boxy fit. If you sit between two sizes, take the smaller one for a
                cropped look or the larger one for an oversized drape.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="label-xs">Shipping & Returns</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {siteConfig.shipping.note} Estimated delivery{" "}
                {siteConfig.shipping.estimatedDelivery}. Returns accepted within{" "}
                {siteConfig.shipping.returnsWindowDays} days of delivery.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <RelatedProducts slug={product.slug} categorySlug={product.category?.slug ?? null} />
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}

function RelatedProducts({
  slug,
  categorySlug,
}: {
  slug: string;
  categorySlug: string | null;
}) {
  const { data } = useSuspenseQuery(relatedProductsQuery(slug, categorySlug));
  if (!data.length) return null;

  return (
    <section className="shell mt-32" aria-labelledby="related">
      <h2 id="related" className="display-sm hairline-b pb-6">
        You may also like
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {data.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.06}>
            <ProductCard product={item} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function RecentlyViewed({ excludeId }: { excludeId: string }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      setIds(list.filter((id) => id !== excludeId).slice(0, 4));
    } catch {
      setIds([]);
    }
  }, [excludeId]);

  const { data } = useSuspenseQuery(productsByIdsQuery(ids));
  if (!data.length) return null;

  return (
    <section className="shell mt-32 pb-32" aria-labelledby="recent">
      <h2 id="recent" className="display-sm hairline-b pb-6">
        Recently viewed
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {data.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
