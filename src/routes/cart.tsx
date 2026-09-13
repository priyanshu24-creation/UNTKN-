import { Link, createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/providers/CartProvider";
import { ActionButton, ButtonLink } from "@/components/ui/EditorialButton";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — UNTKN" },
      {
        name: "description",
        content: "Review the pieces in your UNTKN bag, apply a code and continue to checkout.",
      },
      { property: "og:title", content: "Your Bag — UNTKN" },
      { property: "og:description", content: "Review the pieces in your UNTKN bag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const [code, setCode] = useState("");
  const totals = cart.totals;
  const lines = totals?.lines ?? [];

  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="hairline-b pb-8">
        <p className="label-xs text-muted-foreground">Bag</p>
        <h1 className="display-md mt-4">Your bag</h1>
      </header>

      {lines.length === 0 ? (
        <div className="mt-16 max-w-md">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your bag is empty. Everything is made in short runs — when a size is gone, it&apos;s
            gone.
          </p>
          <ButtonLink to="/shop" variant="solid" size="lg" className="mt-8">
            Shop the collection
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-12 grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-5 py-7">
                <Link
                  to="/products/$slug"
                  params={{ slug: line.productSlug }}
                  className="size-24 shrink-0 overflow-hidden bg-muted sm:size-28"
                >
                  {line.imageUrl && <img src={line.imageUrl} alt="" className="photo" />}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-sans text-sm">
                        <Link
                          to="/products/$slug"
                          params={{ slug: line.productSlug }}
                          className="link-rule"
                        >
                          {line.productName}
                        </Link>
                      </p>
                      <p className="mt-1.5 label-xs text-muted-foreground">
                        {[line.sizeName, line.colorName].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 label-xs text-muted-foreground">{line.sku}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.removeItem(line.variantId)}
                      aria-label={`Remove ${line.productName}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-6">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          cart.setQuantity(line.variantId, Math.max(1, line.quantity - 1))
                        }
                        aria-label="Decrease quantity"
                        className="grid size-10 place-items-center hover:opacity-60"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center font-sans text-sm tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          cart.setQuantity(
                            line.variantId,
                            Math.min(line.stockQuantity, line.quantity + 1),
                          )
                        }
                        disabled={line.quantity >= line.stockQuantity}
                        aria-label="Increase quantity"
                        className="grid size-10 place-items-center hover:opacity-60 disabled:opacity-30"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="font-sans text-sm tabular-nums">{formatPrice(line.lineTotal)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="label-xs text-muted-foreground">Summary</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                cart.applyCoupon(code || null);
              }}
              className="mt-6 flex gap-3"
            >
              <label htmlFor="coupon" className="sr-only">
                Discount code
              </label>
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Discount code"
                className="h-12 w-full border border-border bg-transparent px-4 font-sans text-sm uppercase outline-none focus-visible:border-foreground"
              />
              <ActionButton type="submit" variant="outline" size="md">
                Apply
              </ActionButton>
            </form>
            {totals?.couponError && (
              <p role="alert" className="mt-3 text-sm text-signal">
                {totals.couponError}
              </p>
            )}
            {totals?.couponCode && !totals.couponError && (
              <p className="mt-3 label-xs text-muted-foreground">
                {totals.couponCode} applied.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    cart.applyCoupon(null);
                  }}
                  className="link-rule"
                >
                  Remove
                </button>
              </p>
            )}

            <dl className="mt-8 space-y-3 border-t border-border pt-6 font-sans text-sm">
              <Row label="Subtotal" value={formatPrice(totals?.subtotal ?? 0)} />
              {(totals?.discount ?? 0) > 0 && (
                <Row label="Discount" value={`− ${formatPrice(totals?.discount ?? 0)}`} />
              )}
              <Row
                label="Shipping"
                value={
                  totals?.shippingFee === 0 ? "Free" : formatPrice(totals?.shippingFee ?? 0)
                }
              />
              <Row label="Total" value={formatPrice(totals?.total ?? 0)} emphasis />
            </dl>

            <p className="mt-4 label-xs text-muted-foreground">{siteConfig.shipping.note}</p>

            <ButtonLink to="/checkout" variant="solid" size="lg" full className="mt-8">
              Checkout
            </ButtonLink>
            <Link to="/shop" search={{}} className="mt-6 block label-xs link-rule">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className={emphasis ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
