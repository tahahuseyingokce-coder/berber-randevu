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
