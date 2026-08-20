"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";

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
  const { error } = await supabase.from("services").insert({
    shop_id: currentStaff.shop_id,
    name: parsed.name,
    duration_minutes: parsed.durationMinutes,
    price: input.price ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/hizmetler");
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
  revalidatePath("/admin/hizmetler");
}

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  const parsedId = z.string().uuid().parse(id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", parsedId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/hizmetler");
}
