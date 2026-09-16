import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  SelectField,
  StatusPill,
} from "@/components/admin/AdminUI";
import { getAdminOrder, updateAdminOrderStatus } from "@/backend/admin.functions";
import { formatDate, formatPrice } from "@/lib/format";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getAdminOrder);
  const updateStatus = useServerFn(updateAdminOrderStatus);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  if (query.isLoading) return <p className="label-xs text-muted-foreground">Loading order…</p>;
  if (query.error || !query.data)
    return <p className="text-sm text-signal">Could not load this order.</p>;

  const order: any = query.data;
  const address = order.shipping_address_snapshot ?? {};

  return (
    <div className="space-y-12">
      <AdminHeader
        eyebrow="Trade"
        title={order.order_number}
        actions={
          <Link to="/admin/orders" className="label-xs link-rule text-muted-foreground">
            All orders
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <StatusPill value={`payment: ${order.payment_status}`} />
        <StatusPill value={`fulfilment: ${order.status}`} />
        <StatusPill value={order.inventory_committed ? "stock committed" : "stock not committed"} />
        <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
      </div>

      <AdminPanel title="Fulfilment">
        <div className="flex flex-wrap items-end gap-6">
          <div className="w-56">
            <SelectField
              label="Status"
              name="status"
              defaultValue={order.status}
              onChange={async (event) => {
                setBusy(true);
                setError(null);
                try {
                  await updateStatus({
                    data: { id, status: event.target.value as (typeof STATUSES)[number] },
                  });
                  await query.refetch();
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Could not update the order.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          </div>
          <AdminButton variant="ghost" disabled={busy} onClick={() => query.refetch()}>
            {busy ? "Working…" : "Refresh"}
          </AdminButton>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Cancelling or refunding returns any committed stock to the shelf automatically.
        </p>
        <AdminMessage tone="error" message={error} />
      </AdminPanel>

      <AdminPanel title="Items">
        <ul className="divide-y divide-border">
          {(order.items ?? []).map((item: any) => (
            <li key={item.id} className="flex flex-wrap items-center gap-6 py-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-muted">
                {item.image_url_snapshot && (
                  <img
                    src={item.image_url_snapshot}
                    alt=""
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm">{item.product_name_snapshot}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.size_snapshot, item.color_snapshot, item.sku_snapshot]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="label-xs text-muted-foreground">×{item.quantity}</span>
              <span className="font-sans text-sm">{formatPrice(item.total_price)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-8 space-y-2 text-sm">
          {[
            ["Subtotal", order.subtotal],
            ["Discount", -Number(order.discount)],
            ["Shipping", order.shipping_fee],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between text-muted-foreground">
              <dt>{label}</dt>
              <dd>{formatPrice(Number(value))}</dd>
            </div>
          ))}
          <div className="hairline-t flex justify-between pt-3 font-sans">
            <dt className="label-xs">Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </AdminPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminPanel title="Customer">
          <p className="font-sans text-sm">{order.customer_name ?? "Guest"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{order.customer_email}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.customer_phone}</p>
          <address className="mt-6 whitespace-pre-line text-sm not-italic leading-relaxed text-muted-foreground">
            {[
              address.full_name,
              address.line1,
              address.line2,
              `${address.city ?? ""} ${address.postal_code ?? ""}`.trim(),
              address.state,
              address.country,
            ]
              .filter(Boolean)
              .join("\n")}
          </address>
        </AdminPanel>

        <AdminPanel title="Payments">
          {(order.payments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment attempts recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(order.payments ?? []).map((payment: any) => (
                <li key={payment.id} className="space-y-1 py-4 text-sm">
                  <p className="label-xs text-muted-foreground">
                    {payment.provider} · {payment.status}
                  </p>
                  <p>{formatPrice(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.provider_payment_id ?? payment.provider_order_id ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    signature {payment.signature_verified ? "verified" : "unverified"}
                    {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ""}
                  </p>
                  {payment.failure_reason && (
                    <p className="text-xs text-signal">{payment.failure_reason}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
