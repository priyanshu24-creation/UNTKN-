import logoAsset from "@/assets/untkn-logo.png.asset.json";

/**
 * Single source of truth for brand identity.
 * Rebranding the storefront should require edits only in this file
 * (plus the logo asset it points at).
 */
export const siteConfig = {
  brand: {
    name: "UNTKN",
    wordmark: "UNTKN",
    logoUrl: logoAsset.url,
    tagline: "Unspoken by design",
    shortDescription:
      "An independent streetwear label from India. Heavyweight thermals, hand-drawn graphics, made in short runs.",
  },

  contact: {
    email: "studio@untkn.in",
    phone: "+91 90000 00000",
    supportHours: "Mon–Sat, 10:00–18:00 IST",
    addressLines: ["UNTKN Studio", "Kolkata, West Bengal", "India"],
  },

  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "YouTube", href: "https://youtube.com" },
  ],

  commerce: {
    currency: "INR",
    currencySymbol: "₹",
    locale: "en-IN",
    country: "India",
    countryCode: "IN",
  },

  shipping: {
    flatFee: 149,
    freeShippingThreshold: 2999,
    estimatedDelivery: "3–6 working days",
    returnsWindowDays: 7,
    note: "Dispatched from Kolkata. Free shipping on orders above ₹2,999.",
  },

  seo: {
    titleSuffix: "UNTKN",
    defaultTitle: "UNTKN — Independent Streetwear Label",
    defaultDescription:
      "Heavyweight thermals and hand-drawn graphics in short runs. Shop the UNTKN collection.",
  },

  nav: {
    primary: [
      { label: "Shop", to: "/shop" },
      { label: "Collections", to: "/collections" },
      { label: "Lookbook", to: "/lookbook" },
      { label: "About", to: "/about" },
    ],
    footer: {
      shop: [
        { label: "All Products", to: "/shop" },
        { label: "New Arrivals", to: "/shop?sort=newest" },
        { label: "Collections", to: "/collections" },
        { label: "Lookbook", to: "/lookbook" },
      ],
      company: [
        { label: "About", to: "/about" },
        { label: "Contact", to: "/contact" },
      ],
      help: [
        { label: "Shipping", to: "/shipping" },
        { label: "Returns", to: "/returns" },
        { label: "Privacy", to: "/privacy" },
        { label: "Terms", to: "/terms" },
      ],
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
