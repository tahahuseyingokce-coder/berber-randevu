"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { notifyBookingEvent } from "@/lib/email/notify";
import { logAudit } from "@/lib/audit";

const idSchema = z.string().uuid();

const PANEL_PATHS = ["/admin", "/admin/randevular", "/admin/takvim", "/personel", "/personel/randevular", "/personel/takvim"];

function revalidatePanels() {
  PANEL_PATHS.forEach((p) => revalidatePath(p));
}

/**
 * Randevunun cancel_token'ını okur. RLS gereği yalnızca randevuyu görebilen
 * personel (owner veya randevunun sahibi çalışan) bu değere ulaşabilir.
 */
async function getCancelToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  appointmentId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("appointments")
    .select("cancel_token")
    .eq("id", appointmentId)
    .maybeSingle();

  return data?.cancel_token ?? null;
}

export async function confirmAppointmentAction(appointmentId: string) {
  const id = idSchema.parse(appointmentId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, cancel_token")
    .maybeSingle();

  if (error) throw new Error(error.message);

  // Zaten onaylı/iptal edilmiş bir randevuda güncelleme satır döndürmez —
  // bu durumda bildirim ve log tekrarlanmaz.
  if (!data) {
    revalidatePanels();
    return;
  }

  await logAudit(supabase, "appointment.confirmed", "appointment", id);
  await notifyBookingEvent(supabase, data.cancel_token, "confirmed");

  revalidatePanels();
}

export async function cancelAppointmentAsStaffAction(appointmentId: string) {
  const id = idSchema.parse(appointmentId);
  const supabase = await createClient();

  // İptal sonrası join'ler değişmediği için token'ı önceden okumak yeterli.
  const cancelToken = await getCancelToken(supabase, id);

  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: id,
    p_by_customer: false,
  });

  if (error) throw new Error(error.message);

  await logAudit(supabase, "appointment.cancelled", "appointment", id);

  if (cancelToken) {
    await notifyBookingEvent(supabase, cancelToken, "cancelled_by_staff");
  }

  revalidatePanels();
}
