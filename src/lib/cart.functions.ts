import {
  createServerFn,
  createServerOnlyFn,
} from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "./supabase-public.server";
import type { CartTotals, ResolvedCartLine } from "./types";

const lineSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const resolveSchema = z.object({
  lines: z.array(lineSchema).max(40),
  couponCode: z.string().max(40).optional().nullable(),
});

export type ResolveCartInput = z.infer<typeof resolveSchema>;

export function calculateShipping(
  subtotalAfterDiscount: number,
): number {
  if (subtotalAfterDiscount <= 0) {
    return 0;
  }

  return subtotalAfterDiscount >=
    siteConfig.shipping.freeShippingThreshold
    ? 0
    : siteConfig.shipping.flatFee;
}

/**
 * Server-side cart pricing.
 *
 * Prices, stock and discounts are read from the database.
 * Values coming from the browser are never trusted.
 *
 * This function is intentionally server-only because it imports
 * the server-only Supabase client.
 */
export const resolveCartServer = createServerOnlyFn(
  async (
    input: ResolveCartInput,
    userId?: string,
  ): Promise<CartTotals> => {
    const empty: CartTotals = {
      lines: [],
      subtotal: 0,
      discount: 0,
      shippingFee: 0,
      total: 0,
      couponCode: null,
      couponError: null,
    };

    if (!input.lines.length) {
      return empty;
    }

    const supabase = createPublicClient();

    const variantIds = input.lines.map(
      (line) => line.variantId,
    );

    const { data: variants, error } = await supabase
      .from("product_variants")
      .select(
        `
          id,
          sku,
          price,
          stock_quantity,
          active,
          product_id,
          size:sizes (
            name
          ),
          color:colors (
            name
          ),
          product:products!product_variants_product_id_fkey (
            id,
            name,
            slug,
            base_price,
            sale_price,
            published,
            images:product_images (
              image_url,
              is_primary,
              sort_order
            )
          )
        `,
      )
      .in("id", variantIds);

    if (error) {
      throw new Error(error.message);
    }

    const lines: ResolvedCartLine[] = [];

    for (const line of input.lines) {
      const variant = (variants ?? []).find(
        (item: any) => item.id === line.variantId,
      ) as any;

      if (
        !variant ||
        !variant.active ||
        !variant.product?.published
      ) {
        continue;
      }

      const unitPrice = Number(
        variant.price ??
          variant.product.sale_price ??
          variant.product.base_price,
      );

      const quantity = Math.min(
        line.quantity,
        Math.max(Number(variant.stock_quantity ?? 0), 0),
      );

      if (quantity < 1) {
        continue;
      }

      const images = [...(variant.product.images ?? [])].sort(
        (a: any, b: any) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          Number(a.sort_order ?? 0) -
            Number(b.sort_order ?? 0),
      );

      const imageUrl = images[0]?.image_url ?? null;

      lines.push({
        variantId: variant.id,
        quantity,
        sku: variant.sku,
        productId: variant.product.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        imageUrl,
        sizeName: variant.size?.name ?? null,
        colorName: variant.color?.name ?? null,
        unitPrice,
        stockQuantity: Number(
          variant.stock_quantity ?? 0,
        ),
        lineTotal: unitPrice * quantity,
      });
    }

    const subtotal = lines.reduce(
      (sum, line) => sum + line.lineTotal,
      0,
    );

    let discount = 0;
    let couponCode: string | null = null;
    let couponError: string | null = null;

    const code = input.couponCode
      ?.trim()
      .toUpperCase();

    if (code) {
      const result = await validateCouponServer(
        code,
        subtotal,
        userId,
      );

      if (result.ok) {
        discount = result.discount;
        couponCode = code;
      } else {
        couponError = result.error;
      }
    }

    const afterDiscount = Math.max(
      subtotal - discount,
      0,
    );

    const shippingFee =
      calculateShipping(afterDiscount);

    return {
      lines,
      subtotal,
      discount,
      shippingFee,
      total: afterDiscount + shippingFee,
      couponCode,
      couponError,
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Coupon validation                                                          */
/* -------------------------------------------------------------------------- */

type CouponResult =
  | {
      ok: true;
      discount: number;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Coupon rules are enforced server-side only.
 *
 * This must remain a server-only function because it accesses
 * the Supabase database directly.
 */
export const validateCouponServer = createServerOnlyFn(
  async (
    code: string,
    subtotal: number,
    userId?: string,
  ): Promise<CouponResult> => {
    const supabase = createPublicClient();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select(
        `
          id,
          code,
          discount_type,
          discount_value,
          max_discount,
          min_order_value,
          expires_at,
          active,
          usage_limit,
          per_user_limit,
          times_used
        `,
      )
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!coupon || !coupon.active) {
      return {
        ok: false,
        error: "That code isn't valid.",
      };
    }

    if (
      coupon.expires_at &&
      new Date(coupon.expires_at) < new Date()
    ) {
      return {
        ok: false,
        error: "That code has expired.",
      };
    }

    if (
      subtotal < Number(coupon.min_order_value ?? 0)
    ) {
      return {
        ok: false,
        error: `Valid on orders above ₹${Number(
          coupon.min_order_value ?? 0,
        ).toLocaleString("en-IN")}.`,
      };
    }

    if (
      coupon.usage_limit !== null &&
      Number(coupon.times_used ?? 0) >=
        Number(coupon.usage_limit)
    ) {
      return {
        ok: false,
        error: "That code has been fully redeemed.",
      };
    }

    if (
      userId &&
      coupon.per_user_limit !== null
    ) {
      const { count, error: usageError } =
        await supabase
          .from("coupon_usages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("coupon_id", coupon.id)
          .eq("user_id", userId);

      if (usageError) {
        throw new Error(usageError.message);
      }

      if (
        (count ?? 0) >=
        Number(coupon.per_user_limit)
      ) {
        return {
          ok: false,
          error: "You've already used that code.",
        };
      }
    }

    let discount =
      coupon.discount_type === "percentage"
        ? (subtotal *
            Number(coupon.discount_value)) /
          100
        : Number(coupon.discount_value);

    if (coupon.max_discount !== null) {
      discount = Math.min(
        discount,
        Number(coupon.max_discount),
      );
    }

    discount = Math.min(
      Math.round(discount),
      subtotal,
    );

    return {
      ok: true,
      discount,
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Public cart resolution                                                     */
/* -------------------------------------------------------------------------- */

export const resolveCart = createServerFn({
  method: "POST",
})
  .validator(resolveSchema)
  .handler(async ({ data }) => {
    return resolveCartServer(data);
  });

/* -------------------------------------------------------------------------- */
/* Authenticated cart                                                          */
/* -------------------------------------------------------------------------- */

export const loadServerCart = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: cart, error } = await supabase
      .from("carts")
      .select(
        "id, items:cart_items ( variant_id, quantity )",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return ((cart?.items ?? []) as any[]).map(
      (item) => ({
        variantId: item.variant_id as string,
        quantity: item.quantity as number,
      }),
    );
  });

export const saveServerCart = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      lines: z
        .array(lineSchema)
        .max(40),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let cartId: string | undefined;

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      cartId = existing.id;
    } else {
      const {
        data: created,
        error: createError,
      } = await supabase
        .from("carts")
        .insert({
          user_id: userId,
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      cartId = created.id;
    }

    if (!cartId) {
      throw new Error(
        "Unable to create or load cart.",
      );
    }

    const { error: deleteError } =
      await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (data.lines.length) {
      const { error: insertError } =
        await supabase
          .from("cart_items")
          .insert(
            data.lines.map((line) => ({
              cart_id: cartId!,
              variant_id: line.variantId,
              quantity: line.quantity,
            })),
          );

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    return {
      ok: true,
    };
  });