import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const getPublicClient = async () => (await import("../../../Backend/src/lib/supabase-public.server")).createPublicClient();
import type {
  Category,
  HomepageSection,
  LookbookItem,
  ProductDetail,
  ProductSummary,
} from "../../../Backend/src/integrations/supabase/types";

const PRODUCT_SELECT = `
  id, name, slug, short_description, description, base_price, sale_price, currency,
  featured, created_at, materials, care_instructions, seo_title, seo_description,
  category:categories!products_category_id_fkey ( id, name, slug ),
  images:product_images ( id, image_url, alt_text, sort_order, is_primary ),
  variants:product_variants (
    id, sku, price, stock_quantity, active,
    size:sizes ( id, name, sort_order ),
    color:colors ( id, name, hex_code )
  )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
type RawProduct = any;

function mapImages(raw: RawProduct) {
  return [...((raw.images ?? []) as any[])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => ({
      id: i.id,
      image_url: i.image_url,
      alt_text: i.alt_text,
      sort_order: i.sort_order,
      is_primary: i.is_primary,
    }));
}

function mapVariants(raw: RawProduct) {
  return ((raw.variants ?? []) as any[])
    .filter((v) => v.active)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price === null ? null : Number(v.price),
      stock_quantity: v.stock_quantity,
      active: v.active,
      size: v.size ?? null,
      color: v.color ?? null,
    }))
    .sort((a, b) => (a.size?.sort_order ?? 0) - (b.size?.sort_order ?? 0));
}

function toSummary(raw: RawProduct): ProductSummary {
  const variants = mapVariants(raw);
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    short_description: raw.short_description,
    base_price: Number(raw.base_price),
    sale_price: raw.sale_price === null ? null : Number(raw.sale_price),
    featured: raw.featured,
    created_at: raw.created_at,
    category: raw.category ?? null,
    images: mapImages(raw),
    in_stock: variants.some((v) => v.stock_quantity > 0),
  };
}

function toDetail(raw: RawProduct): ProductDetail {
  return {
    ...toSummary(raw),
    description: raw.description,
    materials: raw.materials,
    care_instructions: raw.care_instructions,
    seo_title: raw.seo_title,
    seo_description: raw.seo_description,
    currency: raw.currency,
    variants: mapVariants(raw),
  };
}

/* ----------------------------- products ----------------------------- */

const productQuerySchema = z.object({
  category: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStockOnly: z.boolean().optional(),
  featuredOnly: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional(),
  limit: z.number().int().positive().max(60).optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => productQuerySchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    const supabase = await getPublicClient();
    let query = supabase.from("products").select(PRODUCT_SELECT).eq("published", true);

    if (data.category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .eq("active", true)
        .maybeSingle();
      if (!cat) return [];
      query = query.eq("category_id", cat.id);
    }
    if (data.featuredOnly) query = query.eq("featured", true);

    switch (data.sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "price-asc":
        query = query.order("base_price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("base_price", { ascending: false });
        break;
      case "featured":
        query = query
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    let products = (rows ?? []).map(toSummary);

    // filters that depend on variant / effective-price data
    if (data.sizes?.length) {
      const wanted = new Set(data.sizes);
      products = products.filter((p) =>
        (rows ?? [])
          .find((r: any) => r.id === p.id)
          ?.variants?.some((v: any) => v.active && wanted.has(v.size?.name)),
      );
    }
    if (data.colors?.length) {
      const wanted = new Set(data.colors);
      products = products.filter((p) =>
        (rows ?? [])
          .find((r: any) => r.id === p.id)
          ?.variants?.some((v: any) => v.active && wanted.has(v.color?.name)),
      );
    }
    if (data.inStockOnly) products = products.filter((p) => p.in_stock);
    if (typeof data.minPrice === "number") {
      products = products.filter((p) => (p.sale_price ?? p.base_price) >= data.minPrice!);
    }
    if (typeof data.maxPrice === "number") {
      products = products.filter((p) => (p.sale_price ?? p.base_price) <= data.maxPrice!);
    }
    if (data.limit) products = products.slice(0, data.limit);

    return products;
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<ProductDetail | null> => {
    const supabase = await getPublicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toDetail(row) : null;
  });

export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string(), categorySlug: z.string().nullable() }).parse(data),
  )
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    const supabase = await getPublicClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("published", true)
      .neq("slug", data.slug)
      .limit(4);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(toSummary);
  });

export const getProductsByIds = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ ids: z.array(z.string()).max(40) }).parse(data))
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    if (!data.ids.length) return [];
    const supabase = await getPublicClient();
    const { data: rows, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("published", true)
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    const order = new Map(data.ids.map((id, i) => [id, i]));
    return (rows ?? [])
      .map(toSummary)
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  });

/* ---------------------------- categories ---------------------------- */

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const supabase = await getPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order")
      .eq("active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }): Promise<Category | null> => {
    const supabase = await getPublicClient();
    const { data: row, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

/* ------------------------- filter facet values ------------------------- */

export const listFilterFacets = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicClient();
  const [sizes, colors] = await Promise.all([
    supabase.from("sizes").select("id, name, sort_order").order("sort_order"),
    supabase.from("colors").select("id, name, hex_code, sort_order").order("sort_order"),
  ]);
  if (sizes.error) throw new Error(sizes.error.message);
  if (colors.error) throw new Error(colors.error.message);
  return { sizes: sizes.data ?? [], colors: colors.data ?? [] };
});

/* ------------------------------- search ------------------------------- */

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ q: z.string().max(120) }).parse(data))
  .handler(async ({ data }): Promise<ProductSummary[]> => {
    const term = data.q.trim();
    if (term.length < 2) return [];
    const supabase = await getPublicClient();
    const escaped = term.replace(/[%,()]/g, " ");
    const { data: rows, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("published", true)
      .or(
        `name.ilike.%${escaped}%,description.ilike.%${escaped}%,short_description.ilike.%${escaped}%`,
      )
      .limit(8);
    if (error) throw new Error(error.message);
    return (rows ?? []).map(toSummary);
  });

/* ------------------------------ content ------------------------------ */

export const listHomepageSections = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomepageSection[]> => {
    const supabase = await getPublicClient();
    const { data, error } = await supabase
      .from("homepage_sections")
      .select(
        "section_key, eyebrow, title, subtitle, body, image_url, secondary_image_url, cta_label, cta_href, secondary_cta_label, secondary_cta_href",
      )
      .eq("active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listLookbookItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<LookbookItem[]> => {
    const supabase = await getPublicClient();
    const { data, error } = await supabase
      .from("lookbook_items")
      .select("id, title, caption, image_url, span, product:products ( slug, name )")
      .eq("active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []).map((i: any) => ({ ...i, product: i.product ?? null }));
  },
);

/* ---------------------------- newsletter ---------------------------- */

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email().max(180), source: z.string().optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ status: "subscribed" | "already" }> => {
    const supabase = await getPublicClient();
    const email = data.email.trim().toLowerCase();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: data.source ?? "homepage" });
    if (error) {
      if (error.code === "23505") return { status: "already" };
      throw new Error("We couldn't add you to the list. Please try again.");
    }
    return { status: "subscribed" };
  });
