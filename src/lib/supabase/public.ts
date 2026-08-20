import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Auth gerektirmeyen genel-okunabilir veriler (dükkan, hizmetler, çalışanlar,
 * müsaitlik) ve RPC çağrıları için — cookie/session bağımlılığı yok, statik
 * sayfa üretiminde de kullanılabilir.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
