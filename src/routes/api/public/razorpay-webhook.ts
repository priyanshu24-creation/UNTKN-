import { createFileRoute } from "@tanstack/react-router";

import { markOrderPaymentFailed, settleOrderPaid } from "@/lib/orders.functions";
import { verifyWebhookSignature } from "@/lib/razorpay.server";

/**
 * Razorpay webhook. Every request is signature-verified before anything is
 * read from it, and settlement is idempotent so retries are harmless.
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature");

        if (!(await verifyWebhookSignature(rawBody, signature))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const entity = event?.payload?.payment?.entity;
        const providerOrderId: string | undefined = entity?.order_id;
        const providerPaymentId: string | undefined = entity?.id;
        const orderId: string | undefined = entity?.notes?.order_id;

        try {
          switch (event?.event) {
            case "payment.captured":
            case "order.paid": {
              if (!providerOrderId || !providerPaymentId) break;
              let resolvedOrderId = orderId;
              if (!resolvedOrderId) {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                const { data } = await supabaseAdmin
                  .from("payments")
                  .select("order_id")
                  .eq("provider_order_id", providerOrderId)
                  .maybeSingle();
                resolvedOrderId = data?.order_id;
              }
              if (!resolvedOrderId) break;
              await settleOrderPaid({
                orderId: resolvedOrderId,
                providerOrderId,
                providerPaymentId,
                rawEvent: event,
              });
              break;
            }
            case "payment.failed": {
              if (!providerOrderId) break;
              await markOrderPaymentFailed({
                providerOrderId,
                providerPaymentId: providerPaymentId ?? null,
                reason: entity?.error_description ?? "Payment failed",
                rawEvent: event,
              });
              break;
            }
            default:
              break;
          }
        } catch (error) {
          console.error("[razorpay-webhook]", error);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
