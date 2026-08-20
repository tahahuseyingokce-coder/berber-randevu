import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listStaffAll } from "@/lib/panel-data";
import { StaffManager } from "./StaffManager";

export const metadata: Metadata = { title: "Çalışanlar" };

export default async function AdminCalisanlarPage() {
  const supabase = await createClient();
  const staff = await listStaffAll(supabase);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Çalışanlar</h1>
      <StaffManager staff={staff} />
    </div>
  );
}
