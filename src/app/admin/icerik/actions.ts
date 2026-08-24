"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { SITE_PHOTOS_BUCKET } from "@/lib/site-photos";

/** Galeri ve Hakkımızda değişiklikleri bu sayfaların hepsinde görünür. */
function revalidateContentPages() {
  revalidatePath("/admin/icerik");
  revalidatePath("/");
  revalidatePath("/galeri");
  revalidatePath("/hakkimizda");
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Yüklenen dosyayı doğrular ve uzantısını döner. */
function validatePhotoFile(file: unknown): { file: File; ext: string } {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Bir fotoğraf seçin.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Fotoğraf en fazla 5 MB olabilir.");
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Yalnızca JPG, PNG, WebP veya AVIF yükleyebilirsiniz.");
  }
  return { file, ext };
}

// ------------------------------------------------------------
// Hakkımızda metni
// ------------------------------------------------------------
const aboutSchema = z.object({
  aboutTitle: z.string().trim().max(120),
  aboutBody: z.string().trim().max(1000),
});

export async function updateAboutTextAction(input: { aboutTitle: string; aboutBody: string }) {
  const parsed = aboutSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("shops")
    .update({
      about_title: parsed.aboutTitle || null,
      about_body: parsed.aboutBody || null,
    })
    .eq("id", currentStaff.shop_id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop.about_updated", "shop", currentStaff.shop_id);
  revalidateContentPages();
}

// ------------------------------------------------------------
// Değer kartları
// ------------------------------------------------------------
const valueSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(600),
});

export async function createShopValueAction(input: { title: string; body: string }) {
  const parsed = valueSchema.parse(input);
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();

  // Yeni kart listenin sonuna eklensin.
  const { data: last } = await supabase
    .from("shop_values")
    .select("sort_order")
    .eq("shop_id", currentStaff.shop_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("shop_values")
    .insert({
      shop_id: currentStaff.shop_id,
      title: parsed.title,
      body: parsed.body,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop_value.created", "shop_value", data.id, { title: parsed.title });
  revalidateContentPages();
}

export async function updateShopValueAction(input: { id: string; title: string; body: string }) {
  const id = z.string().uuid().parse(input.id);
  const parsed = valueSchema.parse({ title: input.title, body: input.body });

  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_values")
    .update({ title: parsed.title, body: parsed.body })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop_value.updated", "shop_value", id, { title: parsed.title });
  revalidateContentPages();
}

export async function deleteShopValueAction(id: string) {
  const parsedId = z.string().uuid().parse(id);

  const supabase = await createClient();
  const { error } = await supabase.from("shop_values").delete().eq("id", parsedId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "shop_value.deleted", "shop_value", parsedId);
  revalidateContentPages();
}

// ------------------------------------------------------------
// Fotoğraflar
// ------------------------------------------------------------
const placementSchema = z.enum(["gallery", "about"]);

/**
 * Fotoğrafı Storage'a yükleyip site_photos'a satır ekler.
 *
 * Dosya FormData ile geliyor: server action'a File göndermenin tek yolu bu.
 * Bucket'ın kendi mime/boyut limiti de var; buradaki kontrol kullanıcıya
 * Türkçe hata verebilmek için.
 */
export async function uploadSitePhotoAction(formData: FormData) {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");
  if (currentStaff.role !== "owner") throw new Error("Bu işlem için yetkiniz yok.");

  const placement = placementSchema.parse(formData.get("placement"));
  const alt = z.string().trim().max(200).parse(formData.get("alt") ?? "");
  const { file, ext } = validatePhotoFile(formData.get("file"));

  const supabase = await createClient();
  const storagePath = `${currentStaff.shop_id}/${placement}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SITE_PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  // Hakkımızda tek fotoğraf gösteriyor: yenisi eskisinin yerine geçer,
  // aksi halde panelde biriken ama hiç görünmeyen dosyalar kalırdı.
  if (placement === "about") {
    const { data: existing } = await supabase
      .from("site_photos")
      .select("id, storage_path")
      .eq("shop_id", currentStaff.shop_id)
      .eq("placement", "about");

    if (existing && existing.length > 0) {
      await supabase.storage
        .from(SITE_PHOTOS_BUCKET)
        .remove(existing.map((p) => p.storage_path));
      await supabase
        .from("site_photos")
        .delete()
        .in(
          "id",
          existing.map((p) => p.id),
        );
    }
  }

  const { data: last } = await supabase
    .from("site_photos")
    .select("sort_order")
    .eq("shop_id", currentStaff.shop_id)
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("site_photos")
    .insert({
      shop_id: currentStaff.shop_id,
      storage_path: storagePath,
      alt: alt || null,
      placement,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) {
    // Satır yazılamadıysa yüklenen dosya öksüz kalmasın.
    await supabase.storage.from(SITE_PHOTOS_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  await logAudit(supabase, "site_photo.uploaded", "site_photo", data.id, { placement });
  revalidateContentPages();
}

export async function deleteSitePhotoAction(id: string) {
  const parsedId = z.string().uuid().parse(id);

  const supabase = await createClient();
  const { data: photo, error: readError } = await supabase
    .from("site_photos")
    .select("storage_path")
    .eq("id", parsedId)
    .single();

  if (readError) throw new Error(readError.message);

  const { error } = await supabase.from("site_photos").delete().eq("id", parsedId);
  if (error) throw new Error(error.message);

  await supabase.storage.from(SITE_PHOTOS_BUCKET).remove([photo.storage_path]);

  await logAudit(supabase, "site_photo.deleted", "site_photo", parsedId);
  revalidateContentPages();
}

// ------------------------------------------------------------
// Ekip portreleri
// ------------------------------------------------------------

/**
 * Çalışan portresi. Galeri fotoğraflarından farklı olarak site_photos'ta
 * değil staff.photo_path'te tutulur: her çalışanın en fazla bir portresi
 * var ve çalışan silinince fotoğrafın da anlamı kalmıyor.
 */
export async function uploadStaffPhotoAction(formData: FormData) {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");
  if (currentStaff.role !== "owner") throw new Error("Bu işlem için yetkiniz yok.");

  const staffId = z.string().uuid().parse(formData.get("staffId"));
  const { file, ext } = validatePhotoFile(formData.get("file"));

  const supabase = await createClient();

  // Aynı dükkanın çalışanı mı? RLS zaten sınırlıyor ama eski dosyayı
  // silmeden önce kaydı okumamız gerekiyor.
  const { data: target, error: readError } = await supabase
    .from("staff")
    .select("id, photo_path, shop_id")
    .eq("id", staffId)
    .single();

  if (readError) throw new Error(readError.message);
  if (target.shop_id !== currentStaff.shop_id) throw new Error("Bu çalışan bu dükkana ait değil.");

  const storagePath = `${currentStaff.shop_id}/staff/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SITE_PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("staff")
    .update({ photo_path: storagePath })
    .eq("id", staffId);

  if (error) {
    await supabase.storage.from(SITE_PHOTOS_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  // Yeni portre kaydedildikten sonra eskisi öksüz kalmasın.
  if (target.photo_path) {
    await supabase.storage.from(SITE_PHOTOS_BUCKET).remove([target.photo_path]);
  }

  await logAudit(supabase, "staff.photo_updated", "staff", staffId);
  revalidateContentPages();
}

const staffProfileSchema = z.object({
  title: z.string().trim().max(80),
  bio: z.string().trim().max(400),
});

/** Ekip kartındaki unvan ve kısa tanıtım. */
export async function updateStaffProfileAction(input: {
  staffId: string;
  title: string;
  bio: string;
}) {
  const staffId = z.string().uuid().parse(input.staffId);
  const parsed = staffProfileSchema.parse({ title: input.title, bio: input.bio });

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");
  if (currentStaff.role !== "owner") throw new Error("Bu işlem için yetkiniz yok.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ title: parsed.title || null, bio: parsed.bio || null })
    .eq("id", staffId);

  if (error) throw new Error(error.message);

  await logAudit(supabase, "staff.profile_updated", "staff", staffId);
  revalidateContentPages();
}

export async function deleteStaffPhotoAction(staffId: string) {
  const parsedId = z.string().uuid().parse(staffId);

  const supabase = await createClient();
  const { data: target, error: readError } = await supabase
    .from("staff")
    .select("photo_path")
    .eq("id", parsedId)
    .single();

  if (readError) throw new Error(readError.message);

  const { error } = await supabase
    .from("staff")
    .update({ photo_path: null })
    .eq("id", parsedId);

  if (error) throw new Error(error.message);

  if (target.photo_path) {
    await supabase.storage.from(SITE_PHOTOS_BUCKET).remove([target.photo_path]);
  }

  await logAudit(supabase, "staff.photo_removed", "staff", parsedId);
  revalidateContentPages();
}

/** Galeri sırası: fotoğrafı bir yukarı ya da bir aşağı taşır. */
export async function moveSitePhotoAction(id: string, direction: "up" | "down") {
  const parsedId = z.string().uuid().parse(id);
  const dir = z.enum(["up", "down"]).parse(direction);

  const currentStaff = await getCurrentStaff();
  if (!currentStaff) throw new Error("Oturum bulunamadı.");

  const supabase = await createClient();
  const { data: photos, error } = await supabase
    .from("site_photos")
    .select("id, sort_order")
    .eq("shop_id", currentStaff.shop_id)
    .eq("placement", "gallery")
    .order("sort_order");

  if (error) throw new Error(error.message);

  const ordered = photos ?? [];
  const index = ordered.findIndex((p) => p.id === parsedId);
  const swapWith = dir === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= ordered.length) return;

  [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];

  // sort_order'ları indeksten yeniden yazıyoruz: iki kaydın sort_order'ı
  // eşitse (eski satırlar, elle eklenen kayıtlar) ikisini takas etmek
  // hiçbir şey değiştirmezdi.
  await Promise.all(
    ordered.map((p, i) =>
      supabase.from("site_photos").update({ sort_order: i + 1 }).eq("id", p.id),
    ),
  );

  revalidateContentPages();
}
