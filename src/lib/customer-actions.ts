"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listCustomerNotes } from "@/lib/panel-data";

export async function getCustomerNotesAction(customerId: string) {
  const id = z.string().uuid().parse(customerId);
  const supabase = await createClient();
  return listCustomerNotes(supabase, id);
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

  revalidatePath("/admin/musteriler");
  revalidatePath("/personel/musteriler");
}
