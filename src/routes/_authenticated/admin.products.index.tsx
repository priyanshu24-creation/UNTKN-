import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  EmptyRow,
  StatusPill,
} from "@/components/admin/AdminUI";
import { deleteAdminProduct, listAdminProducts, saveAdminProduct } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: AdminProducts,
});

type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>[number];

function primaryImage(product: AdminProductRow): string | null {
  const images = (product.images ?? []) as {
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
  const sorted = [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.image_url ?? null;
}

function AdminProducts() {
  const navigate = useNavigate();
  const fetchProducts = useServerFn(listAdminProducts);
  const create = useServerFn(saveAdminProduct);
  const remove = useServerFn(deleteAdminProduct);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetchProducts(),
  });

  async function createDraft() {
    setBusy(true);
    setError(null);
    try {
      const stamp = Date.now().toString(36);
      const result = await create({
        data: {
          name: "Untitled piece",
          slug: `untitled-${stamp}`,
          category_id: null,
          short_description: null,
          description: null,
          materials: null,
          care_instructions: null,
          base_price: 0,
          sale_price: null,
          published: false,
          featured: false,
          seo_title: null,
          seo_description: null,
        },
      });
      navigate({ to: "/admin/products/$id", params: { id: result.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <AdminHeader
        eyebrow="Catalogue"
        title="Products"
        actions={
          <AdminButton onClick={createDraft} disabled={busy}>
            {busy ? "Creating…" : "New product"}
          </AdminButton>
        }
      />
      <AdminMessage tone="error" message={error} />

      {isLoading ? (
        <p className="label-xs text-muted-foreground">Loading catalogue…</p>
      ) : !data || data.length === 0 ? (
        <EmptyRow>No products yet. Create the first one.</EmptyRow>
      ) : (
        <ul className="divide-y divide-border">
          {data.map((product) => {
            const variants = (product.variants ?? []) as {
              stock_quantity: number;
              active: boolean;
            }[];
            const stock = variants
              .filter((variant) => variant.active)
              .reduce((sum, variant) => sum + variant.stock_quantity, 0);
            const image = primaryImage(product);

            return (
              <li key={product.id} className="flex flex-wrap items-center gap-6 py-5">
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-muted">
                  {image && (
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/admin/products/$id"
                    params={{ id: product.id }}
                    className="label-xs link-rule"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    /{product.slug} ·{" "}
                    {(product.category as { name?: string } | null)?.name ?? "Uncategorised"} ·{" "}
                    {variants.length} variants · {stock} in stock
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill value={product.published ? "live" : "draft"} />
                  {product.featured && <StatusPill value="featured" />}
                  <span className="font-sans text-sm">
                    {formatPrice(product.sale_price ?? product.base_price)}
                  </span>
                  <AdminButton
                    variant="danger"
                    onClick={async () => {
                      if (!confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
                      try {
                        await remove({ data: { id: product.id } });
                        await refetch();
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Delete failed.");
                      }
                    }}
                  >
                    Delete
                  </AdminButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
