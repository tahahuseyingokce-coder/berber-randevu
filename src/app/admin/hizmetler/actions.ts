"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  price: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
});

export async function createServiceAction(input: {
  name: string;
  durationMinutes: number;
  price: number | null;
}) {
  const parsed = serviceSchema.parse({
    name: input.name,
    durationMinutes: input.durationMinutes,
    price: input.price ?? "",
  });
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      shop_id: currentStaff.shop_id,
      name: parsed.name,
      duration_minutes: parsed.durationMinutes,
      price: input.price ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, "service.created", "service", data.id, { name: parsed.name });

  revalidatePath("/admin/hizmetler");
  revalidatePath("/hizmetler");
  revalidatePath("/");
}

export async function updateServiceAction(input: {
  id: string;
  name: string;
  durationMinutes: number;
  price: number | null;
}) {
  const id = z.string().uuid().parse(input.id);
  const parsed = serviceSchema.parse({
    name: input.name,
    durationMinutes: input.durationMinutes,
    price: input.price ?? "",
  });

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.name,
      duration_minutes: parsed.durationMinutes,
      price: input.price ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "service.updated", "service", id, { name: parsed.name });

  revalidatePath("/admin/hizmetler");
  revalidatePath("/hizmetler");
  revalidatePath("/");
}

/**
 * Hizmeti kalıcı olarak siler.
 *
 * Randevusu olan hizmet silinemez: `appointments.service_id` kısıtı
 * engeller ve zaten engellemeliydi — geçmiş randevunun hangi hizmet
 * olduğu kaybolursa ciro ve müşteri geçmişi anlamsızlaşır. Bu durumda
 * doğru işlem "Pasifleştir": hizmet randevu formundan kalkar, geçmiş
 * durur.
 */
export async function deleteServiceAction(id: string) {
  const parsedId = z.string().uuid().parse(id);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff || currentStaff.role !== "owner") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("service_id", parsedId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      `Bu hizmet ${count} randevuda kullanılmış, silinemez. Listeden kaldırmak için "Pasifleştir" deyin.`,
    );
  }

  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", parsedId)
    .select("id, name");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Hizmet bulunamadı veya silme yetkiniz yok.");

  await logAudit(supabase, "service.deleted", "service", parsedId, { name: data[0].name });

  revalidatePath("/admin/hizmetler");
  revalidatePath("/hizmetler");
  revalidatePath("/");
}

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  const parsedId = z.string().uuid().parse(id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", parsedId);

  if (error) throw new Error(error.message);

  await logAudit(
    supabase,
    isActive ? "service.activated" : "service.deactivated",
    "service",
    parsedId,
  );

  revalidatePath("/admin/hizmetler");
  revalidatePath("/hizmetler");
  revalidatePath("/");
}
