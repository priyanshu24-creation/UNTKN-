import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Field, FormError } from "@/components/auth/AuthShell";
import { ActionButton } from "@/components/ui/EditorialButton";
import { siteConfig } from "@/config/site";
import {
  deleteMyAddress,
  listMyAddresses,
  saveMyAddress,
  type AccountAddress,
} from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  component: AddressesPage,
});

type Draft = {
  id?: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
};

const emptyDraft = (): Draft => ({
  label: "",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: siteConfig.commerce.country,
  postal_code: "",
  is_default: false,
});

function toDraft(address: AccountAddress): Draft {
  return {
    id: address.id,
    label: address.label ?? "",
    full_name: address.full_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    country: address.country,
    postal_code: address.postal_code,
    is_default: address.is_default,
  };
}

function AddressesPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addresses = useQuery({ queryKey: ["my-addresses"], queryFn: () => listMyAddresses() });

  const save = useMutation({
    mutationFn: (value: Draft) =>
      saveMyAddress({
        data: {
          ...(value.id ? { id: value.id } : {}),
          label: value.label || null,
          full_name: value.full_name,
          phone: value.phone,
          line1: value.line1,
          line2: value.line2 || null,
          city: value.city,
          state: value.state,
          country: value.country,
          postal_code: value.postal_code,
          is_default: value.is_default,
        },
      }),
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
    },
    onError: (e: Error) => setError(e.message || "We couldn't save that address."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMyAddress({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-addresses"] }),
  });

  const set = (key: keyof Draft, value: string | boolean) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  return (
    <div>
      <div className="hairline-b flex items-baseline justify-between pb-4">
        <h2 className="display-sm">Addresses</h2>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDraft(emptyDraft());
          }}
          className="label-xs link-rule"
        >
          Add new
        </button>
      </div>

      {addresses.isLoading ? (
        <div className="mt-8 h-24 animate-pulse bg-muted" />
      ) : addresses.isError ? (
        <p className="mt-8 text-sm text-signal">We couldn&apos;t load your addresses.</p>
      ) : !addresses.data?.length ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No addresses saved yet. Add one to check out faster.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {addresses.data.map((address) => (
            <li key={address.id} className="border border-border p-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="label-xs text-muted-foreground">
                  {address.label || "Address"}
                  {address.is_default ? " · Default" : ""}
                </p>
              </div>
              <address className="mt-4 not-italic text-sm leading-relaxed">
                {address.full_name}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.city} {address.postal_code}
                <br />
                {address.state}, {address.country}
                <br />
                {address.phone}
              </address>
              <div className="mt-5 flex gap-5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDraft(toDraft(address));
                  }}
                  className="label-xs link-rule"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(address.id)}
                  className="label-xs text-muted-foreground link-rule"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            save.mutate(draft);
          }}
          className="mt-12 space-y-5 border border-border p-6"
          noValidate
        >
          <h3 className="label-xs text-muted-foreground">
            {draft.id ? "Edit address" : "New address"}
          </h3>
          <Field
            label="Label (Home, Studio…)"
            value={draft.label}
            onChange={(e) => set("label", e.target.value)}
          />
          <Field
            label="Full name"
            required
            value={draft.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
          <Field
            label="Phone"
            required
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Field
            label="Address line 1"
            required
            value={draft.line1}
            onChange={(e) => set("line1", e.target.value)}
          />
          <Field
            label="Address line 2"
            value={draft.line2}
            onChange={(e) => set("line2", e.target.value)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="City"
              required
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <Field
              label="State"
              required
              value={draft.state}
              onChange={(e) => set("state", e.target.value)}
            />
            <Field
              label="Postal code"
              required
              value={draft.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
            />
            <Field
              label="Country"
              required
              value={draft.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 label-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.is_default}
              onChange={(e) => set("is_default", e.target.checked)}
              className="size-4 accent-foreground"
            />
            Use as my default address
          </label>
          <FormError message={error} />
          <div className="flex gap-3">
            <ActionButton type="submit" size="md" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save address"}
            </ActionButton>
            <ActionButton type="button" variant="outline" size="md" onClick={() => setDraft(null)}>
              Cancel
            </ActionButton>
          </div>
        </form>
      )}
    </div>
  );
}
