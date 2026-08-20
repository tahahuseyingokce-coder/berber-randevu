import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingEvent } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

/** Bu kadar saat içinde başlayacak randevular için hatırlatma gönderilir. */
const REMINDER_WINDOW_HOURS = 36;

type PendingReminder = {
  id: string;
  cancel_token: string;
  starts_at: string;
};

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yapılandırma hatası." },
      { status: 503 },
    );
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  // Geçmiş randevular dışarıda kalsın diye alt sınır da veriliyor.
  // Cron bir çalışmayı kaçırsa bile pencere içindeki randevular yakalanır.
  const { data, error } = await supabase
    .from("appointments")
    .select("id, cancel_token, starts_at")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString())
    .order("starts_at");

  if (error) {
    console.error("[cron/hatirlatma] Randevular okunamadı:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = (data ?? []) as PendingReminder[];
  let sent = 0;
  let failed = 0;

  for (const appointment of pending) {
    try {
      // Önce işaretle, sonra gönder: cron çakışırsa aynı randevu iki kez
      // alınmaz. Gönderim başarısız olursa işaret geri alınır.
      const { data: claimed, error: claimError } = await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id)
        .is("reminder_sent_at", null)
        .select("id")
        .maybeSingle();

      if (claimError || !claimed) continue; // Başka bir çalışma zaten üstlendi.

      await notifyBookingEvent(supabase, appointment.cancel_token, "reminder");
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[cron/hatirlatma] ${appointment.id} için hata:`, err);
      await supabase
        .from("appointments")
        .update({ reminder_sent_at: null })
        .eq("id", appointment.id);
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: pending.length,
    sent,
    failed,
  });
}
