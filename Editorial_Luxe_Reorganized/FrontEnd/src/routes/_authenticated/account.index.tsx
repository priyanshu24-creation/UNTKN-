import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/components/providers/AuthProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { getMyProfile, listMyOrders } from "@/backend/account.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account/")({
  component: AccountOverview,
});

function AccountOverview() {
  const { user } = useAuth();
  const wishlist = useWishlist();

  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });

  const latest = orders.data?.[0];

  return (
    <div className="space-y-14">
      <section>
        <h2 className="display-sm">
          {profile.data?.full_name ? `Hello, ${profile.data.full_name}` : "Hello"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{user?.email}</p>
      </section>

      <section className="grid gap-8 sm:grid-cols-3">
        <Stat label="Orders" value={orders.isLoading ? "—" : String(orders.data?.length ?? 0)} />
        <Stat label="Saved pieces" value={String(wishlist.count)} />
        <Stat
          label="Last order"
          value={latest ? formatDate(latest.created_at) : "—"}
        />
      </section>

      <section>
        <div className="hairline-b flex items-baseline justify-between pb-4">
          <h3 className="display-sm">Recent orders</h3>
          <Link to="/account/orders" className="label-xs link-rule">
            All orders
          </Link>
        </div>

        {orders.isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading your orders…</p>
        ) : orders.isError ? (
          <p className="mt-6 text-sm text-signal">We couldn&apos;t load your orders.</p>
        ) : !orders.data?.length ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link to="/shop" search={{}} className="link-rule">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {orders.data.slice(0, 3).map((order) => (
              <li key={order.id} className="flex items-baseline justify-between gap-6 py-5">
                <div>
                  <Link
                    to="/account/orders/$id"
                    params={{ id: order.id }}
                    className="font-sans text-sm link-rule"
                  >
                    {order.order_number}
                  </Link>
                  <p className="mt-1.5 label-xs text-muted-foreground">
                    {formatDate(order.created_at)} · {order.status}
                  </p>
                </div>
                <p className="font-sans text-sm tabular-nums">{formatPrice(order.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline-t pt-4">
      <p className="label-xs text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-2xl">{value}</p>
    </div>
  );
}
