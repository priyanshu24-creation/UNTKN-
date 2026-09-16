/**
 * Razorpay REST helpers. The secret key is read inside these functions and
 * never leaves the server. No Razorpay npm package — plain fetch + Web Crypto.
 */

const API = "https://api.razorpay.com/v1";

export function razorpayKeyId(): string | null {
  return process.env["RAZORPAY_KEY_ID"] || null;
}

function credentials(): { keyId: string; keySecret: string } {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) {
    throw new Error(
      "Payments are not configured yet. Add the Razorpay key id and secret to enable checkout.",
    );
  }
  return { keyId, keySecret };
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

/** Amount is in major units (rupees); Razorpay expects the smallest unit. */
export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
    },
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });

  const payload = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(payload?.error?.description || "The payment provider rejected this order.");
  }
  return payload as RazorpayOrder;
}

/** Checkout callback signature: HMAC(order_id|payment_id, key_secret). */
export async function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<boolean> {
  const { keySecret } = credentials();
  const expected = await hmacSha256Hex(
    keySecret,
    `${input.razorpayOrderId}|${input.razorpayPaymentId}`,
  );
  return timingSafeEqual(expected, input.signature);
}

/** Webhook signature: HMAC(raw body, webhook secret). */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  return timingSafeEqual(await hmacSha256Hex(secret, rawBody), signature);
}

export async function fetchRazorpayPayment(paymentId: string): Promise<any> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  });
  const payload = (await response.json()) as any;
  if (!response.ok) throw new Error(payload?.error?.description || "Payment lookup failed.");
  return payload;
}
