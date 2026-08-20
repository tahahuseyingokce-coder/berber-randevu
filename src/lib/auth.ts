import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentStaff = {
  id: string;
  shop_id: string;
  full_name: string;
  role: "owner" | "employee";
  phone: string | null;
  is_active: boolean;
};

/** Giriş yapmış kullanıcının staff kaydını döner, yoksa null. */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("staff")
    .select("id, shop_id, full_name, role, phone, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data;
}

/** Sayfayı sadece belirtilen role(ler) için açar, aksi halde uygun panele yönlendirir. */
export async function requireStaff(allowedRoles: Array<"owner" | "employee">) {
  const staff = await getCurrentStaff();

  if (!staff) {
    redirect("/giris");
  }

  if (!allowedRoles.includes(staff.role)) {
    redirect(staff.role === "owner" ? "/admin" : "/personel");
  }

  return staff;
}
