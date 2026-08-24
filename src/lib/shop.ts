import { createPublicClient } from "@/lib/supabase/public";
import type { Service, Shop, ShopHour, Staff } from "@/lib/types";

/**
 * Bu şablondan her müşteri için ayrı bir Supabase projesi deploy edilir,
 * yani veritabanında her zaman tek bir dükkan satırı vardır.
 */
export async function getShop(): Promise<Shop> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("shops").select("*").limit(1).single();

  if (error || !data) {
    throw new Error("Dükkan bilgisi bulunamadı. Supabase'de bir shop kaydı olduğundan emin olun.");
  }

  return data;
}

export async function getShopHours(shopId: string): Promise<ShopHour[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shop_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("shop_id", shopId)
    .order("day_of_week");

  if (error) throw error;
  return data ?? [];
}

export async function getActiveServices(shopId: string): Promise<Service[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getActiveStaff(shopId: string): Promise<Staff[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name, photo_path, title, bio")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}
