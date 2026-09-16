import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  EmptyRow,
  StatusPill,
} from "@/components/admin/AdminUI";
import { listAdminSubscribers, setSubscriberActive } from "@backend/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: AdminNewsletter,
});

function AdminNewsletter() {
  const fetchSubscribers = useServerFn(listAdminSubscribers);
  const setActive = useServerFn(setSubscriberActive);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["admin", "subscribers"], queryFn: () => fetchSubscribers() });
  const rows = (query.data ?? []) as any[];
  const active = rows.filter((row) => row.active);

  return (
    <div className="space-y-12">
      <AdminHeader
        eyebrow="Audience"
        title="Newsletter"
        actions={
          rows.length > 0 ? (
            <AdminButton
              variant="ghost"
              onClick={() => {
                const csv = ["email,active,source,signed_up"]
                  .concat(
                    rows.map((row) =>
                      [row.email, row.active, row.source ?? "", row.created_at].join(","),
                    ),
                  )
                  .join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = "untkn-subscribers.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </AdminButton>
          ) : undefined
        }
      />
      <AdminMessage tone="error" message={error} />

      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-background p-6">
          <p className="label-xs text-muted-foreground">Subscribed</p>
          <p className="display-sm mt-4">{active.length}</p>
        </div>
        <div className="bg-background p-6">
          <p className="label-xs text-muted-foreground">Unsubscribed</p>
          <p className="display-sm mt-4">{rows.length - active.length}</p>
        </div>
      </div>

      <AdminPanel title="Subscribers">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading subscribers…</p>
        ) : rows.length === 0 ? (
          <EmptyRow>Nobody has signed up yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm">{row.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.source ?? "site"} · {formatDate(row.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill value={row.active ? "subscribed" : "unsubscribed"} />
                  <button
                    type="button"
                    className="label-xs link-rule text-muted-foreground"
                    onClick={async () => {
                      setError(null);
                      try {
                        await setActive({ data: { id: row.id, active: !row.active } });
                        await query.refetch();
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Could not update.");
                      }
                    }}
                  >
                    {row.active ? "Remove" : "Restore"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
