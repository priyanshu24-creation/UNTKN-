import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "../../../Backend/src/integrations/supabase/auth-middleware";
import { siteConfig } from "@/config/site";
const getPublicClient = async () => (await import("../../../Backend/src/lib/supabase-public.server")).createPublicClient();
import type { CartTotals, ResolvedCartLine } from "../../../Backend/src/lib/types";

const lineSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const resolveSchema = z.object({
  lines: z.array(lineSchema).max(40),
  couponCode: z.string().max(40).optional().nullable(),
});

export type ResolveCartInput = z.infer<typeof resolveSchema>;

export function calculateShipping(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= siteConfig.shipping.freeShippingThreshold
    ? 0
    : siteConfig.shipping.flatFee;
}

/**
 * Server-side cart pricing. Prices, stock and discounts are read from the
 * database — never trusted from the browser.
 */
export async function resolveCartServer(
  input: ResolveCartInput,
  userId?: string,
): Promise<CartTotals> {
  const empty: CartTotals = {
    lines: [],
    subtotal: 0,
    discount: 0,
    shippingFee: 0,
    total: 0,
    couponCode: null,
    couponError: null,
  };
  if (!input.lines.length) return empty;

  const supabase = await getPublicClient();
  const variantIds = input.lines.map((l) => l.variantId);

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      `id, sku, price, stock_quantity, active, product_id,
       size:sizes ( name ), color:colors ( name ),
       product:products!product_variants_product_id_fkey (
         id, name, slug, base_price, sale_price, published,
         images:product_images ( image_url, is_primary, sort_order )
       )`,
    )
    .in("id", variantIds);
  if (error) throw new Error(error.message);

  const lines: ResolvedCartLine[] = [];
  for (const line of input.lines) {
    const v = (variants ?? []).find((x: any) => x.id === line.variantId) as any;
    if (!v || !v.active || !v.product?.published) continue;
    const unitPrice = Number(v.price ?? v.product.sale_price ?? v.product.base_price);
    const quantity = Math.min(line.quantity, Math.max(v.stock_quantity, 0));
    if (quantity < 1) continue;
    const image =
      [...(v.product.images ?? [])].sort(
        (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      )[0]?.image_url ?? null;

    lines.push({
      variantId: v.id,
      quantity,
      sku: v.sku,
      productId: v.product.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      imageUrl: image,
      sizeName: v.size?.name ?? null,
      colorName: v.color?.name ?? null,
      unitPrice,
      stockQuantity: v.stock_quantity,
      lineTotal: unitPrice * quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;

  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const result = await validateCouponServer(code, subtotal, userId);
    if (result.ok) {
      discount = result.discount;
      couponCode = code;
    } else {
      couponError = result.error;
    }
  }

  const afterDiscount = Math.max(subtotal - discount, 0);
  const shippingFee = calculateShipping(afterDiscount);

  return {
    lines,
    subtotal,
    discount,
    shippingFee,
    total: afterDiscount + shippingFee,
    couponCode,
    couponError,
  };
}

type CouponResult = { ok: true; discount: number } | { ok: false; error: string };

/** Coupon rules are enforced server-side only. */
export async function validateCouponServer(
  code: string,
  subtotal: number,
  userId?: string,
): Promise<CouponResult> {
  const supabase = await getPublicClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, max_discount, min_order_value, expires_at, active, usage_limit, per_user_limit, times_used",
    )
    .eq("code", code)
    .maybeSingle();

  if (!coupon || !coupon.active) return { ok: false, error: "That code isn't valid." };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { ok: false, error: "That code has expired." };
  if (subtotal < Number(coupon.min_order_value))
    return {
      ok: false,
      error: `Valid on orders above ₹${Number(coupon.min_order_value).toLocaleString("en-IN")}.`,
    };
  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit)
    return { ok: false, error: "That code has been fully redeemed." };

  if (userId && coupon.per_user_limit !== null) {
    const { count } = await supabase
      .from("coupon_usages")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);
    if ((count ?? 0) >= coupon.per_user_limit)
      return { ok: false, error: "You've already used that code." };
  }

  let discount =
    coupon.discount_type === "percentage"
      ? (subtotal * Number(coupon.discount_value)) / 100
      : Number(coupon.discount_value);
  if (coupon.max_discount !== null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(Math.round(discount), subtotal);

  return { ok: true, discount };
}

export const resolveCart = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => resolveSchema.parse(data))
  .handler(async ({ data }) => resolveCartServer(data));

/* ------------------------- authenticated cart ------------------------- */

export const loadServerCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: cart } = await supabase
      .from("carts")
      .select("id, items:cart_items ( variant_id, quantity )")
      .eq("user_id", userId)
      .maybeSingle();
    return ((cart?.items ?? []) as any[]).map((i) => ({
      variantId: i.variant_id as string,
      quantity: i.quantity as number,
    }));
  });

export const saveServerCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ lines: z.array(lineSchema).max(40) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let cartId: string | undefined;
    const { data: existing } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      cartId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      cartId = created.id;
    }

    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    if (data.lines.length) {
      const { error } = await supabase.from("cart_items").insert(
        data.lines.map((l) => ({
          cart_id: cartId!,
          variant_id: l.variantId,
          quantity: l.quantity,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
