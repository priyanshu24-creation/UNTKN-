import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { listMyOrders } from "@/backend/account.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });

  return (
    <div>
      <h2 className="display-sm hairline-b pb-4">Orders</h2>

      {orders.isLoading ? (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-muted" />
          ))}
        </div>
      ) : orders.isError ? (
        <p className="mt-8 text-sm text-signal">We couldn&apos;t load your orders.</p>
      ) : !orders.data?.length ? (
        <p className="mt-8 text-sm text-muted-foreground">
          You haven&apos;t placed an order yet.{" "}
          <Link to="/shop" search={{}} className="link-rule">
            Browse the shop
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border">
          {orders.data.map((order) => (
            <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-4 py-6">
              <div>
                <Link
                  to="/account/orders/$id"
                  params={{ id: order.id }}
                  className="font-sans text-sm link-rule"
                >
                  {order.order_number}
                </Link>
                <p className="mt-1.5 label-xs text-muted-foreground">
                  {formatDate(order.created_at)} · {order.item_count}{" "}
                  {order.item_count === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-sans text-sm tabular-nums">{formatPrice(order.total)}</p>
                <p className="mt-1.5 label-xs text-muted-foreground">
                  {order.status} · {order.payment_status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
