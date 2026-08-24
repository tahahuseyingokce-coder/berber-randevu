"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  phone: z.string().trim().max(30).optional(),
});

export async function createEmployeeAction(input: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}) {
  const parsed = createEmployeeSchema.parse(input);
  const currentStaff = await getCurrentStaff();

  if (!currentStaff || currentStaff.role !== "owner") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "Kullanıcı oluşturulamadı.");
  }

  const { error: staffError } = await admin.from("staff").insert({
    shop_id: currentStaff.shop_id,
    auth_user_id: authUser.user.id,
    full_name: parsed.fullName,
    email: parsed.email,
    role: "employee",
    phone: parsed.phone || null,
    is_active: true,
  });

  if (staffError) {
    // Auth kullanıcısı oluştu ama staff kaydı başarısız oldu — tutarsızlığı önlemek için geri al.
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(staffError.message);
  }

  const supabase = await createClient();
  await logAudit(supabase, "staff.created", "staff", undefined, {
    full_name: parsed.fullName,
    email: parsed.email,
  });

  revalidatePath("/admin/calisanlar");
}

export async function toggleStaffActiveAction(staffId: string, isActive: boolean) {
  const id = z.string().uuid().parse(staffId);
  const supabase = await createClient();

  const { error } = await supabase.from("staff").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit(supabase, isActive ? "staff.activated" : "staff.deactivated", "staff", id);

  revalidatePath("/admin/calisanlar");
}

/**
 * Çalışanı kalıcı olarak siler.
 *
 * Yalnızca hiç randevusu olmayan çalışan silinebilir — yanlışlıkla
 * eklenmiş kaydı temizlemek için. Randevusu olan biri silinseydi geçmiş
 * randevuların kime ait olduğu kaybolurdu (`appointments.staff_id`
 * kısıtı da buna izin vermez); orada doğru işlem "Pasifleştir".
 *
 * Sahip hiçbir koşulda silinemez: panele girebilen tek hesap odur.
 */
export async function deleteStaffAction(staffId: string) {
  const id = z.string().uuid().parse(staffId);
  const currentStaff = await getCurrentStaff();

  if (!currentStaff || currentStaff.role !== "owner") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  if (id === currentStaff.id) {
    throw new Error("Kendi hesabınızı silemezsiniz.");
  }

  const admin = createAdminClient();

  const { data: target, error: targetError } = await admin
    .from("staff")
    .select("id, shop_id, role, full_name, auth_user_id, photo_path")
    .eq("id", id)
    .single();

  if (targetError || !target) throw new Error("Çalışan bulunamadı.");

  // Servis anahtarı RLS'i atladığı için dükkan kontrolü elle yapılır.
  if (target.shop_id !== currentStaff.shop_id) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }
  if (target.role === "owner") {
    throw new Error("Dükkan sahibi silinemez.");
  }

  const { count, error: countError } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", id);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error(
      `${target.full_name} ${count} randevuda görünüyor, silinemez. Çalışmıyorsa "Pasifleştir" deyin — geçmiş randevular korunur.`,
    );
  }

  const { error: deleteError } = await admin.from("staff").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  // staff satırı gittikten sonra giriş hesabı ve portresi öksüz kalmasın.
  if (target.auth_user_id) {
    await admin.auth.admin.deleteUser(target.auth_user_id);
  }
  if (target.photo_path) {
    await admin.storage.from("site-photos").remove([target.photo_path]);
  }

  const supabase = await createClient();
  await logAudit(supabase, "staff.deleted", "staff", id, { full_name: target.full_name });

  revalidatePath("/admin/calisanlar");
  revalidatePath("/admin/icerik");
  revalidatePath("/hakkimizda");
  revalidatePath("/");
}

const updateStaffSchema = z.object({
  staffId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(30).optional(),
});

/**
 * Çalışan bilgilerini günceller. Sahip kendi kaydını da düzenleyebilir —
 * kurulumdan gelen demo isim ancak buradan değiştirilebiliyor.
 *
 * E-posta iki yerde tutuluyor: staff.email bildirimler için, auth kullanıcısı
 * giriş için. Yalnızca biri güncellenirse çalışan bildirim alır ama giremez
 * (veya tersi) — o yüzden ikisi birlikte değişir, auth önce güncellenir ki
 * başarısız olursa staff satırı eski haliyle tutarlı kalsın.
 */
export async function updateStaffAction(input: {
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
}) {
  const parsed = updateStaffSchema.parse(input);
  const currentStaff = await getCurrentStaff();

  if (!currentStaff || currentStaff.role !== "owner") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const admin = createAdminClient();

  const { data: target, error: targetError } = await admin
    .from("staff")
    .select("id, shop_id, auth_user_id, email")
    .eq("id", parsed.staffId)
    .single();

  if (targetError || !target) throw new Error("Çalışan bulunamadı.");

  // Servis anahtarı RLS'i atladığı için dükkan kontrolü elle yapılır.
  if (target.shop_id !== currentStaff.shop_id) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  if (target.auth_user_id && target.email !== parsed.email) {
    const { error: authError } = await admin.auth.admin.updateUserById(target.auth_user_id, {
      email: parsed.email,
    });
    if (authError) throw new Error(authError.message);
  }

  const { error: staffError } = await admin
    .from("staff")
    .update({
      full_name: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone || null,
    })
    .eq("id", parsed.staffId);

  if (staffError) throw new Error(staffError.message);

  const supabase = await createClient();
  await logAudit(supabase, "staff.updated", "staff", parsed.staffId, {
    full_name: parsed.fullName,
    email: parsed.email,
  });

  revalidatePath("/admin/calisanlar");
  revalidatePath("/");
}
