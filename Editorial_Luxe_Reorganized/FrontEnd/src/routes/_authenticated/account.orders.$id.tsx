import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { siteConfig } from "@/config/site";
import { getMyOrder } from "@/backend/account.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const order = useQuery({ queryKey: ["my-order", id], queryFn: () => getMyOrder({ data: { id } }) });

  if (order.isLoading) {
    return <div className="h-64 animate-pulse bg-muted" />;
  }
  if (order.isError) {
    return <p className="text-sm text-signal">We couldn&apos;t load this order.</p>;
  }
  if (!order.data) {
    return (
      <div>
        <h2 className="display-sm">Order not found</h2>
        <Link to="/account/orders" className="mt-6 inline-block label-xs link-rule">
          All orders
        </Link>
      </div>
    );
  }

  const data = order.data;
  const address = data.shipping_address_snapshot;

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 label-xs text-muted-foreground">
          <li>
            <Link to="/account/orders" className="link-rule">
              Orders
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{data.order_number}</li>
        </ol>
      </nav>

      <h2 className="display-sm mt-5">{data.order_number}</h2>
      <p className="mt-3 label-xs text-muted-foreground">
        Placed {formatDate(data.created_at)} · {data.status} · Payment {data.payment_status}
      </p>

      <ul className="mt-10 divide-y divide-border">
        {data.items.map((item) => (
          <li key={item.id} className="flex gap-5 py-6">
            <div className="size-20 shrink-0 overflow-hidden bg-muted">
              {item.image_url_snapshot && (
                <img src={item.image_url_snapshot} alt="" className="photo" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm">
                {item.product_slug_snapshot ? (
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.product_slug_snapshot }}
                    className="link-rule"
                  >
                    {item.product_name_snapshot}
                  </Link>
                ) : (
                  item.product_name_snapshot
                )}
              </p>
              <p className="mt-1.5 label-xs text-muted-foreground">
                {[item.size_snapshot, item.color_snapshot].filter(Boolean).join(" · ")}
                {item.sku_snapshot ? ` · ${item.sku_snapshot}` : ""}
              </p>
              <p className="mt-1.5 label-xs text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <p className="font-sans text-sm tabular-nums">{formatPrice(item.total_price)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-8 space-y-3 border-t border-border pt-6 font-sans text-sm">
        <Row label="Subtotal" value={formatPrice(data.subtotal)} />
        {data.discount > 0 && (
          <Row
            label={data.coupon_code ? `Discount (${data.coupon_code})` : "Discount"}
            value={`− ${formatPrice(data.discount)}`}
          />
        )}
        <Row
          label="Shipping"
          value={data.shipping_fee === 0 ? "Free" : formatPrice(data.shipping_fee)}
        />
        <Row label="Total" value={formatPrice(data.total)} emphasis />
      </dl>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <section>
          <h3 className="label-xs text-muted-foreground">Shipping address</h3>
          {address ? (
            <address className="mt-4 not-italic text-sm leading-relaxed text-muted-foreground">
              {[
                address["full_name"],
                address["line1"],
                address["line2"],
                `${address["city"] ?? ""} ${address["postal_code"] ?? ""}`.trim(),
                address["state"],
                address["country"],
                address["phone"],
              ]
                .filter(Boolean)
                .map((line) => (
                  <p key={line as string}>{line}</p>
                ))}
            </address>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">—</p>
          )}
        </section>
        <section>
          <h3 className="label-xs text-muted-foreground">Delivery</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Estimated {siteConfig.shipping.estimatedDelivery} from dispatch.
          </p>
        </section>
      </div>
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
