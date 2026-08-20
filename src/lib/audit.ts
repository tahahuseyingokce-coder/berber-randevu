import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Denetim kaydı atar. Aktör (hangi personel) sunucu tarafında auth.uid()'den
 * çözülür — uygulama bunu belirleyemez.
 *
 * Log yazımı asıl işlemi bloke etmemelidir: hata yalnızca loglanır.
 */
export async function logAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_audit_event", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId ?? null,
      p_metadata: metadata,
    });

    if (error) {
      console.error(`[audit] "${action}" kaydedilemedi:`, error.message);
    }
  } catch (err) {
    console.error(`[audit] "${action}" kaydedilirken beklenmeyen hata:`, err);
  }
}
