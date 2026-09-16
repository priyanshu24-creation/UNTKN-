/** Where the confirmation handoff (order id + email) is kept between pages. */
export const CONFIRMATION_KEY = "untkn.order.confirmation";

export type ConfirmationHandoff = { orderId: string; email: string };

export function readConfirmationHandoff(): ConfirmationHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CONFIRMATION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.orderId === "string" && typeof parsed.email === "string") {
      return parsed as ConfirmationHandoff;
    }
  } catch {
    return null;
  }
  return null;
}
