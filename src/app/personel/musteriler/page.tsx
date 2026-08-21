import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listCustomersAll } from "@/lib/panel-data";
import { CustomerBrowser } from "@/components/CustomerBrowser";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Müşterilerim" };

export default async function PersonelMusterilerPage() {
  const supabase = await createClient();
  const [staff, customers] = await Promise.all([
    requireStaff(["owner", "employee"]),
    listCustomersAll(supabase),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Müşterilerim</h1>
      <CustomerBrowser customers={customers} viewer={{ id: staff.id, role: staff.role }} />
    </div>
  );
}
