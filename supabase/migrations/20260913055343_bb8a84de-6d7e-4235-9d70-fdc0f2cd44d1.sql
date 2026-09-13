-- ============================================================
-- Migration: initial schema
-- Repaired to be idempotent against an existing database.
--
-- Strategy per object type:
--   ENUM types        : DO $$ block checks pg_type before ALTER ADD VALUE
--   Functions         : CREATE OR REPLACE (always safe)
--   Tables            : CREATE TABLE IF NOT EXISTS
--   Indexes           : CREATE INDEX IF NOT EXISTS
--   Sequences         : CREATE SEQUENCE IF NOT EXISTS
--   Triggers          : DROP TRIGGER IF EXISTS + CREATE
--   Policies          : DROP POLICY IF EXISTS  + CREATE
--   GRANT/REVOKE      : idempotent by nature
--   ALTER TABLE … RLS : idempotent (Postgres silently no-ops if already set)
-- ============================================================

-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ enum types ============
-- PostgreSQL has no CREATE TYPE IF NOT EXISTS, so we use DO blocks.
-- We also never DROP+RECREATE enums because columns may depend on them.
-- Instead we ADD only the values that are missing.

DO $$ BEGIN
  -- app_role
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('customer','admin','manager','editor');
  ELSE
    -- Safely add any missing values (ALTER TYPE ADD VALUE is idempotent in PG 9.6+
    -- when using IF NOT EXISTS, available since PG 12)
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'customer') THEN
      ALTER TYPE public.app_role ADD VALUE 'customer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin') THEN
      ALTER TYPE public.app_role ADD VALUE 'admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'manager') THEN
      ALTER TYPE public.app_role ADD VALUE 'manager';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'editor') THEN
      ALTER TYPE public.app_role ADD VALUE 'editor';
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  -- order_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','cancelled','refunded');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'pending') THEN
      ALTER TYPE public.order_status ADD VALUE 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'confirmed') THEN
      ALTER TYPE public.order_status ADD VALUE 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'processing') THEN
      ALTER TYPE public.order_status ADD VALUE 'processing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'shipped') THEN
      ALTER TYPE public.order_status ADD VALUE 'shipped';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'delivered') THEN
      ALTER TYPE public.order_status ADD VALUE 'delivered';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'cancelled') THEN
      ALTER TYPE public.order_status ADD VALUE 'cancelled';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'order_status' AND e.enumlabel = 'refunded') THEN
      ALTER TYPE public.order_status ADD VALUE 'refunded';
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  -- payment_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.payment_status AS ENUM ('created','pending','authorized','captured','failed','cancelled','refunded');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'created') THEN
      ALTER TYPE public.payment_status ADD VALUE 'created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'pending') THEN
      ALTER TYPE public.payment_status ADD VALUE 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'authorized') THEN
      ALTER TYPE public.payment_status ADD VALUE 'authorized';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'captured') THEN
      ALTER TYPE public.payment_status ADD VALUE 'captured';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'failed') THEN
      ALTER TYPE public.payment_status ADD VALUE 'failed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'cancelled') THEN
      ALTER TYPE public.payment_status ADD VALUE 'cancelled';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'payment_status' AND e.enumlabel = 'refunded') THEN
      ALTER TYPE public.payment_status ADD VALUE 'refunded';
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  -- discount_type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.discount_type AS ENUM ('percentage','fixed');
  ELSE
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'discount_type' AND e.enumlabel = 'percentage') THEN
      ALTER TYPE public.discount_type ADD VALUE 'percentage';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'discount_type' AND e.enumlabel = 'fixed') THEN
      ALTER TYPE public.discount_type ADD VALUE 'fixed';
    END IF;
  END IF;
END $$;

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ roles ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role: role check via user_roles table (never email shortcut)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- is_admin: admin/manager check via user_roles table (never email shortcut)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','manager'));
$$;

-- profiles policies
DROP POLICY IF EXISTS "own profile read"   ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile read"   ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles policies
DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- new-user trigger (auto-creates profile + customer role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ catalogue ============
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories public read"  ON public.categories;
DROP POLICY IF EXISTS "categories admin write"  ON public.categories;
CREATE POLICY "categories public read"  ON public.categories FOR SELECT TO anon, authenticated USING (active OR public.is_admin());
CREATE POLICY "categories admin write"  ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_categories_updated ON public.categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.sizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sizes TO authenticated;
GRANT ALL ON public.sizes TO service_role;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sizes public read"  ON public.sizes;
DROP POLICY IF EXISTS "sizes admin write"  ON public.sizes;
CREATE POLICY "sizes public read"  ON public.sizes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sizes admin write"  ON public.sizes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.colors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.colors TO authenticated;
GRANT ALL ON public.colors TO service_role;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colors public read"  ON public.colors;
DROP POLICY IF EXISTS "colors admin write"  ON public.colors;
CREATE POLICY "colors public read"  ON public.colors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "colors admin write"  ON public.colors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  sale_price NUMERIC(12,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  materials TEXT,
  care_instructions TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(published);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON public.products(featured);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products public read"  ON public.products;
DROP POLICY IF EXISTS "products admin write"  ON public.products;
CREATE POLICY "products public read"  ON public.products FOR SELECT TO anon, authenticated USING (published OR public.is_admin());
CREATE POLICY "products admin write"  ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product images public read"  ON public.product_images;
DROP POLICY IF EXISTS "product images admin write"  ON public.product_images;
CREATE POLICY "product images public read"  ON public.product_images FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.published OR public.is_admin()))
);
CREATE POLICY "product images admin write"  ON public.product_images FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  size_id UUID REFERENCES public.sizes(id) ON DELETE RESTRICT,
  color_id UUID REFERENCES public.colors(id) ON DELETE RESTRICT,
  price NUMERIC(12,2) CHECK (price IS NULL OR price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, size_id, color_id)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "variants public read"  ON public.product_variants;
DROP POLICY IF EXISTS "variants admin write"  ON public.product_variants;
CREATE POLICY "variants public read"  ON public.product_variants FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.published OR public.is_admin()))
  AND (active OR public.is_admin())
);
CREATE POLICY "variants admin write"  ON public.product_variants FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_variants_updated ON public.product_variants;
CREATE TRIGGER trg_variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ addresses ============
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  postal_code TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own addresses" ON public.addresses;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_addresses_updated ON public.addresses;
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ cart ============
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own cart" ON public.carts;
CREATE POLICY "own cart" ON public.carts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_carts_updated ON public.carts;
CREATE TRIGGER trg_carts_updated BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own cart items" ON public.cart_items;
CREATE POLICY "own cart items" ON public.cart_items FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_cart_items_updated ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ wishlist ============
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own wishlist" ON public.wishlists;
CREATE POLICY "own wishlist" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wishlist_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own wishlist items" ON public.wishlist_items;
CREATE POLICY "own wishlist items" ON public.wishlist_items FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid()));

-- ============ coupons ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type public.discount_type NOT NULL,
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  max_discount NUMERIC(12,2),
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  per_user_limit INTEGER DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons admin only" ON public.coupons;
CREATE POLICY "coupons admin only" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_coupons_updated ON public.coupons;
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ orders ============
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('UN-' || to_char(now(),'YYMM') || '-' || nextval('public.order_number_seq')),
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'created',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  coupon_code TEXT,
  shipping_address_snapshot JSONB,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  inventory_committed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own orders read"     ON public.orders;
DROP POLICY IF EXISTS "orders admin update" ON public.orders;
CREATE POLICY "own orders read"     ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  product_slug_snapshot TEXT,
  image_url_snapshot TEXT,
  sku_snapshot TEXT,
  size_snapshot TEXT,
  color_snapshot TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own order items read" ON public.order_items;
CREATE POLICY "own order items read" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.payment_status NOT NULL DEFAULT 'created',
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  raw_event JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_order ON public.payments(provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own payments read" ON public.payments;
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin()))
);
DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);
GRANT SELECT ON public.coupon_usages TO authenticated;
GRANT ALL ON public.coupon_usages TO service_role;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own coupon usage read" ON public.coupon_usages;
CREATE POLICY "own coupon usage read" ON public.coupon_usages FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ============ reviews ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews public read"  ON public.reviews;
DROP POLICY IF EXISTS "reviews own insert"   ON public.reviews;
DROP POLICY IF EXISTS "reviews own update"   ON public.reviews;
DROP POLICY IF EXISTS "reviews own delete"   ON public.reviews;
CREATE POLICY "reviews public read"  ON public.reviews FOR SELECT TO anon, authenticated USING (approved OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews own insert"   ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews own update"   ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews own delete"   ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
DROP TRIGGER IF EXISTS trg_reviews_updated ON public.reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ newsletter ============
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter anyone subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter admin read"       ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter admin write"      ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter admin delete"     ON public.newsletter_subscribers;
CREATE POLICY "newsletter anyone subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "newsletter admin read"       ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "newsletter admin write"      ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "newsletter admin delete"     ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.is_admin());

-- ============ content ============
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  eyebrow TEXT,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  image_url TEXT,
  secondary_image_url TEXT,
  cta_label TEXT,
  cta_href TEXT,
  secondary_cta_label TEXT,
  secondary_cta_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "homepage public read"  ON public.homepage_sections;
DROP POLICY IF EXISTS "homepage admin write"  ON public.homepage_sections;
CREATE POLICY "homepage public read"  ON public.homepage_sections FOR SELECT TO anon, authenticated USING (active OR public.is_admin());
CREATE POLICY "homepage admin write"  ON public.homepage_sections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_homepage_updated ON public.homepage_sections;
CREATE TRIGGER trg_homepage_updated BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.lookbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  span TEXT NOT NULL DEFAULT 'normal',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lookbook_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lookbook_items TO authenticated;
GRANT ALL ON public.lookbook_items TO service_role;
ALTER TABLE public.lookbook_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lookbook public read"  ON public.lookbook_items;
DROP POLICY IF EXISTS "lookbook admin write"  ON public.lookbook_items;
CREATE POLICY "lookbook public read"  ON public.lookbook_items FOR SELECT TO anon, authenticated USING (active OR public.is_admin());
CREATE POLICY "lookbook admin write"  ON public.lookbook_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_lookbook_updated ON public.lookbook_items;
CREATE TRIGGER trg_lookbook_updated BEFORE UPDATE ON public.lookbook_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings public read"  ON public.site_settings;
DROP POLICY IF EXISTS "settings admin write"  ON public.site_settings;
CREATE POLICY "settings public read"  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write"  ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_settings_updated ON public.site_settings;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs admin read" ON public.admin_activity_logs;
CREATE POLICY "logs admin read" ON public.admin_activity_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ============ inventory safety (server-only) ============
CREATE OR REPLACE FUNCTION public.commit_order_inventory(_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rec RECORD;
  updated INTEGER;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = _order_id AND inventory_committed = false FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  FOR rec IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
    UPDATE public.product_variants
      SET stock_quantity = stock_quantity - rec.quantity
      WHERE id = rec.variant_id AND stock_quantity >= rec.quantity;
    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated = 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK for variant %', rec.variant_id;
    END IF;
  END LOOP;

  UPDATE public.orders SET inventory_committed = true WHERE id = _order_id;
END; $$;
REVOKE ALL ON FUNCTION public.commit_order_inventory(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_order_inventory(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.release_order_inventory(_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec RECORD;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = _order_id AND inventory_committed = true FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  FOR rec IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
    UPDATE public.product_variants SET stock_quantity = stock_quantity + rec.quantity WHERE id = rec.variant_id;
  END LOOP;
  UPDATE public.orders SET inventory_committed = false WHERE id = _order_id;
END; $$;
REVOKE ALL ON FUNCTION public.release_order_inventory(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_inventory(UUID) TO service_role;