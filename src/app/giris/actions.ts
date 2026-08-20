"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signInAction(input: { email: string; password: string }) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role, is_active")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    await supabase.auth.signOut();
    return { error: "Bu hesap için erişim tanımlı değil." };
  }

  redirect(staff.role === "owner" ? "/admin" : "/personel");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
