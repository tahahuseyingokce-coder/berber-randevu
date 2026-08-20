"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notifyBookingEvent } from "@/lib/email/notify";

const schema = z.object({
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(7),
  customerEmail: z.string().email(),
});

export type CreateManualAppointmentInput = z.infer<typeof schema>;

export async function createManualAppointmentAction(input: CreateManualAppointmentInput) {
  const parsed = schema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_appointment", {
    p_shop_id: currentStaff.shop_id,
    p_staff_id: parsed.staffId,
    p_service_id: parsed.serviceId,
    p_customer_name: parsed.customerName,
    p_customer_phone: parsed.customerPhone,
    p_customer_email: parsed.customerEmail,
    p_starts_at: parsed.startsAt,
    p_status: "confirmed",
    p_source: "manual",
    p_created_by_staff_id: currentStaff.id,
  });

  if (error) throw new Error(error.message);

  const appointment = data as { id: string; cancel_token: string } | null;

  if (appointment) {
    await logAudit(supabase, "appointment.created_manually", "appointment", appointment.id, {
      customer_name: parsed.customerName,
    });
    // Manuel randevu otomatik onaylı olduğundan müşteriye doğrudan onay maili gider.
    await notifyBookingEvent(supabase, appointment.cancel_token, "confirmed");
  }

  revalidatePath("/admin/randevular");
  revalidatePath("/admin");
  revalidatePath("/admin/takvim");
}
