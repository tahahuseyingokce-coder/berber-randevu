import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { searchCustomers } from "@/lib/panel-data";
import { CustomerBrowser } from "@/components/CustomerBrowser";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Müşteriler" };

export default async function AdminMusterilerPage() {
  const supabase = await createClient();
  // İlk ekran için tek sayfa yeter; gerisi arama kutusundan gelir.
  const [staff, { customers, total }] = await Promise.all([
    requireStaff(["owner"]),
    searchCustomers(supabase),
  ]);

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl">Müşteriler</h1>
      <CustomerBrowser
        initialCustomers={customers}
        total={total}
        viewer={{ id: staff.id, role: staff.role }}
      />
    </div>
  );
}
