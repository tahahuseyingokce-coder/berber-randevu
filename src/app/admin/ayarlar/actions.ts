"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const shopSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  cutoffHours: z.coerce.number().int().min(0).max(72),
});

export async function updateShopSettingsAction(input: {
  name: string;
  phone: string;
  address: string;
  cutoffHours: number;
}) {
  const parsed = shopSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("shops")
    .update({
      name: parsed.name,
      phone: parsed.phone || null,
      address: parsed.address || null,
      cutoff_hours: parsed.cutoffHours,
    })
    .eq("id", currentStaff.shop_id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop.settings_updated", "shop", currentStaff.shop_id, {
    cutoff_hours: parsed.cutoffHours,
  });

  revalidatePath("/admin/ayarlar");
  revalidatePath("/");
  revalidatePath("/iletisim");
}

const hourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  opensAt: z.string().optional(),
  closesAt: z.string().optional(),
});

export async function updateShopHourAction(input: {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
}) {
  const parsed = hourSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_hours")
    .update({
      is_closed: parsed.isClosed,
      opens_at: parsed.isClosed ? null : parsed.opensAt || null,
      closes_at: parsed.isClosed ? null : parsed.closesAt || null,
    })
    .eq("shop_id", currentStaff.shop_id)
    .eq("day_of_week", parsed.dayOfWeek);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/ayarlar");
  revalidatePath("/");
  revalidatePath("/iletisim");
}
