import { siteConfig } from "@/config/site";

const formatter = new Intl.NumberFormat(siteConfig.commerce.locale, {
  style: "currency",
  currency: siteConfig.commerce.currency,
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return formatter.format(0);
  return formatter.format(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(siteConfig.commerce.locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
