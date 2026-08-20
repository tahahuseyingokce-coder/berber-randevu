"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listCustomerNotes } from "@/lib/panel-data";
import { logAudit } from "@/lib/audit";

export async function getCustomerNotesAction(customerId: string) {
  const id = z.string().uuid().parse(customerId);
  const supabase = await createClient();
  return listCustomerNotes(supabase, id);
}

/**
 * Müşterinin randevu geçmişi. RLS gereği çalışan yalnızca kendi randevularını
 * görür, owner ise müşterinin tüm geçmişini görür.
 */
export async function getCustomerHistoryAction(customerId: string) {
  const id = z.string().uuid().parse(customerId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, services(name), staff:staff!appointments_staff_id_fkey(full_name)",
    )
    .eq("customer_id", id)
    .order("starts_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}

const addNoteSchema = z.object({
  customerId: z.string().uuid(),
  note: z.string().trim().min(1).max(2000),
});

export async function addCustomerNoteAction(input: { customerId: string; note: string }) {
  const parsed = addNoteSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı.");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, shop_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!staff) throw new Error("Yetki bulunamadı.");

  const { error } = await supabase.from("customer_notes").insert({
    shop_id: staff.shop_id,
    customer_id: parsed.customerId,
    author_staff_id: staff.id,
    note: parsed.note,
  });

  if (error) throw new Error(error.message);

  await logAudit(supabase, "customer_note.added", "customer", parsed.customerId);

  revalidatePath("/admin/musteriler");
  revalidatePath("/personel/musteriler");
}
