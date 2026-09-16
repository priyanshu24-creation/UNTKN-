import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import { resolveCartServer } from "./cart.functions";
import type { OrderSummary } from "./types";

const lineSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const addressSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(2).max(100),
  postal_code: z.string().trim().min(3).max(20),
});

const checkoutSchema = z.object({
  email: z.string().trim().email(),
  lines: z.array(lineSchema).min(1).max(40),
  couponCode: z.string().max(40).optional().nullable(),
  address: addressSchema,
  notes: z.string().trim().max(500).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

/**
 * Creates the order from server-recalculated totals, then opens a Razorpay
 * order for it. Nothing about price, stock or discount is trusted from the
 * browser. Inventory is only committed once payment is verified.
 */
export const createCheckoutOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("../integrations/supabase/client.server");
    const { createRazorpayOrder, razorpayKeyId, razorpayConfigured } = await import(
      "./razorpay.server"
    );

    if (!razorpayConfigured()) {
      throw new Error(
        "Payments aren't switched on yet. Add the Razorpay keys and checkout will go live.",
      );
    }

    const totals = await resolveCartServer(
      { lines: data.lines, couponCode: data.couponCode ?? null },
      data.userId ?? undefined,
    );

    if (!totals.lines.length) {
      throw new Error("The items in your bag are no longer available.");
    }
    for (const line of totals.lines) {
      const requested = data.lines.find((l) => l.variantId === line.variantId)?.quantity ?? 0;
      if (requested > line.stockQuantity) {
        throw new Error(`Only ${line.stockQuantity} left of ${line.productName}.`);
      }
    }
    if (totals.couponError) throw new Error(totals.couponError);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: data.userId ?? null,
        status: "pending",
        payment_status: "created",
        currency: siteConfig.commerce.currency,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping_fee: totals.shippingFee,
        total: totals.total,
        coupon_code: totals.couponCode,
        customer_email: data.email,
        customer_name: data.address.full_name,
        customer_phone: data.address.phone,
        shipping_address_snapshot: data.address,
        notes: data.notes ?? null,
      })
      .select("id, order_number, total, currency")
      .single();
    if (orderError) throw new Error(orderError.message);

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      totals.lines.map((line) => ({
        order_id: order.id,
        variant_id: line.variantId,
        product_id: line.productId,
        product_name_snapshot: line.productName,
        product_slug_snapshot: line.productSlug,
        sku_snapshot: line.sku,
        size_snapshot: line.sizeName,
        color_snapshot: line.colorName,
        image_url_snapshot: line.imageUrl,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        total_price: line.lineTotal,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    const providerOrder = await createRazorpayOrder({
      amount: Number(order.total),
      currency: order.currency,
      receipt: order.order_number,
      notes: { order_id: order.id, order_number: order.order_number },
    });

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      provider: "razorpay",
      provider_order_id: providerOrder.id,
      amount: Number(order.total),
      currency: order.currency,
      status: "created",
    });

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: Number(order.total),
      currency: order.currency,
      email: data.email,
      customerName: data.address.full_name,
      customerPhone: data.address.phone,
      razorpayKeyId: razorpayKeyId()!,
      razorpayOrderId: providerOrder.id,
    };
  });

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  signature: z.string().min(8),
});

/**
 * Server-side signature verification. Only a verified signature captures the
 * payment, commits inventory and records coupon usage.
 */
export const verifyCheckoutPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("../integrations/supabase/client.server");
    const { verifyCheckoutSignature } = await import("./razorpay.server");

    const valid = await verifyCheckoutSignature({
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      signature: data.signature,
    });

    if (!valid) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          signature_verified: false,
          failure_reason: "Signature verification failed",
          provider_payment_id: data.razorpayPaymentId,
        })
        .eq("provider_order_id", data.razorpayOrderId);
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", data.orderId);
      throw new Error("We couldn't verify that payment. Nothing has been charged to your order.");
    }

    await settleOrderPaid({
      orderId: data.orderId,
      providerOrderId: data.razorpayOrderId,
      providerPaymentId: data.razorpayPaymentId,
      rawEvent: null,
    });

    const order = await loadOrder(data.orderId);
    if (!order) throw new Error("We couldn't find that order.");
    return order;
  });

/**
 * Idempotent settlement used by both the checkout callback and the webhook.
 */
export async function settleOrderPaid(input: {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  rawEvent: unknown;
}): Promise<void> {
  const { supabaseAdmin } = await import("../integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, coupon_code, inventory_committed, payment_status")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order) return;

  await supabaseAdmin
    .from("payments")
    .update({
      status: "captured",
      signature_verified: true,
      provider_payment_id: input.providerPaymentId,
      paid_at: new Date().toISOString(),
      failure_reason: null,
      ...(input.rawEvent ? { raw_event: input.rawEvent as never } : {}),
    })
    .eq("provider_order_id", input.providerOrderId);

  if (order.payment_status !== "captured") {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "captured", status: "confirmed" })
      .eq("id", order.id);
  }

  if (!order.inventory_committed) {
    // Decrements variant stock inside a transaction; never goes negative.
    const { error } = await supabaseAdmin.rpc("commit_order_inventory", {
      _order_id: order.id,
    } as never);
    if (error) throw new Error(error.message);
  }

  if (order.coupon_code) {
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("id, times_used")
      .eq("code", order.coupon_code)
      .maybeSingle();
    if (coupon) {
      const { data: existing } = await supabaseAdmin
        .from("coupon_usages")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();
      if (!existing) {
        await supabaseAdmin
          .from("coupon_usages")
          .insert({ coupon_id: coupon.id, order_id: order.id, user_id: order.user_id });
        await supabaseAdmin
          .from("coupons")
          .update({ times_used: (coupon.times_used ?? 0) + 1 })
          .eq("id", coupon.id);
      }
    }
  }
}

export async function markOrderPaymentFailed(input: {
  providerOrderId: string;
  reason: string | null;
  providerPaymentId?: string | null;
  rawEvent?: unknown;
}): Promise<void> {
  const { supabaseAdmin } = await import("../integrations/supabase/client.server");
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, order_id, status")
    .eq("provider_order_id", input.providerOrderId)
    .maybeSingle();
  if (!payment || payment.status === "captured") return;

  await supabaseAdmin
    .from("payments")
    .update({
      status: "failed",
      failure_reason: input.reason,
      ...(input.providerPaymentId ? { provider_payment_id: input.providerPaymentId } : {}),
      ...(input.rawEvent ? { raw_event: input.rawEvent as never } : {}),
    })
    .eq("id", payment.id);

  await supabaseAdmin
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", payment.order_id);
}

export async function loadOrder(orderId: string): Promise<OrderSummary | null> {
  const { supabaseAdmin } = await import("../integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select(
      `id, order_number, status, payment_status, currency, subtotal, discount, shipping_fee,
       total, coupon_code, customer_name, customer_email, customer_phone, created_at,
       shipping_address_snapshot,
       items:order_items ( id, product_name_snapshot, product_slug_snapshot, sku_snapshot,
         size_snapshot, color_snapshot, image_url_snapshot, quantity, unit_price, total_price )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  return (data as OrderSummary | null) ?? null;
}

/**
 * Confirmation lookup. Guests must match the email the order was placed with,
 * so an order id alone never exposes anyone's details.
 */
export const getOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ orderId: z.string().uuid(), email: z.string().trim().email() }).parse(data),
  )
  .handler(async ({ data }) => {
    const order = await loadOrder(data.orderId);
    if (!order) throw new Error("We couldn't find that order.");
    if ((order.customer_email ?? "").toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("We couldn't find that order.");
    }
    return order;
  });
