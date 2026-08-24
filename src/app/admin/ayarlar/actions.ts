"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { normalizeGoogleMapsUrl } from "@/lib/maps";

const shopSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  mapsUrl: z.string().trim().max(2000).optional(),
  cutoffHours: z.coerce.number().int().min(0).max(72),
});

export async function updateShopSettingsAction(input: {
  name: string;
  phone: string;
  address: string;
  mapsUrl: string;
  cutoffHours: number;
}) {
  const parsed = shopSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  // Sayfaya iframe olarak gömüleceği için yalnızca Google Haritalar
  // bağlantıları kabul edilir; geçersiz bağlantı sessizce yutulmaz.
  const mapsUrl = parsed.mapsUrl ? normalizeGoogleMapsUrl(parsed.mapsUrl) : null;
  if (parsed.mapsUrl && !mapsUrl) {
    throw new Error("Geçerli bir Google Haritalar bağlantısı girin.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shops")
    .update({
      name: parsed.name,
      phone: parsed.phone || null,
      address: parsed.address || null,
      maps_url: mapsUrl,
      cutoff_hours: parsed.cutoffHours,
    })
    .eq("id", currentStaff.shop_id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop.settings_updated", "shop", currentStaff.shop_id, {
    cutoff_hours: parsed.cutoffHours,
  });

  // Dükkan adı ve telefonu her sayfanın header/footer'ında. Tek tek sayfa
  // yenilemek yetmiyor: production'da sayfalar statik üretildiği için isim
  // değişince /hizmetler, /galeri, /hakkimizda eski isimle kalıyordu.
  // "layout" kökten aşağısının tamamını yeniler.
  //
  // Not: bu davranış yalnızca production build'de görülür — dev sunucusu
  // her isteği yeniden render ettiği için e2e testi bu hatayı yakalayamaz.
  revalidatePath("/", "layout");
}

const hexRenk = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, "Renk #rrggbb biçiminde olmalı.");

const themeSchema = z.object({
  accent: hexRenk,
  ink: hexRenk,
});

/**
 * Dükkan paleti. Yalnızca iki renk alınıyor; ara tonlar ve yazı renkleri
 * lib/theme.ts'te türetiliyor, böylece okunmaz kombinasyon seçilemiyor.
 */
export async function updateShopThemeAction(input: { accent: string; ink: string }) {
  const parsed = themeSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff || currentStaff.role !== "owner") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shops")
    .update({ theme_accent: parsed.accent, theme_ink: parsed.ink })
    .eq("id", currentStaff.shop_id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop.theme_updated", "shop", currentStaff.shop_id, parsed);

  // Palet kök layout'ta uygulanıyor — bütün sayfaları etkiler.
  revalidatePath("/", "layout");
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

  // Çalışma saatleri footer'da olduğu için tüm sayfaları etkiliyor.
  revalidatePath("/", "layout");
}
