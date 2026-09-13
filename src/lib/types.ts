export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  price: number | null;
  stock_quantity: number;
  active: boolean;
  size: { id: string; name: string; sort_order: number } | null;
  color: { id: string; name: string; hex_code: string | null } | null;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  base_price: number;
  sale_price: number | null;
  featured: boolean;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  in_stock: boolean;
};

export type ProductDetail = ProductSummary & {
  description: string | null;
  materials: string | null;
  care_instructions: string | null;
  seo_title: string | null;
  seo_description: string | null;
  currency: string;
  variants: ProductVariant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type HomepageSection = {
  section_key: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  secondary_image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  secondary_cta_label: string | null;
  secondary_cta_href: string | null;
};

export type LookbookItem = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  span: string;
  product: { slug: string; name: string } | null;
};

export type CartLine = {
  variantId: string;
  quantity: number;
};

export type ResolvedCartLine = {
  variantId: string;
  quantity: number;
  sku: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  sizeName: string | null;
  colorName: string | null;
  unitPrice: number;
  stockQuantity: number;
  lineTotal: number;
};

export type CartTotals = {
  lines: ResolvedCartLine[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
};

export type ShippingAddressSnapshot = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
};

export type OrderItemSummary = {
  id: string;
  product_name_snapshot: string;
  product_slug_snapshot: string | null;
  sku_snapshot: string | null;
  size_snapshot: string | null;
  color_snapshot: string | null;
  image_url_snapshot: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  shipping_address_snapshot: ShippingAddressSnapshot | null;
  items: OrderItemSummary[];
};



export const PRODUCT_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "featured",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];
