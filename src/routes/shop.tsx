import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { ActionButton } from "@/components/ui/EditorialButton";
import { formatPrice } from "@/lib/format";
import { categoriesQuery, filterFacetsQuery, productsQuery } from "@/lib/queries";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ShopSearch = {
  category?: string;
  sizes?: string;
  colors?: string;
  min?: number;
  max?: number;
  stock?: boolean;
  featured?: boolean;
  sort?: ProductSort;
};

/** Keys with undefined values are dropped so they never hit the URL. */
function stripUndefined(input: Record<string, unknown>): ShopSearch {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out as ShopSearch;
}

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  featured: "Featured",
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch =>
    stripUndefined({
      category: typeof search["category"] === "string" ? search["category"] : undefined,
      sizes: typeof search["sizes"] === "string" ? search["sizes"] : undefined,
      colors: typeof search["colors"] === "string" ? search["colors"] : undefined,
      min: search["min"] !== undefined && Number.isFinite(Number(search["min"])) ? Number(search["min"]) : undefined,
      max: search["max"] !== undefined && Number.isFinite(Number(search["max"])) ? Number(search["max"]) : undefined,
      stock: search["stock"] === true || search["stock"] === "true" ? true : undefined,
      featured: search["featured"] === true || search["featured"] === "true" ? true : undefined,
      sort: PRODUCT_SORTS.includes(search["sort"] as ProductSort)
        ? (search["sort"] as ProductSort)
        : undefined,
    }),
  head: () => ({
    meta: [
      { title: "Shop All — UNTKN" },
      {
        name: "description",
        content:
          "Browse every UNTKN release. Heavyweight waffle thermals and hand-drawn graphics, filtered by size, colour and collection.",
      },
      { property: "og:title", content: "Shop All — UNTKN" },
      {
        property: "og:description",
        content: "Browse every UNTKN release. Heavyweight waffle thermals and hand-drawn graphics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: facets = { sizes: [], colors: [] } } = useQuery(filterFacetsQuery());

  const params = useMemo(
    () => ({
      category: search.category,
      sizes: search.sizes ? search.sizes.split(",").filter(Boolean) : undefined,
      colors: search.colors ? search.colors.split(",").filter(Boolean) : undefined,
      minPrice: search.min,
      maxPrice: search.max,
      inStockOnly: search.stock,
      featuredOnly: search.featured,
      sort: search.sort ?? "newest",
    }),
    [search],
  );

  const products = useQuery(productsQuery(params));

  const activeCount = [
    search.category,
    search.sizes,
    search.colors,
    search.min,
    search.max,
    search.stock,
    search.featured,
  ].filter(Boolean).length;

  const update = (patch: Record<string, string | number | boolean | undefined>) =>
    navigate({ search: (prev) => stripUndefined({ ...prev, ...patch }), replace: true });

  const toggleCsv = (key: "sizes" | "colors", value: string) => {
    const current = (search[key] ?? "").split(",").filter(Boolean);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next.length ? next.join(",") : undefined });
  };

  const clearAll = () =>
    navigate({ search: stripUndefined({ sort: search.sort }), replace: true });

  const filterPanel = (
    <div className="space-y-10">
      <FilterGroup label="Collection">
        <div className="space-y-2.5">
          <FilterRadio
            label="All"
            checked={!search.category}
            onChange={() => update({ category: undefined })}
          />
          {categories.map((c) => (
            <FilterRadio
              key={c.id}
              label={c.name}
              checked={search.category === c.slug}
              onChange={() => update({ category: c.slug })}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Size">
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((s) => {
            const active = (search.sizes ?? "").split(",").includes(s.name);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleCsv("sizes", s.name)}
                aria-pressed={active}
                className={cn(
                  "h-9 min-w-11 border px-3 label-xs transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-input hover:border-foreground",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="Colour">
        <div className="space-y-2.5">
          {facets.colors.map((c) => (
            <FilterCheckbox
              key={c.id}
              label={c.name}
              swatch={c.hex_code}
              checked={(search.colors ?? "").split(",").includes(c.name)}
              onChange={() => toggleCsv("colors", c.name)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Price">
        <div className="flex items-center gap-3">
          <PriceInput
            label="Min"
            value={search.min}
            onCommit={(v) => update({ min: v })}
          />
          <span className="text-muted-foreground">—</span>
          <PriceInput
            label="Max"
            value={search.max}
            onCommit={(v) => update({ max: v })}
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Availability">
        <div className="space-y-2.5">
          <FilterCheckbox
            label="In stock only"
            checked={!!search.stock}
            onChange={() => update({ stock: search.stock ? undefined : true })}
          />
          <FilterCheckbox
            label="Featured only"
            checked={!!search.featured}
            onChange={() => update({ featured: search.featured ? undefined : true })}
          />
        </div>
      </FilterGroup>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="label-xs link-rule">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-16 md:pt-20">
      <header className="shell pt-14 md:pt-20">
        <p className="label-xs text-muted-foreground">
          {search.category
            ? (categories.find((c) => c.slug === search.category)?.name ?? "Collection")
            : "Catalogue"}
        </p>
        <h1 className="display-lg mt-4">
          {search.category
            ? (categories.find((c) => c.slug === search.category)?.name ?? "Shop")
            : "Shop All"}
        </h1>
      </header>

      <div className="shell mt-12 flex items-center justify-between gap-4 border-y border-hairline py-4">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 label-xs lg:hidden"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="size-4" />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
        <p className="hidden label-xs text-muted-foreground lg:block">
          {products.data ? `${products.data.length} pieces` : "Loading"}
        </p>
        <label className="flex items-center gap-3">
          <span className="label-xs text-muted-foreground">Sort</span>
          <select
            value={search.sort ?? "newest"}
            onChange={(e) => update({ sort: e.target.value as ProductSort })}
            className="border-none bg-transparent label-xs outline-none"
          >
            {PRODUCT_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="shell grid gap-10 pt-10 lg:grid-cols-12 lg:gap-12">
        <aside className="hidden lg:col-span-3 lg:block" aria-label="Filters">
          {filterPanel}
        </aside>

        <div className="lg:col-span-9">
          {products.isPending && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {products.isError && (
            <div className="py-20 text-center">
              <p className="font-display text-2xl">We couldn't load the catalogue</p>
              <ActionButton
                variant="outline"
                size="md"
                className="mt-6"
                onClick={() => products.refetch()}
              >
                Try Again
              </ActionButton>
            </div>
          )}

          {products.data?.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-display text-3xl">Nothing matches those filters</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Try widening your selection.
              </p>
              <ActionButton variant="outline" size="md" className="mt-6" onClick={clearAll}>
                Clear Filters
              </ActionButton>
            </div>
          )}

          {!!products.data?.length && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-16">
              {products.data.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={false}>
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto bg-background"
            >
              <div className="hairline-b sticky top-0 flex items-center justify-between bg-background px-6 py-4">
                <p className="label-xs">Filters</p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="px-6 py-8">{filterPanel}</div>
              <div className="hairline-t sticky bottom-0 bg-background px-6 py-4">
                <ActionButton variant="solid" size="md" full onClick={() => setFiltersOpen(false)}>
                  Show {products.data?.length ?? 0} Pieces
                </ActionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label-xs text-muted-foreground">{label}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FilterRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[oklch(0.145_0_0)]"
      />
      <span className={cn(checked && "font-medium")}>{label}</span>
    </label>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
  swatch,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  swatch?: string | null;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[oklch(0.145_0_0)]"
      />
      {swatch && (
        <span
          aria-hidden="true"
          className="size-3.5 border border-hairline"
          style={{ background: swatch }}
        />
      )}
      <span className={cn(checked && "font-medium")}>{label}</span>
    </label>
  );
}

function PriceInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");

  return (
    <label className="flex-1">
      <span className="sr-only">{label} price</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={label === "Min" ? "0" : formatPrice(9999).replace(/[^\d]/g, "")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft === "" ? undefined : Number(draft))}
        className="w-full border-b border-input bg-transparent pb-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
