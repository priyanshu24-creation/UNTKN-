import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AdminHeader, EmptyRow, StatusPill } from "@/components/admin/AdminUI";
import { listAdminOrders } from "@backend/lib/admin.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  component: AdminOrders,
});

function AdminOrders() {
  const fetchOrders = useServerFn(listAdminOrders);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fetchOrders(),
  });

  return (
    <div className="space-y-10">
      <AdminHeader eyebrow="Trade" title="Orders" />
      {isLoading ? (
        <p className="label-xs text-muted-foreground">Loading orders…</p>
      ) : error ? (
        <p className="text-sm text-signal">Could not load orders.</p>
      ) : !data || data.length === 0 ? (
        <EmptyRow>No orders yet.</EmptyRow>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="min-w-0">
                <Link
                  to="/admin/orders/$id"
                  params={{ id: order.id }}
                  className="label-xs link-rule"
                >
                  {order.order_number}
                </Link>
                <p className="mt-2 truncate text-sm text-muted-foreground">
                  {order.customer_name ?? "Guest"} · {order.customer_email ?? "no email"} ·{" "}
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill value={order.payment_status} />
                <StatusPill value={order.status} />
                <span className="font-sans text-sm">{formatPrice(order.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
