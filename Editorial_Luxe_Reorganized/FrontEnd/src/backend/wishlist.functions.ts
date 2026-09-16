import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "../../../Backend/src/integrations/supabase/auth-middleware";

async function ensureWishlist(supabase: any, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

export const loadServerWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("wishlists")
      .select("id, items:wishlist_items ( product_id )")
      .eq("user_id", userId)
      .maybeSingle();
    return ((data?.items ?? []) as any[]).map((i) => i.product_id as string);
  });

export const saveServerWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ productIds: z.array(z.string().uuid()).max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const wishlistId = await ensureWishlist(supabase, userId);
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId);
    const unique = [...new Set(data.productIds)];
    if (unique.length) {
      const { error } = await supabase
        .from("wishlist_items")
        .insert(unique.map((product_id) => ({ wishlist_id: wishlistId, product_id })));
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
