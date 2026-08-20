"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

export async function confirmAppointmentAction(appointmentId: string) {
  const id = idSchema.parse(appointmentId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/randevular");
  revalidatePath("/personel/randevular");
  revalidatePath("/admin");
  revalidatePath("/personel");
}

export async function cancelAppointmentAsStaffAction(appointmentId: string) {
  const id = idSchema.parse(appointmentId);
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: id,
    p_by_customer: false,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/randevular");
  revalidatePath("/personel/randevular");
  revalidatePath("/admin");
  revalidatePath("/personel");
}
