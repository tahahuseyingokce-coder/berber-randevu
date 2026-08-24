import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchCustomers } from "@/lib/panel-data";
import { CustomerBrowser } from "@/components/CustomerBrowser";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Müşterilerim" };

export default async function PersonelMusterilerPage() {
  const supabase = await createClient();
  // RLS gereği çalışan yalnızca kendi randevusu olan müşterileri görür.
  const [staff, { customers, total }] = await Promise.all([
    requireStaff(["owner", "employee"]),
    searchCustomers(supabase),
  ]);

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl">Müşterilerim</h1>
      <CustomerBrowser
        initialCustomers={customers}
        total={total}
        viewer={{ id: staff.id, role: staff.role }}
      />
    </div>
  );
}
