import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  CheckField,
  EmptyRow,
  ImageUploadButton,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/AdminUI";
import {
  deleteAdminVariant,
  deleteProductImage,
  getAdminProduct,
  listAdminTaxonomy,
  saveAdminProduct,
  saveAdminVariant,
  saveProductImage,
} from "@/backend/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: AdminProductEditor,
});

type NumericInput = string;

type Draft = {
  name: string;
  slug: string;
  category_id: string;
  short_description: string;
  description: string;
  materials: string;
  care_instructions: string;
  base_price: NumericInput;
  sale_price: NumericInput;
  published: boolean;
  featured: boolean;
  seo_title: string;
  seo_description: string;
};

function AdminProductEditor() {
  const { id } = Route.useParams();
  const fetchProduct = useServerFn(getAdminProduct);
  const fetchTaxonomy = useServerFn(listAdminTaxonomy);
  const saveProduct = useServerFn(saveAdminProduct);
  const saveVariant = useServerFn(saveAdminVariant);
  const removeVariant = useServerFn(deleteAdminVariant);
  const saveImage = useServerFn(saveProductImage);
  const removeImage = useServerFn(deleteProductImage);

  const product = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => fetchProduct({ data: { id } }),
  });
  const taxonomy = useQuery({
    queryKey: ["admin", "taxonomy"],
    queryFn: () => fetchTaxonomy(),
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const row: any = product.data;
    if (!row) return;
    setDraft({
      name: row.name ?? "",
      slug: row.slug ?? "",
      category_id: row.category_id ?? "",
      short_description: row.short_description ?? "",
      description: row.description ?? "",
      materials: row.materials ?? "",
      care_instructions: row.care_instructions ?? "",
      base_price: String(row.base_price ?? 0),
      sale_price: row.sale_price === null || row.sale_price === undefined ? "" : String(row.sale_price),
      published: Boolean(row.published),
      featured: Boolean(row.featured),
      seo_title: row.seo_title ?? "",
      seo_description: row.seo_description ?? "",
    });
  }, [product.data]);

  if (product.isLoading || !draft) {
    return <p className="label-xs text-muted-foreground">Loading product…</p>;
  }
  if (product.error) {
    return <p className="text-sm text-signal">Could not load this product.</p>;
  }

  const row: any = product.data;
  const images = ((row.images ?? []) as any[]).sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const variants = ((row.variants ?? []) as any[]).slice();
  const sizes = taxonomy.data?.sizes ?? [];
  const colors = taxonomy.data?.colors ?? [];

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  const nullable = (value: string) => (value.trim() === "" ? null : value.trim());
  const onSale = draft.sale_price.trim() !== "";

  async function handleSave() {
    if (!draft) return;
    const base = Number(draft.base_price || 0);
    const sale = draft.sale_price.trim() === "" ? null : Number(draft.sale_price);
    if (base <= 0) {
      setError("Give the piece a price above zero.");
      return;
    }
    if (sale !== null && !(sale > 0 && sale < base)) {
      setError("The sale price must be above zero and lower than the price before sale.");
      return;
    }
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      await saveProduct({
        data: {
          id,
          name: draft.name.trim(),
          slug: draft.slug.trim(),
          category_id: draft.category_id === "" ? null : draft.category_id,
          short_description: nullable(draft.short_description),
          description: nullable(draft.description),
          materials: nullable(draft.materials),
          care_instructions: nullable(draft.care_instructions),
          base_price: Number(draft.base_price || 0),
          sale_price: draft.sale_price.trim() === "" ? null : Number(draft.sale_price),
          published: draft.published,
          featured: draft.featured,
          seo_title: nullable(draft.seo_title),
          seo_description: nullable(draft.seo_description),
        },
      });
      setStatus("Saved.");
      await product.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-12">
      <AdminHeader
        eyebrow="Catalogue"
        title={draft.name || "Product"}
        actions={
          <>
            <Link to="/admin/products" className="label-xs link-rule text-muted-foreground">
              All products
            </Link>
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </AdminButton>
          </>
        }
      />
      <AdminMessage tone="error" message={error} />
      <AdminMessage tone="success" message={status} />

      <AdminPanel title="Details">
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Name"
            name="name"
            value={draft.name}
            onChange={(event) => set("name", event.target.value)}
          />
          <TextField
            label="URL slug"
            name="slug"
            value={draft.slug}
            hint="Lowercase letters, numbers and dashes."
            onChange={(event) => set("slug", event.target.value)}
          />
          <SelectField
            label="Category"
            name="category_id"
            value={draft.category_id}
            onChange={(event) => set("category_id", event.target.value)}
          >
            <option value="">Uncategorised</option>
            {(taxonomy.data?.categories ?? []).map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <div className="flex items-end gap-8">
            <CheckField
              label="Published"
              name="published"
              checked={draft.published}
              onChange={(event) => set("published", event.target.checked)}
            />
            <CheckField
              label="Featured"
              name="featured"
              checked={draft.featured}
              onChange={(event) => set("featured", event.target.checked)}
            />
          </div>
          <div className="md:col-span-2">
            <CheckField
              label="This piece is on sale"
              name="on_sale"
              checked={onSale}
              onChange={(event) =>
                set("sale_price", event.target.checked ? draft.base_price : "")
              }
            />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <TextField
                label={onSale ? "Price before sale" : "Price"}
                name="base_price"
                type="number"
                min={0}
                step="0.01"
                value={draft.base_price}
                hint={
                  onSale
                    ? "Shown struck through on the storefront."
                    : "The single price customers pay."
                }
                onChange={(event) => set("base_price", event.target.value)}
              />
              {onSale && (
                <TextField
                  label="Price after sale"
                  name="sale_price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.sale_price}
                  hint="Must be lower than the price before sale."
                  onChange={(event) => set("sale_price", event.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <TextArea
            label="Short description"
            name="short_description"
            rows={2}
            value={draft.short_description}
            onChange={(event) => set("short_description", event.target.value)}
          />
          <TextArea
            label="Description"
            name="description"
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <TextArea
              label="Materials"
              name="materials"
              rows={3}
              value={draft.materials}
              onChange={(event) => set("materials", event.target.value)}
            />
            <TextArea
              label="Care"
              name="care_instructions"
              rows={3}
              value={draft.care_instructions}
              onChange={(event) => set("care_instructions", event.target.value)}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              label="SEO title"
              name="seo_title"
              value={draft.seo_title}
              onChange={(event) => set("seo_title", event.target.value)}
            />
            <TextField
              label="SEO description"
              name="seo_description"
              value={draft.seo_description}
              onChange={(event) => set("seo_description", event.target.value)}
            />
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Imagery">
        <ImageUploadButton
          bucket="product-images"
          onUploaded={async (url) => {
            await saveImage({
              data: {
                product_id: id,
                image_url: url,
                alt_text: draft.name || null,
                sort_order: images.length,
                is_primary: images.length === 0,
              },
            });
            await product.refetch();
          }}
        />

        {images.length === 0 ? (
          <EmptyRow>No imagery yet. Upload the campaign photographs.</EmptyRow>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {images.map((image, index) => (
              <li key={image.id} className="space-y-3">
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={image.image_url}
                    alt={image.alt_text ?? ""}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {image.is_primary ? (
                    <span className="label-xs text-muted-foreground">Primary</span>
                  ) : (
                    <button
                      type="button"
                      className="label-xs link-rule text-muted-foreground"
                      onClick={async () => {
                        await saveImage({
                          data: {
                            id: image.id,
                            product_id: id,
                            image_url: image.image_url,
                            alt_text: image.alt_text ?? null,
                            sort_order: image.sort_order,
                            is_primary: true,
                          },
                        });
                        await product.refetch();
                      }}
                    >
                      Make primary
                    </button>
                  )}
                  {index > 0 && (
                    <button
                      type="button"
                      className="label-xs link-rule text-muted-foreground"
                      onClick={async () => {
                        await saveImage({
                          data: {
                            id: image.id,
                            product_id: id,
                            image_url: image.image_url,
                            alt_text: image.alt_text ?? null,
                            sort_order: Math.max(0, image.sort_order - 1),
                            is_primary: image.is_primary,
                          },
                        });
                        await product.refetch();
                      }}
                    >
                      Move up
                    </button>
                  )}
                  <button
                    type="button"
                    className="label-xs link-rule text-signal"
                    onClick={async () => {
                      await removeImage({ data: { id: image.id } });
                      await product.refetch();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="Variants and stock">
        <VariantEditor
          productId={id}
          variants={variants}
          sizes={sizes}
          colors={colors}
          onSave={async (payload) => {
            await saveVariant({ data: payload });
            await product.refetch();
          }}
          onDelete={async (variantId) => {
            await removeVariant({ data: { id: variantId } });
            await product.refetch();
          }}
        />
      </AdminPanel>
    </div>
  );
}

function VariantEditor({
  productId,
  variants,
  sizes,
  colors,
  onSave,
  onDelete,
}: {
  productId: string;
  variants: any[];
  sizes: any[];
  colors: any[];
  onSave: (payload: {
    id?: string;
    product_id: string;
    sku: string;
    size_id: string | null;
    color_id: string | null;
    price: number | null;
    stock_quantity: number;
    active: boolean;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [sku, setSku] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [colorId, setColorId] = useState("");
  const [stock, setStock] = useState("0");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const label = (list: any[], value: string | null) =>
    list.find((item) => item.id === value)?.name ?? "—";

  return (
    <div className="space-y-8">
      {variants.length === 0 ? (
        <EmptyRow>No variants yet. Every purchasable size and colour needs one.</EmptyRow>
      ) : (
        <ul className="divide-y divide-border">
          {variants.map((variant) => (
            <li key={variant.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm">{variant.sku}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {label(sizes, variant.size_id)} · {label(colors, variant.color_id)}
                  {variant.price !== null && variant.price !== undefined
                    ? ` · override ${variant.price}`
                    : ""}
                </p>
              </div>
              <label className="label-xs flex items-center gap-2 text-muted-foreground">
                Stock
                <input
                  type="number"
                  min={0}
                  defaultValue={variant.stock_quantity}
                  className="h-10 w-20 border border-border bg-transparent px-2 font-sans text-sm outline-none focus-visible:border-foreground"
                  onBlur={async (event) => {
                    const next = Number(event.target.value);
                    if (next === variant.stock_quantity) return;
                    await onSave({
                      id: variant.id,
                      product_id: productId,
                      sku: variant.sku,
                      size_id: variant.size_id ?? null,
                      color_id: variant.color_id ?? null,
                      price: variant.price ?? null,
                      stock_quantity: Math.max(0, next),
                      active: variant.active,
                    });
                  }}
                />
              </label>
              <button
                type="button"
                className="label-xs link-rule text-muted-foreground"
                onClick={() =>
                  onSave({
                    id: variant.id,
                    product_id: productId,
                    sku: variant.sku,
                    size_id: variant.size_id ?? null,
                    color_id: variant.color_id ?? null,
                    price: variant.price ?? null,
                    stock_quantity: variant.stock_quantity,
                    active: !variant.active,
                  })
                }
              >
                {variant.active ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                className="label-xs link-rule text-signal"
                onClick={() => onDelete(variant.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="hairline-t pt-8">
        <h4 className="label-xs text-muted-foreground">Add a variant</h4>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <TextField
            label="SKU"
            name="new_sku"
            value={sku}
            onChange={(event) => setSku(event.target.value.toUpperCase())}
          />
          <SelectField
            label="Size"
            name="new_size"
            value={sizeId}
            onChange={(event) => setSizeId(event.target.value)}
          >
            <option value="">None</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Colour"
            name="new_color"
            value={colorId}
            onChange={(event) => setColorId(event.target.value)}
          >
            <option value="">None</option>
            {colors.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Stock"
            name="new_stock"
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
          <TextField
            label="Price override"
            name="new_price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <AdminButton
            disabled={busy || sku.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onSave({
                  product_id: productId,
                  sku: sku.trim(),
                  size_id: sizeId === "" ? null : sizeId,
                  color_id: colorId === "" ? null : colorId,
                  price: price.trim() === "" ? null : Number(price),
                  stock_quantity: Math.max(0, Number(stock || 0)),
                  active: true,
                });
                setSku("");
                setStock("0");
                setPrice("");
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not add the variant.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Adding…" : "Add variant"}
          </AdminButton>
          <AdminMessage tone="error" message={error} />
        </div>
      </div>
    </div>
  );
}
