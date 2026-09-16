import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AdminHeader, AdminPanel, EmptyRow } from "@/components/admin/AdminUI";
import { listAdminActivity } from "@/backend/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivity,
});

function AdminActivity() {
  const fetchActivity = useServerFn(listAdminActivity);
  const query = useQuery({ queryKey: ["admin", "activity"], queryFn: () => fetchActivity() });
  const rows = (query.data ?? []) as any[];

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Audit" title="Activity log" />
      <AdminPanel title="Every studio action, newest first">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading log…</p>
        ) : rows.length === 0 ? (
          <EmptyRow>No studio activity recorded yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-sans text-sm">{row.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.actor}
                    {row.entity ? ` · ${row.entity}` : ""}
                    {row.entity_id ? ` · ${row.entity_id}` : ""}
                  </p>
                </div>
                <span className="label-xs text-muted-foreground">{formatDate(row.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
