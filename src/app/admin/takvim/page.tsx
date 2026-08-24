import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments, listStaffAll } from "@/lib/panel-data";
import { getShop, getShopHours } from "@/lib/shop";
import { CalendarView } from "@/components/CalendarView";

export const metadata: Metadata = { title: "Takvim" };

export default async function AdminTakvimPage() {
  const supabase = await createClient();
  const shop = await getShop();
  const [appointments, staff, shopHours] = await Promise.all([
    listAppointments(supabase),
    listStaffAll(supabase),
    getShopHours(shop.id),
  ]);

  const resources = staff
    .filter((s) => s.is_active)
    .map((s) => ({ resourceId: s.id, resourceTitle: s.full_name }));

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl">Takvim</h1>
      <CalendarView appointments={appointments} resources={resources} shopHours={shopHours} />
    </div>
  );
}
