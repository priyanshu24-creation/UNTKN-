import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "../integrations/supabase/auth-middleware";

/**
 * Every function here is authenticated AND role-checked against the database
 * role table. Route protection alone is never treated as authorisation.
 */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (data !== true) {
    const { data: isManager } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "manager",
    });
    if (isManager !== true) throw new Error("Forbidden");
  }
  return context.userId;
}

async function admin() {
  const { supabaseAdmin } = await import("../integrations/supabase/client.server");
  return supabaseAdmin;
}

async function logActivity(
  actorId: string,
  action: string,
  entity: string,
  entityId?: string | null,
) {
  const db = await admin();
  await db
    .from("admin_activity_logs")
    .insert({ actor_id: actorId, action, entity, entity_id: entityId ?? null });
}

/* ------------------------------- access ------------------------------- */

export const getMyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r: { role: string }) => r.role);
    return { roles, isAdmin: roles.some((r: string) => r === "admin" || r === "manager") };
  });

/* ------------------------------ dashboard ----------------------------- */

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();

    const [{ data: paidOrders }, { count: customerCount }, { count: productCount }] =
      await Promise.all([
        db
          .from("orders")
          .select("id, order_number, total, status, payment_status, customer_name, created_at")
          .order("created_at", { ascending: false }),
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("products").select("id", { count: "exact", head: true }),
      ]);

    const orders = paidOrders ?? [];
    const paid = orders.filter((o) => o.payment_status === "captured");
    const revenue = paid.reduce((sum, o) => sum + Number(o.total), 0);

    const { data: lowStock } = await db
      .from("product_variants")
      .select("id, sku, stock_quantity, product:products ( name, slug )")
      .lte("stock_quantity", 5)
      .eq("active", true)
      .order("stock_quantity", { ascending: true })
      .limit(12);

    const byDay = new Map<string, number>();
    for (const order of paid) {
      const day = order.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(order.total));
    }
    const salesSeries = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, total]) => ({ date, total }));

    return {
      revenue,
      orderCount: orders.length,
      paidOrderCount: paid.length,
      pendingOrderCount: orders.filter((o) => o.status === "pending").length,
      customerCount: customerCount ?? 0,
      productCount: productCount ?? 0,
      recentOrders: orders.slice(0, 8),
      lowStock: lowStock ?? [],
      salesSeries,
    };
  });

/* ------------------------------- products ----------------------------- */

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("products")
      .select(
        `id, name, slug, base_price, sale_price, published, featured, created_at,
         category:categories ( id, name ),
         images:product_images ( image_url, is_primary, sort_order ),
         variants:product_variants ( id, stock_quantity, active )`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: product, error } = await db
      .from("products")
      .select(
        `*,
         images:product_images ( id, image_url, alt_text, sort_order, is_primary ),
         variants:product_variants ( id, sku, price, stock_quantity, active, size_id, color_id )`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Product not found.");
    return product;
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only."),
  category_id: z.string().uuid().nullable(),
  short_description: z.string().trim().max(300).nullable(),
  description: z.string().trim().max(4000).nullable(),
  materials: z.string().trim().max(2000).nullable(),
  care_instructions: z.string().trim().max(2000).nullable(),
  base_price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  seo_title: z.string().trim().max(160).nullable(),
  seo_description: z.string().trim().max(320).nullable(),
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productSchema.parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;

    if (id) {
      const { error } = await db.from("products").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "product.update", "products", id);
      return { id };
    }

    const { data: created, error } = await db
      .from("products")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "product.create", "products", created.id);
    return { id: created.id };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "product.delete", "products", data.id);
    return { ok: true };
  });

/* ------------------------------- variants ----------------------------- */

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  sku: z.string().trim().min(2).max(64),
  size_id: z.string().uuid().nullable(),
  color_id: z.string().uuid().nullable(),
  price: z.number().nonnegative().nullable(),
  stock_quantity: z.number().int().min(0),
  active: z.boolean(),
});

export const saveAdminVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => variantSchema.parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;

    if (id) {
      const { error } = await db.from("product_variants").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "variant.update", "product_variants", id);
      return { id };
    }
    const { data: created, error } = await db
      .from("product_variants")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "variant.create", "product_variants", created.id);
    return { id: created.id };
  });

export const deleteAdminVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "variant.delete", "product_variants", data.id);
    return { ok: true };
  });

/* -------------------------------- images ------------------------------ */

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // long-lived read link for a private bucket

/**
 * Uploads a base64 payload into a private bucket and stores a long-lived
 * signed read URL, so buckets stay closed to anonymous listing.
 */
export const uploadAdminImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        bucket: z.enum(["product-images", "content-images"]),
        fileName: z.string().trim().min(1).max(200),
        contentType: z.string().trim().min(3).max(100),
        base64: z.string().min(10),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();

    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await db.storage
      .from(data.bucket)
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: signed, error: signError } = await db.storage
      .from(data.bucket)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signError) throw new Error(signError.message);

    await logActivity(actor, "image.upload", data.bucket, path);
    return { url: signed.signedUrl, path };
  });

export const saveProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        product_id: z.string().uuid(),
        image_url: z.string().url(),
        alt_text: z.string().trim().max(200).nullable(),
        sort_order: z.number().int().min(0),
        is_primary: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;

    if (fields.is_primary) {
      await db
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", fields.product_id);
    }

    if (id) {
      const { error } = await db.from("product_images").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "image.update", "product_images", id);
      return { id };
    }
    const { data: created, error } = await db
      .from("product_images")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "image.create", "product_images", created.id);
    return { id: created.id };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "image.delete", "product_images", data.id);
    return { ok: true };
  });

/* ------------------------- categories / options ----------------------- */

export const listAdminTaxonomy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [categories, sizes, colors] = await Promise.all([
      db.from("categories").select("*").order("sort_order"),
      db.from("sizes").select("*").order("sort_order"),
      db.from("colors").select("*").order("sort_order"),
    ]);
    return {
      categories: categories.data ?? [],
      sizes: sizes.data ?? [],
      colors: colors.data ?? [],
    };
  });

export const saveAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        slug: z
          .string()
          .trim()
          .min(2)
          .max(120)
          .regex(/^[a-z0-9-]+$/),
        description: z.string().trim().max(1000).nullable(),
        image_url: z.string().url().nullable(),
        sort_order: z.number().int().min(0),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    if (id) {
      const { error } = await db.from("categories").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "category.update", "categories", id);
      return { id };
    }
    const { data: created, error } = await db
      .from("categories")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "category.create", "categories", created.id);
    return { id: created.id };
  });

export const deleteAdminCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "category.delete", "categories", data.id);
    return { ok: true };
  });

/* -------------------------------- orders ------------------------------ */

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, currency, customer_name, customer_email, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: order, error } = await db
      .from("orders")
      .select(
        `*,
         items:order_items ( * ),
         payments:payments ( id, provider, provider_order_id, provider_payment_id, amount, status, signature_verified, paid_at, failure_reason )`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found.");
    return order;
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();

    const { error } = await db.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);

    // Cancelling or refunding returns committed stock to the shelf.
    if (data.status === "cancelled" || data.status === "refunded") {
      await db.rpc("release_order_inventory", { _order_id: data.id } as never);
    }
    await logActivity(actor, `order.${data.status}`, "orders", data.id);
    return { ok: true };
  });

/* ------------------------------ customers ----------------------------- */

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [{ data: profiles }, { data: orders }, { data: roles }] = await Promise.all([
      db
        .from("profiles")
        .select("id, email, full_name, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      db.from("orders").select("user_id, total, payment_status"),
      db.from("user_roles").select("user_id, role"),
    ]);

    return (profiles ?? []).map((profile) => {
      const own = (orders ?? []).filter(
        (o) => o.user_id === profile.id && o.payment_status === "captured",
      );
      return {
        ...profile,
        roles: (roles ?? []).filter((r) => r.user_id === profile.id).map((r) => r.role),
        orderCount: own.length,
        lifetimeValue: own.reduce((sum, o) => sum + Number(o.total), 0),
      };
    });
  });

/* ------------------------------- coupons ------------------------------ */

export const listAdminCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveAdminCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        code: z
          .string()
          .trim()
          .min(3)
          .max(40)
          .regex(/^[A-Z0-9-]+$/, "Use capitals, numbers and dashes."),
        description: z.string().trim().max(300).nullable(),
        discount_type: z.enum(["percentage", "fixed"]),
        discount_value: z.number().positive(),
        min_order_value: z.number().min(0),
        max_discount: z.number().positive().nullable(),
        expires_at: z.string().nullable(),
        usage_limit: z.number().int().positive().nullable(),
        per_user_limit: z.number().int().positive().nullable(),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    if (id) {
      const { error } = await db.from("coupons").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "coupon.update", "coupons", id);
      return { id };
    }
    const { data: created, error } = await db.from("coupons").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "coupon.create", "coupons", created.id);
    return { id: created.id };
  });

export const deleteAdminCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "coupon.delete", "coupons", data.id);
    return { ok: true };
  });

/* ------------------------------- content ------------------------------ */

export const listAdminContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [sections, lookbook, settings] = await Promise.all([
      db.from("homepage_sections").select("*").order("sort_order"),
      db.from("lookbook_items").select("*").order("sort_order"),
      db.from("site_settings").select("*").order("key"),
    ]);
    return {
      sections: sections.data ?? [],
      lookbook: lookbook.data ?? [],
      settings: settings.data ?? [],
    };
  });

export const saveHomepageSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        eyebrow: z.string().trim().max(120).nullable(),
        title: z.string().trim().max(200).nullable(),
        subtitle: z.string().trim().max(300).nullable(),
        body: z.string().trim().max(2000).nullable(),
        image_url: z.string().url().nullable(),
        secondary_image_url: z.string().url().nullable(),
        cta_label: z.string().trim().max(60).nullable(),
        cta_href: z.string().trim().max(200).nullable(),
        secondary_cta_label: z.string().trim().max(60).nullable(),
        secondary_cta_href: z.string().trim().max(200).nullable(),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    const { error } = await db.from("homepage_sections").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "content.update", "homepage_sections", id);
    return { ok: true };
  });

export const saveLookbookItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().max(160).nullable(),
        caption: z.string().trim().max(300).nullable(),
        image_url: z.string().url(),
        product_id: z.string().uuid().nullable(),
        span: z.enum(["full", "half", "third", "tall"]),
        sort_order: z.number().int().min(0),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    if (id) {
      const { error } = await db.from("lookbook_items").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "lookbook.update", "lookbook_items", id);
      return { id };
    }
    const { data: created, error } = await db
      .from("lookbook_items")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "lookbook.create", "lookbook_items", created.id);
    return { id: created.id };
  });

export const deleteLookbookItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("lookbook_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "lookbook.delete", "lookbook_items", data.id);
    return { ok: true };
  });

export const saveSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ key: z.string().trim().min(1).max(80), value: z.any() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db
      .from("site_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await logActivity(actor, "setting.update", "site_settings", data.key);
    return { ok: true };
  });

/* --------------------------- sizes and colours ------------------------- */

export const saveAdminSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(40),
        sort_order: z.number().int().min(0),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    if (id) {
      const { error } = await db.from("sizes").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "size.update", "sizes", id);
      return { id };
    }
    const { data: created, error } = await db.from("sizes").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "size.create", "sizes", created.id);
    return { id: created.id };
  });

export const deleteAdminSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("sizes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "size.delete", "sizes", data.id);
    return { ok: true };
  });

export const saveAdminColor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(40),
        hex_code: z
          .string()
          .trim()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .nullable(),
        sort_order: z.number().int().min(0),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { id, ...fields } = data;
    if (id) {
      const { error } = await db.from("colors").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      await logActivity(actor, "color.update", "colors", id);
      return { id };
    }
    const { data: created, error } = await db.from("colors").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    await logActivity(actor, "color.create", "colors", created.id);
    return { id: created.id };
  });

export const deleteAdminColor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("colors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "color.delete", "colors", data.id);
    return { ok: true };
  });

/* ------------------------------- reviews ------------------------------- */

export const listAdminReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [{ data: reviews, error }, { data: products }, { data: profiles }] = await Promise.all([
      db.from("reviews").select("*").order("created_at", { ascending: false }).limit(300),
      db.from("products").select("id, name"),
      db.from("profiles").select("id, email, full_name"),
    ]);
    if (error) throw new Error(error.message);
    return (reviews ?? []).map((review) => ({
      ...review,
      product_name: (products ?? []).find((p) => p.id === review.product_id)?.name ?? "Product",
      author:
        (profiles ?? []).find((p) => p.id === review.user_id)?.full_name ??
        (profiles ?? []).find((p) => p.id === review.user_id)?.email ??
        "Customer",
    }));
  });

export const setReviewApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("reviews").update({ approved: data.approved }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, data.approved ? "review.approve" : "review.hide", "reviews", data.id);
    return { ok: true };
  });

export const deleteAdminReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "review.delete", "reviews", data.id);
    return { ok: true };
  });

/* ----------------------------- newsletter ----------------------------- */

export const listAdminSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setSubscriberActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await admin();
    const { error } = await db
      .from("newsletter_subscribers")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "subscriber.update", "newsletter_subscribers", data.id);
    return { ok: true };
  });

/* ---------------------------- team and roles -------------------------- */

export const setCustomerRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "manager", "editor"]),
        grant: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    // Only a full admin may change who holds a role.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Only an administrator can change roles.");
    if (data.user_id === actor && data.role === "admin" && !data.grant) {
      throw new Error("You cannot remove your own administrator role.");
    }
    const db = await admin();
    if (data.grant) {
      const { error } = await db
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await logActivity(actor, data.grant ? `role.grant.${data.role}` : `role.revoke.${data.role}`, "user_roles", data.user_id);
    return { ok: true };
  });

/* --------------------------- activity log ---------------------------- */

export const listAdminActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [{ data: logs, error }, { data: profiles }] = await Promise.all([
      db.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(300),
      db.from("profiles").select("id, email, full_name"),
    ]);
    if (error) throw new Error(error.message);
    return (logs ?? []).map((log) => ({
      ...log,
      actor:
        (profiles ?? []).find((p) => p.id === log.actor_id)?.full_name ??
        (profiles ?? []).find((p) => p.id === log.actor_id)?.email ??
        "System",
    }));
  });
