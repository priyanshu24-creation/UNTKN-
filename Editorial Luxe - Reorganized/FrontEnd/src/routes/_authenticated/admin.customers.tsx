import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminHeader,
  AdminMessage,
  AdminPanel,
  EmptyRow,
  StatusPill,
  TextField,
} from "@/components/admin/AdminUI";
import { listAdminCustomers, setCustomerRole } from "@backend/lib/admin.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const fetchCustomers = useServerFn(listAdminCustomers);
  const changeRole = useServerFn(setCustomerRole);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["admin", "customers"], queryFn: () => fetchCustomers() });
  const term = search.trim().toLowerCase();
  const customers = (query.data ?? []).filter((customer) =>
    term === ""
      ? true
      : `${customer.full_name ?? ""} ${customer.email ?? ""}`.toLowerCase().includes(term),
  );

  async function toggle(userId: string, role: "admin" | "manager", grant: boolean) {
    setError(null);
    setStatus(null);
    try {
      await changeRole({ data: { user_id: userId, role, grant } });
      setStatus(grant ? `Granted ${role} access.` : `Removed ${role} access.`);
      await query.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change access.");
    }
  }

  return (
    <div className="space-y-10">
      <AdminHeader eyebrow="People" title="Customers" />
      <AdminMessage tone="error" message={error} />
      <AdminMessage tone="success" message={status} />

      <div className="max-w-sm">
        <TextField
          label="Search"
          name="customer_search"
          value={search}
          placeholder="Name or email"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <AdminPanel title="Accounts and studio access">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading customers…</p>
        ) : query.error ? (
          <p className="text-sm text-signal">Could not load customers.</p>
        ) : customers.length === 0 ? (
          <EmptyRow>No customers match that search.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((customer) => {
              const isAdmin = customer.roles.includes("admin");
              const isManager = customer.roles.includes("manager");
              return (
                <li
                  key={customer.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-5"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-sm">{customer.full_name ?? "No name given"}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {customer.email} · joined {formatDate(customer.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {customer.roles
                      .filter((role) => role !== "customer")
                      .map((role) => (
                        <StatusPill key={role} value={role} />
                      ))}
                    <span className="label-xs text-muted-foreground">
                      {customer.orderCount} orders
                    </span>
                    <span className="font-sans text-sm">{formatPrice(customer.lifetimeValue)}</span>
                    <button
                      type="button"
                      className="label-xs link-rule text-muted-foreground"
                      onClick={() => toggle(customer.id, "admin", !isAdmin)}
                    >
                      {isAdmin ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      className="label-xs link-rule text-muted-foreground"
                      onClick={() => toggle(customer.id, "manager", !isManager)}
                    >
                      {isManager ? "Revoke manager" : "Make manager"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Access is stored in the database and re-checked on the server for every studio action.
          Managers can run the store; only an administrator can grant or remove access.
        </p>
      </AdminPanel>
    </div>
  );
}
