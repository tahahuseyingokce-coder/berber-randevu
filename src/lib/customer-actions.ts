"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listCustomerNotes, searchCustomers } from "@/lib/panel-data";
import { logAudit } from "@/lib/audit";

/**
 * Müşteri araması veritabanında yapılır: liste tümünü istemciye
 * indirip orada filtreleseydi müşteri sayısı arttıkça panel yavaşlardı.
 * Hangi müşterilerin görüneceğini RLS belirler.
 */
export async function searchCustomersAction(query: string) {
  const q = z.string().max(100).parse(query);
  const supabase = await createClient();
  return searchCustomers(supabase, q);
}

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

const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  note: z.string().trim().min(1).max(2000),
});

/**
 * Notu düzenler. Kimin hangi notu değiştirebileceğini RLS belirler
 * (sahip her notu, çalışan yalnızca kendi yazdığını) — burada ayrıca
 * kontrol edilmez, tek doğruluk kaynağı politikalar olsun diye.
 *
 * Etkilenen satır sayısı sıfırsa istek yetkiye takılmıştır: Postgres bu
 * durumda hata değil boş sonuç döner, sessizce başarılı görünmesin.
 */
export async function updateCustomerNoteAction(input: { noteId: string; note: string }) {
  const parsed = updateNoteSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_notes")
    .update({ note: parsed.note, updated_at: new Date().toISOString() })
    .eq("id", parsed.noteId)
    .select("id, customer_id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Bu notu düzenleme yetkiniz yok.");
  }

  await logAudit(supabase, "customer_note.updated", "customer", data[0].customer_id);

  revalidatePath("/admin/musteriler");
  revalidatePath("/personel/musteriler");
}

export async function deleteCustomerNoteAction(noteId: string) {
  const id = z.string().uuid().parse(noteId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_notes")
    .delete()
    .eq("id", id)
    .select("id, customer_id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Bu notu silme yetkiniz yok.");
  }

  await logAudit(supabase, "customer_note.deleted", "customer", data[0].customer_id);

  revalidatePath("/admin/musteriler");
  revalidatePath("/personel/musteriler");
}
