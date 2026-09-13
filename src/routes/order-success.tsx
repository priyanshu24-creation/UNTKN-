import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/EditorialButton";
import { siteConfig } from "@/config/site";
import { readConfirmationHandoff } from "@/lib/checkout-storage";
import { formatPrice } from "@/lib/format";
import { getOrderConfirmation } from "@/lib/orders.functions";

type Search = { order?: string };

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["order"] === "string" ? { order: search["order"] } : {},
  head: () => ({
    meta: [
      { title: "Order Confirmed — UNTKN" },
      { name: "description", content: "Your UNTKN order is confirmed." },
      { property: "og:title", content: "Order Confirmed — UNTKN" },
      { property: "og:description", content: "Your UNTKN order is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const reduceMotion = useReducedMotion();
  const handoff = readConfirmationHandoff();

  const order = useQuery({
    queryKey: ["order-confirmation", handoff?.orderId],
    queryFn: () =>
      getOrderConfirmation({
        data: { orderId: handoff!.orderId, email: handoff!.email },
      }),
    enabled: Boolean(handoff?.orderId && handoff?.email),
    retry: false,
  });

  if (!handoff) {
    return (
      <div className="shell pb-40 pt-28 md:pt-40">
        <h1 className="display-md">Order</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          We can&apos;t show this confirmation any more. Your orders are always listed in your
          account.
        </p>
        <ButtonLink to="/account/orders" variant="solid" size="lg" className="mt-8">
          View my orders
        </ButtonLink>
      </div>
    );
  }

  if (order.isLoading) {
    return (
      <div className="shell pb-40 pt-28 md:pt-40">
        <div className="h-8 w-48 animate-pulse bg-muted" />
        <div className="mt-6 h-40 animate-pulse bg-muted" />
      </div>
    );
  }

  if (order.isError || !order.data) {
    return (
      <div className="shell pb-40 pt-28 md:pt-40">
        <h1 className="display-md">We couldn&apos;t load your order</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Your payment may still have gone through. Check your account or email us at{" "}
          <a href={`mailto:${siteConfig.contact.email}`} className="link-rule">
            {siteConfig.contact.email}
          </a>
          .
        </p>
        <ButtonLink to="/account/orders" variant="solid" size="lg" className="mt-8">
          View my orders
        </ButtonLink>
      </div>
    );
  }

  const data = order.data;
  const address = data.shipping_address_snapshot;

  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid size-12 place-items-center border border-foreground"
          aria-hidden="true"
        >
          <Check className="size-5" />
        </motion.span>
        <p className="mt-8 label-xs text-muted-foreground">Order {data.order_number}</p>
        <h1 className="display-lg mt-4">Thank you</h1>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Payment {data.payment_status === "captured" ? "confirmed" : data.payment_status}. We&apos;ve
          emailed a receipt to {data.customer_email}. Estimated delivery{" "}
          {siteConfig.shipping.estimatedDelivery}.
        </p>
      </motion.div>

      <div className="mt-20 grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:gap-24">
        <section>
          <h2 className="label-xs text-muted-foreground">Items</h2>
          <ul className="mt-6 divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className="size-20 shrink-0 overflow-hidden bg-muted">
                  {item.image_url_snapshot && (
                    <img src={item.image_url_snapshot} alt="" className="photo" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm">{item.product_name_snapshot}</p>
                  <p className="mt-1 label-xs text-muted-foreground">
                    {[item.size_snapshot, item.color_snapshot].filter(Boolean).join(" · ")} · ×
                    {item.quantity}
                  </p>
                  <p className="mt-1 label-xs text-muted-foreground">{item.sku_snapshot}</p>
                </div>
                <p className="font-sans text-sm tabular-nums">{formatPrice(item.total_price)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-border pt-6 font-sans text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(data.subtotal)}</dd>
            </div>
            {Number(data.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Discount {data.coupon_code ? `(${data.coupon_code})` : ""}
                </dt>
                <dd className="tabular-nums">− {formatPrice(data.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {Number(data.shipping_fee) === 0 ? "Free" : formatPrice(data.shipping_fee)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Total paid</dt>
              <dd className="tabular-nums">{formatPrice(data.total)}</dd>
            </div>
          </dl>
        </section>

        <aside>
          <h2 className="label-xs text-muted-foreground">Shipping to</h2>
          {address && (
            <address className="mt-6 not-italic text-sm leading-relaxed text-muted-foreground">
              {address.full_name}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city} {address.postal_code}
              <br />
              {address.state}, {address.country}
              <br />
              {address.phone}
            </address>
          )}

          <div className="mt-10 flex flex-col gap-4">
            <ButtonLink to="/account/orders" variant="solid" size="lg">
              View order
            </ButtonLink>
            <Link to="/shop" className="label-xs link-rule">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
