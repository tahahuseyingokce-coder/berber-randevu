import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service role client — SADECE server tarafında (server action/route) ve
 * SADECE owner yetkisi doğrulandıktan sonra kullanılır (ör. Supabase Auth'ta
 * gerçek çalışan hesabı oluşturmak için). RLS'i bypass eder.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil. Bu anahtarı Supabase Dashboard → Project Settings → API'den alıp .env.local dosyasına ekleyin.",
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
