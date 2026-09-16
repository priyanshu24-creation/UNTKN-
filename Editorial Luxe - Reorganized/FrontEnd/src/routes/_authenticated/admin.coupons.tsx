import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  CheckField,
  EmptyRow,
  SelectField,
  StatusPill,
  TextField,
} from "@/components/admin/AdminUI";
import { deleteAdminCoupon, listAdminCoupons, saveAdminCoupon } from "@backend/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const fetchCoupons = useServerFn(listAdminCoupons);
  const save = useServerFn(saveAdminCoupon);
  const remove = useServerFn(deleteAdminCoupon);

  const query = useQuery({ queryKey: ["admin", "coupons"], queryFn: () => fetchCoupons() });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expires, setExpires] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUser, setPerUser] = useState("1");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Trade" title="Coupons" />

      <AdminPanel title="Active and past codes">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading…</p>
        ) : (query.data ?? []).length === 0 ? (
          <EmptyRow>No coupons yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {(query.data ?? []).map((coupon: any) => (
              <li key={coupon.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm tracking-widest">{coupon.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}% off`
                      : `${coupon.discount_value} off`}
                    {Number(coupon.min_order_value) > 0
                      ? ` · min ${coupon.min_order_value}`
                      : ""}
                    {coupon.expires_at ? ` · expires ${formatDate(coupon.expires_at)}` : ""} ·{" "}
                    used {coupon.times_used}
                    {coupon.usage_limit ? `/${coupon.usage_limit}` : ""}
                  </p>
                </div>
                <StatusPill value={coupon.active ? "active" : "paused"} />
                <button
                  type="button"
                  className="label-xs link-rule text-muted-foreground"
                  onClick={async () => {
                    await save({
                      data: {
                        id: coupon.id,
                        code: coupon.code,
                        description: coupon.description ?? null,
                        discount_type: coupon.discount_type,
                        discount_value: Number(coupon.discount_value),
                        min_order_value: Number(coupon.min_order_value),
                        max_discount:
                          coupon.max_discount === null ? null : Number(coupon.max_discount),
                        expires_at: coupon.expires_at ?? null,
                        usage_limit: coupon.usage_limit ?? null,
                        per_user_limit: coupon.per_user_limit ?? null,
                        active: !coupon.active,
                      },
                    });
                    await query.refetch();
                  }}
                >
                  {coupon.active ? "Pause" : "Activate"}
                </button>
                <button
                  type="button"
                  className="label-xs link-rule text-signal"
                  onClick={async () => {
                    if (!confirm(`Delete ${coupon.code}?`)) return;
                    try {
                      await remove({ data: { id: coupon.id } });
                      await query.refetch();
                    } catch (cause) {
                      setError(cause instanceof Error ? cause.message : "Could not delete.");
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="New coupon">
        <div className="grid gap-6 md:grid-cols-3">
          <TextField
            label="Code"
            name="coupon_code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            hint="Capitals, numbers and dashes."
          />
          <SelectField
            label="Type"
            name="coupon_type"
            value={type}
            onChange={(event) => setType(event.target.value as "percentage" | "fixed")}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </SelectField>
          <TextField
            label="Value"
            name="coupon_value"
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <TextField
            label="Minimum order"
            name="coupon_min"
            type="number"
            min={0}
            step="0.01"
            value={minOrder}
            onChange={(event) => setMinOrder(event.target.value)}
          />
          <TextField
            label="Maximum discount"
            name="coupon_max"
            type="number"
            min={0}
            step="0.01"
            value={maxDiscount}
            onChange={(event) => setMaxDiscount(event.target.value)}
            hint="Optional cap for percentage codes."
          />
          <TextField
            label="Expires"
            name="coupon_expires"
            type="date"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
          />
          <TextField
            label="Total uses"
            name="coupon_usage"
            type="number"
            min={1}
            value={usageLimit}
            onChange={(event) => setUsageLimit(event.target.value)}
            hint="Leave empty for unlimited."
          />
          <TextField
            label="Uses per customer"
            name="coupon_per_user"
            type="number"
            min={1}
            value={perUser}
            onChange={(event) => setPerUser(event.target.value)}
          />
          <div className="flex items-end">
            <CheckField
              label="Active"
              name="coupon_active"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6">
          <AdminButton
            disabled={busy || code.trim().length < 3 || Number(value) <= 0}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await save({
                  data: {
                    code: code.trim(),
                    description: null,
                    discount_type: type,
                    discount_value: Number(value),
                    min_order_value: Number(minOrder || 0),
                    max_discount: maxDiscount.trim() === "" ? null : Number(maxDiscount),
                    expires_at:
                      expires.trim() === "" ? null : new Date(`${expires}T23:59:59Z`).toISOString(),
                    usage_limit: usageLimit.trim() === "" ? null : Number(usageLimit),
                    per_user_limit: perUser.trim() === "" ? null : Number(perUser),
                    active,
                  },
                });
                setCode("");
                setMaxDiscount("");
                setExpires("");
                setUsageLimit("");
                await query.refetch();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not save the coupon.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Create coupon"}
          </AdminButton>
          <AdminMessage tone="error" message={error} />
        </div>
      </AdminPanel>
    </div>
  );
}
