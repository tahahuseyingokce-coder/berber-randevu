import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listServicesAll } from "@/lib/panel-data";
import { ServicesManager } from "./ServicesManager";

export const metadata: Metadata = { title: "Hizmetler" };

export default async function AdminHizmetlerPage() {
  const supabase = await createClient();
  const services = await listServicesAll(supabase);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Hizmetler</h1>
      <ServicesManager services={services} />
    </div>
  );
}
