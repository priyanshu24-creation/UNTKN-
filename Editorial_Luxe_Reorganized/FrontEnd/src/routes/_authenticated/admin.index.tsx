import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AdminHeader, AdminPanel, EmptyRow, StatusPill } from "@/components/admin/AdminUI";
import { getAdminDashboard } from "@/backend/admin.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const fetchDashboard = useServerFn(getAdminDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchDashboard(),
  });

  if (isLoading) return <p className="label-xs text-muted-foreground">Loading figures…</p>;
  if (error || !data)
    return <p className="text-sm text-signal">Could not load the dashboard. Try again.</p>;

  const peak = Math.max(1, ...data.salesSeries.map((point) => point.total));

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Overview" title="Today at a glance" />

      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Revenue captured", value: formatPrice(data.revenue) },
          { label: "Paid orders", value: String(data.paidOrderCount) },
          { label: "All orders", value: String(data.orderCount) },
          { label: "Awaiting action", value: String(data.pendingOrderCount) },
          { label: "Customers", value: String(data.customerCount) },
          { label: "Products", value: String(data.productCount) },
        ].map((stat) => (
          <div key={stat.label} className="bg-background p-6">
            <p className="label-xs text-muted-foreground">{stat.label}</p>
            <p className="display-sm mt-4">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminPanel title="Sales, last 14 selling days">
        {data.salesSeries.length === 0 ? (
          <EmptyRow>No captured payments yet.</EmptyRow>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {data.salesSeries.map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full bg-foreground"
                  style={{ height: `${Math.max(4, (point.total / peak) * 130)}px` }}
                  title={`${point.date}: ${formatPrice(point.total)}`}
                />
                <span className="text-[10px] tracking-wide text-muted-foreground">
                  {point.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="Recent orders">
        {data.recentOrders.length === 0 ? (
          <EmptyRow>No orders yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: order.id }}
                    className="label-xs link-rule"
                  >
                    {order.order_number}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {order.customer_name ?? "Guest"} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill value={order.payment_status} />
                  <StatusPill value={order.status} />
                  <span className="font-sans text-sm">{formatPrice(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="Low stock">
        {data.lowStock.length === 0 ? (
          <EmptyRow>Every active variant is comfortably stocked.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {data.lowStock.map((variant) => (
              <li key={variant.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-sans text-sm">
                    {(variant.product as { name?: string } | null)?.name ?? "Product"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{variant.sku}</p>
                </div>
                <span className="label-xs text-signal">{variant.stock_quantity} left</span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
