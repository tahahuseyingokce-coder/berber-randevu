import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listCustomersAll } from "@/lib/panel-data";
import { CustomerBrowser } from "@/components/CustomerBrowser";

export const metadata: Metadata = { title: "Müşteriler" };

export default async function AdminMusterilerPage() {
  const supabase = await createClient();
  const customers = await listCustomersAll(supabase);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Müşteriler</h1>
      <CustomerBrowser customers={customers} />
    </div>
  );
}
