import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Field, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { ActionButton, ButtonLink } from "@/components/ui/EditorialButton";
import { siteConfig } from "@/config/site";
import { listMyAddresses } from "@/lib/account.functions";
import { formatPrice } from "@/lib/format";
import { createCheckoutOrder, verifyCheckoutPayment } from "@/lib/orders.functions";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { CONFIRMATION_KEY } from "@/lib/checkout-storage";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — UNTKN" },
      {
        name: "description",
        content: "Secure checkout for your UNTKN order: shipping details, order summary and payment.",
      },
      { property: "og:title", content: "Checkout — UNTKN" },
      { property: "og:description", content: "Secure checkout for your UNTKN order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Form = {
  email: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  notes: string;
};

const initialForm = (): Form => ({
  email: "",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: siteConfig.commerce.country,
  postal_code: "",
  notes: "",
});

type Stage = "form" | "paying" | "verifying" | "failed";

function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<Form>(initialForm);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  const savedAddresses = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => listMyAddresses(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email! }));
  }, [user?.email]);

  useEffect(() => {
    const preferred =
      savedAddresses.data?.find((a) => a.is_default) ?? savedAddresses.data?.[0] ?? null;
    if (!preferred) return;
    setForm((f) =>
      f.line1
        ? f
        : {
            ...f,
            full_name: preferred.full_name,
            phone: preferred.phone,
            line1: preferred.line1,
            line2: preferred.line2 ?? "",
            city: preferred.city,
            state: preferred.state,
            country: preferred.country,
            postal_code: preferred.postal_code,
          },
    );
  }, [savedAddresses.data]);

  const totals = cart.totals;
  const lines = totals?.lines ?? [];
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lines.length) return;

    setStage("paying");
    try {
      const order = await createCheckoutOrder({
        data: {
          email: form.email.trim(),
          lines: cart.lines,
          couponCode: totals?.couponCode ?? null,
          notes: form.notes.trim() || null,
          userId: user?.id ?? null,
          address: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || null,
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim(),
            postal_code: form.postal_code.trim(),
          },
        },
      });

      await openRazorpayCheckout({
        keyId: order.razorpayKeyId,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        name: siteConfig.brand.name,
        description: `Order ${order.orderNumber}`,
        customerName: order.customerName,
        email: order.email,
        phone: order.customerPhone,
        onDismiss: () => {
          setStage("failed");
          setError("The payment window was closed before the payment went through.");
        },
        onSuccess: async (response) => {
          setStage("verifying");
          try {
            await verifyCheckoutPayment({
              data: {
                orderId: order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            window.sessionStorage.setItem(
              CONFIRMATION_KEY,
              JSON.stringify({ orderId: order.orderId, email: order.email }),
            );
            cart.clear();
            navigate({ to: "/order-success", search: { order: order.orderId } });
          } catch (verifyError) {
            setStage("failed");
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "We couldn't confirm that payment.",
            );
          }
        },
      });
    } catch (createError) {
      setStage("failed");
      setError(
        createError instanceof Error
          ? createError.message
          : "We couldn't start the payment. Please try again.",
      );
    }
  }

  if (!lines.length) {
    return (
      <div className="shell pb-40 pt-28 md:pt-40">
        <h1 className="display-md">Checkout</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
          There&apos;s nothing in your bag to check out yet.
        </p>
        <ButtonLink to="/shop" variant="solid" size="lg" className="mt-8">
          Shop the collection
        </ButtonLink>
      </div>
    );
  }

  const busy = stage === "paying" || stage === "verifying";

  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="hairline-b pb-8">
        <p className="label-xs text-muted-foreground">Checkout</p>
        <h1 className="display-md mt-4">Shipping & payment</h1>
      </header>

      <div className="mt-12 grid gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-24">
        <form onSubmit={startPayment} className="space-y-12" noValidate>
          <section>
            <h2 className="label-xs text-muted-foreground">01 — Contact</h2>
            <div className="mt-6 space-y-5">
              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
              <Field
                label="Full name"
                required
                value={form.full_name}
                onChange={set("full_name")}
                autoComplete="name"
              />
              <Field
                label="Phone"
                required
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
              />
            </div>
          </section>

          <section>
            <h2 className="label-xs text-muted-foreground">02 — Shipping address</h2>
            <div className="mt-6 space-y-5">
              <Field
                label="Address line 1"
                required
                value={form.line1}
                onChange={set("line1")}
                autoComplete="address-line1"
              />
              <Field
                label="Address line 2"
                value={form.line2}
                onChange={set("line2")}
                autoComplete="address-line2"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="City"
                  required
                  value={form.city}
                  onChange={set("city")}
                  autoComplete="address-level2"
                />
                <Field
                  label="State"
                  required
                  value={form.state}
                  onChange={set("state")}
                  autoComplete="address-level1"
                />
                <Field
                  label="Postal code"
                  required
                  value={form.postal_code}
                  onChange={set("postal_code")}
                  autoComplete="postal-code"
                />
                <Field
                  label="Country"
                  required
                  value={form.country}
                  onChange={set("country")}
                  autoComplete="country-name"
                />
              </div>
              <Field
                label="Delivery notes (optional)"
                value={form.notes}
                onChange={set("notes")}
              />
            </div>
          </section>

          <section>
            <h2 className="label-xs text-muted-foreground">03 — Payment</h2>
            <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
              You&apos;ll pay in a secure Razorpay window. Card details never touch our servers, and
              your total is recalculated on our side before payment.
            </p>
            <FormError message={error} />
            <ActionButton type="submit" size="lg" className="mt-8" disabled={busy}>
              {stage === "verifying"
                ? "Confirming payment…"
                : stage === "paying"
                  ? "Opening payment…"
                  : stage === "failed"
                    ? "Retry payment"
                    : `Pay ${formatPrice(totals?.total ?? 0)}`}
            </ActionButton>
            <Link to="/cart" className="mt-6 block label-xs link-rule">
              Back to bag
            </Link>
          </section>
        </form>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="label-xs text-muted-foreground">Order summary</h2>
          <ul className="mt-6 divide-y divide-border">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-4 py-5">
                <div className="size-16 shrink-0 overflow-hidden bg-muted">
                  {line.imageUrl && <img src={line.imageUrl} alt="" className="photo" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm">{line.productName}</p>
                  <p className="mt-1 label-xs text-muted-foreground">
                    {[line.sizeName, line.colorName].filter(Boolean).join(" · ")} · ×{line.quantity}
                  </p>
                </div>
                <p className="font-sans text-sm tabular-nums">{formatPrice(line.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-border pt-6 font-sans text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(totals?.subtotal ?? 0)}</dd>
            </div>
            {(totals?.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Discount {totals?.couponCode ? `(${totals.couponCode})` : ""}
                </dt>
                <dd className="tabular-nums">− {formatPrice(totals?.discount ?? 0)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {totals?.shippingFee === 0 ? "Free" : formatPrice(totals?.shippingFee ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(totals?.total ?? 0)}</dd>
            </div>
          </dl>
          <p className="mt-4 label-xs text-muted-foreground">
            Estimated delivery {siteConfig.shipping.estimatedDelivery}.
          </p>
        </aside>
      </div>
    </div>
  );
}
