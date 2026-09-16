import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "../../../Backend/src/integrations/supabase/auth-middleware";

export type AccountProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type AccountAddress = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
};

export type AccountOrderSummary = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
  item_count: number;
};

export type AccountOrderDetail = AccountOrderSummary & {
  subtotal: number;
  discount: number;
  shipping_fee: number;
  coupon_code: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address_snapshot: Record<string, string | null> | null;
  items: {
    id: string;
    product_name_snapshot: string;
    product_slug_snapshot: string | null;
    image_url_snapshot: string | null;
    size_snapshot: string | null;
    color_snapshot: string | null;
    sku_snapshot: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
};

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(40).nullable().optional(),
  full_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).nullable().optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  postal_code: z.string().min(3).max(16),
  is_default: z.boolean().optional(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountProfile | null> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, phone, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(120).nullable(),
        phone: z.string().max(20).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountAddress[]> => {
    const { data, error } = await context.supabase
      .from("addresses")
      .select(
        "id, label, full_name, phone, line1, line2, city, state, country, postal_code, is_default",
      )
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => addressSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { id, is_default, ...fields } = data;
    const payload = {
      ...fields,
      label: fields.label ?? null,
      line2: fields.line2 ?? null,
      is_default: is_default ?? false,
      user_id: context.userId,
    };

    if (payload.is_default) {
      await context.supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", context.userId);
    }

    if (id) {
      const { error } = await context.supabase
        .from("addresses")
        .update(payload)
        .eq("id", id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }

    const { data: inserted, error } = await context.supabase
      .from("addresses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const deleteMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("addresses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountOrderSummary[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, currency, created_at, order_items(id)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      payment_status: o.payment_status,
      total: Number(o.total),
      currency: o.currency,
      created_at: o.created_at,
      item_count: (o.order_items ?? []).length,
    }));
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<AccountOrderDetail | null> => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select(
        `id, order_number, status, payment_status, subtotal, discount, shipping_fee, total,
         currency, coupon_code, customer_name, customer_email, customer_phone,
         shipping_address_snapshot, created_at,
         order_items (
           id, product_name_snapshot, product_slug_snapshot, image_url_snapshot,
           size_snapshot, color_snapshot, sku_snapshot, quantity, unit_price, total_price
         )`,
      )
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const items = (order.order_items ?? []).map((i) => ({
      ...i,
      unit_price: Number(i.unit_price),
      total_price: Number(i.total_price),
    }));

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping_fee: Number(order.shipping_fee),
      total: Number(order.total),
      currency: order.currency,
      coupon_code: order.coupon_code,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address_snapshot:
        (order.shipping_address_snapshot as Record<string, string | null> | null) ?? null,
      created_at: order.created_at,
      item_count: items.length,
      items,
    };
  });
