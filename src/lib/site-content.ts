import { createPublicClient } from "@/lib/supabase/public";
import type { ShopValue, SitePhoto } from "@/lib/types";

export async function getShopValues(shopId: string): Promise<ShopValue[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shop_values")
    .select("id, title, body, sort_order")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getSitePhotos(
  shopId: string,
  placement?: SitePhoto["placement"],
): Promise<SitePhoto[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("site_photos")
    .select("id, storage_path, alt, placement, sort_order")
    .eq("shop_id", shopId)
    .order("sort_order");

  if (placement) query = query.eq("placement", placement);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
