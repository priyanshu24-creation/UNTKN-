import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { ButtonLink } from "@/components/ui/EditorialButton";
import { useSiteConfig } from "@/components/ui/SiteConfigProvider";
import { formatPrice } from "@/lib/format";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CartDrawer() {
  const { panel, close } = useUI();
  const cart = useCart();
  const config = useSiteConfig();
  const totals = cart.totals;

  return (
    <AnimatePresence>
      {panel === "cart" && (
        <motion.div key="cart" className="fixed inset-0 z-[60]" initial={false}>
          <motion.button
            type="button"
            aria-label="Close cart"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[27rem] flex-col bg-background"
          >
            <div className="hairline-b flex h-16 items-center justify-between px-6 md:h-20">
              <p className="label-xs">Cart {cart.count > 0 && `(${cart.count})`}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="grid size-9 place-items-center transition-opacity hover:opacity-60"
              >
                <X className="size-5" />
              </button>
            </div>

            {cart.count === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
                <p className="font-display text-3xl">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Short runs, printed by hand. Find yours.
                </p>
                <ButtonLink to="/shop" variant="outline" size="md" onClick={close}>
                  Shop Collection
                </ButtonLink>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {(totals?.lines ?? []).map((line) => (
                      <motion.li
                        key={line.variantId}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="flex gap-4 overflow-hidden py-5"
                      >
                        <Link
                          to="/products/$slug"
                          params={{ slug: line.productSlug }}
                          onClick={close}
                          className="h-28 w-22 shrink-0 overflow-hidden bg-muted"
                          style={{ width: "5.5rem" }}
                        >
                          {line.imageUrl && <img src={line.imageUrl} alt="" className="photo" />}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-sans text-sm">{line.productName}</p>
                              <p className="mt-1 label-xs text-muted-foreground">
                                {[line.sizeName, line.colorName].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => cart.removeItem(line.variantId)}
                              aria-label={`Remove ${line.productName}`}
                              className="label-xs text-muted-foreground link-rule"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                            <div className="flex items-center border border-input">
                              <button
                                type="button"
                                onClick={() =>
                                  cart.setQuantity(line.variantId, Math.max(line.quantity - 1, 1))
                                }
                                disabled={line.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="grid size-8 place-items-center disabled:opacity-30"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  cart.setQuantity(
                                    line.variantId,
                                    Math.min(line.quantity + 1, line.stockQuantity),
                                  )
                                }
                                disabled={line.quantity >= line.stockQuantity}
                                aria-label="Increase quantity"
                                className="grid size-8 place-items-center disabled:opacity-30"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <p className="text-sm tabular-nums">{formatPrice(line.lineTotal)}</p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="hairline-t px-6 py-6">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="tabular-nums">{formatPrice(totals?.subtotal ?? 0)}</dd>
                    </div>
                    {!!totals?.discount && (
                      <div className="flex justify-between text-signal">
                        <dt>Discount</dt>
                        <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Shipping</dt>
                      <dd className="tabular-nums">
                        {totals?.shippingFee ? formatPrice(totals.shippingFee) : "Free"}
                      </dd>
                    </div>
                    <div className="hairline-t flex justify-between pt-3 font-sans text-base">
                      <dt>Total</dt>
                      <dd className="tabular-nums">{formatPrice(totals?.total ?? 0)}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 label-xs text-muted-foreground">
                    {(totals?.subtotal ?? 0) >= config.shipping.freeShippingThreshold
                      ? "Free shipping applied"
                      : `Free shipping above ${formatPrice(config.shipping.freeShippingThreshold)}`}
                  </p>

                  <div className="mt-6 flex flex-col gap-2">
                    <ButtonLink to="/checkout" variant="solid" size="md" full onClick={close}>
                      Checkout
                    </ButtonLink>
                    <ButtonLink to="/cart" variant="outline" size="md" full onClick={close}>
                      View Cart
                    </ButtonLink>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
