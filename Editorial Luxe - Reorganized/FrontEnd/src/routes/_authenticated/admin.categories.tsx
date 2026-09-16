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
  ImageUploadButton,
  TextArea,
  TextField,
} from "@/components/admin/AdminUI";
import {
  deleteAdminCategory,
  deleteAdminColor,
  deleteAdminSize,
  listAdminTaxonomy,
  saveAdminCategory,
  saveAdminColor,
  saveAdminSize,
} from "@backend/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminCategories() {
  const fetchTaxonomy = useServerFn(listAdminTaxonomy);
  const save = useServerFn(saveAdminCategory);
  const remove = useServerFn(deleteAdminCategory);

  const query = useQuery({ queryKey: ["admin", "taxonomy"], queryFn: () => fetchTaxonomy() });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = query.data?.categories ?? [];

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Catalogue" title="Collections" />

      <AdminPanel title="Existing collections">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading…</p>
        ) : categories.length === 0 ? (
          <EmptyRow>No collections yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((category: any) => (
              <li key={category.id} className="flex flex-wrap items-center gap-6 py-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden bg-muted">
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    defaultValue={category.name}
                    aria-label={`Name for ${category.name}`}
                    className="w-full border-b border-transparent bg-transparent font-sans text-sm outline-none focus-visible:border-foreground"
                    onBlur={async (event) => {
                      if (event.target.value.trim() === category.name) return;
                      await save({
                        data: {
                          id: category.id,
                          name: event.target.value.trim(),
                          slug: category.slug,
                          description: category.description ?? null,
                          image_url: category.image_url ?? null,
                          sort_order: category.sort_order,
                          active: category.active,
                        },
                      });
                      await query.refetch();
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">/{category.slug}</p>
                </div>
                <ImageUploadButton
                  bucket="content-images"
                  label="Replace image"
                  onUploaded={async (url) => {
                    await save({
                      data: {
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? null,
                        image_url: url,
                        sort_order: category.sort_order,
                        active: category.active,
                      },
                    });
                    await query.refetch();
                  }}
                />
                <button
                  type="button"
                  className="label-xs link-rule text-muted-foreground"
                  onClick={async () => {
                    await save({
                      data: {
                        id: category.id,
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? null,
                        image_url: category.image_url ?? null,
                        sort_order: category.sort_order,
                        active: !category.active,
                      },
                    });
                    await query.refetch();
                  }}
                >
                  {category.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="label-xs link-rule text-signal"
                  onClick={async () => {
                    if (!confirm(`Delete “${category.name}”?`)) return;
                    try {
                      await remove({ data: { id: category.id } });
                      await query.refetch();
                    } catch (cause) {
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "Could not delete this collection.",
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <AdminMessage tone="error" message={error} />
      </AdminPanel>

      <AdminPanel title="New collection">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Name"
            name="new_category_name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hint={name ? `Slug: ${slugify(name)}` : ""}
          />
          <div className="flex items-end">
            <CheckField
              label="Visible in store"
              name="new_category_active"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
          </div>
        </div>
        <div className="mt-6">
          <TextArea
            label="Description"
            name="new_category_description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <ImageUploadButton
            bucket="content-images"
            label={imageUrl ? "Image attached" : "Upload image"}
            onUploaded={setImageUrl}
          />
          <AdminButton
            disabled={busy || slugify(name).length < 2}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await save({
                  data: {
                    name: name.trim(),
                    slug: slugify(name),
                    description: description.trim() === "" ? null : description.trim(),
                    image_url: imageUrl,
                    sort_order: categories.length,
                    active,
                  },
                });
                setName("");
                setDescription("");
                setImageUrl(null);
                await query.refetch();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not save.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Create collection"}
          </AdminButton>
        </div>
      </AdminPanel>

      <AdminPanel title="Sizes and colours">
        <div className="grid gap-12 md:grid-cols-2">
          <SizeEditor
            sizes={(query.data?.sizes ?? []) as any[]}
            onRefresh={() => query.refetch()}
          />
          <ColorEditor
            colors={(query.data?.colors ?? []) as any[]}
            onRefresh={() => query.refetch()}
          />
        </div>
      </AdminPanel>
    </div>
  );
}

function SizeEditor({ sizes, onRefresh }: { sizes: any[]; onRefresh: () => unknown }) {
  const save = useServerFn(saveAdminSize);
  const remove = useServerFn(deleteAdminSize);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <h4 className="label-xs text-muted-foreground">Sizes</h4>
      {sizes.length === 0 ? (
        <EmptyRow>No sizes yet.</EmptyRow>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sizes.map((size) => (
            <li key={size.id} className="flex items-center justify-between gap-4 py-3">
              <span className="font-sans text-sm">{size.name}</span>
              <button
                type="button"
                className="label-xs link-rule text-signal"
                onClick={async () => {
                  setError(null);
                  try {
                    await remove({ data: { id: size.id } });
                    await onRefresh();
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? "This size is in use by a variant."
                        : "Could not remove.",
                    );
                  }
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 grid gap-4">
        <TextField
          label="Add a size"
          name="new_size"
          value={name}
          placeholder="XL"
          onChange={(event) => setName(event.target.value)}
        />
        <div>
          <AdminButton
            variant="ghost"
            disabled={busy || name.trim().length === 0}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await save({ data: { name: name.trim(), sort_order: sizes.length } });
                setName("");
                await onRefresh();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not save.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Add size"}
          </AdminButton>
        </div>
        <AdminMessage tone="error" message={error} />
      </div>
    </div>
  );
}

function ColorEditor({ colors, onRefresh }: { colors: any[]; onRefresh: () => unknown }) {
  const save = useServerFn(saveAdminColor);
  const remove = useServerFn(deleteAdminColor);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <h4 className="label-xs text-muted-foreground">Colours</h4>
      {colors.length === 0 ? (
        <EmptyRow>No colours yet.</EmptyRow>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {colors.map((color) => (
            <li key={color.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex items-center gap-3 font-sans text-sm">
                <span
                  aria-hidden
                  className="inline-block size-4 border border-border"
                  style={{ backgroundColor: color.hex_code ?? "transparent" }}
                />
                {color.name}
              </span>
              <button
                type="button"
                className="label-xs link-rule text-signal"
                onClick={async () => {
                  setError(null);
                  try {
                    await remove({ data: { id: color.id } });
                    await onRefresh();
                  } catch {
                    setError("This colour is in use by a variant.");
                  }
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 grid gap-4">
        <TextField
          label="Add a colour"
          name="new_color"
          value={name}
          placeholder="Off-white"
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Hex code (optional)"
          name="new_color_hex"
          value={hex}
          placeholder="#111111"
          onChange={(event) => setHex(event.target.value)}
        />
        <div>
          <AdminButton
            variant="ghost"
            disabled={busy || name.trim().length === 0}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await save({
                  data: {
                    name: name.trim(),
                    hex_code: hex.trim() === "" ? null : hex.trim(),
                    sort_order: colors.length,
                  },
                });
                setName("");
                setHex("");
                await onRefresh();
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? "Check the name, and that the hex code looks like #111111."
                    : "Could not save.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Add colour"}
          </AdminButton>
        </div>
        <AdminMessage tone="error" message={error} />
      </div>
    </div>
  );
}
