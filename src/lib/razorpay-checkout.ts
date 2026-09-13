/** Loads the Razorpay Checkout script once, on demand, in the browser. */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loader: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error("We couldn't reach the payment window. Check your connection and retry."));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export type CheckoutHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function openRazorpayCheckout(options: {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  customerName: string;
  email: string;
  phone: string;
  onSuccess: (response: CheckoutHandlerResponse) => void;
  onDismiss: () => void;
}): Promise<void> {
  await loadRazorpayCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("The payment window is unavailable.");

  const instance = new Razorpay({
    key: options.keyId,
    order_id: options.razorpayOrderId,
    amount: Math.round(options.amount * 100),
    currency: options.currency,
    name: options.name,
    description: options.description,
    prefill: {
      name: options.customerName,
      email: options.email,
      contact: options.phone,
    },
    theme: { color: "#111111" },
    handler: (response: CheckoutHandlerResponse) => options.onSuccess(response),
    modal: { ondismiss: () => options.onDismiss() },
  });

  instance.open();
}
