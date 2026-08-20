import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments, listStaffAll } from "@/lib/panel-data";
import { CalendarView } from "@/components/CalendarView";

export const metadata: Metadata = { title: "Takvim" };

export default async function AdminTakvimPage() {
  const supabase = await createClient();
  const [appointments, staff] = await Promise.all([
    listAppointments(supabase),
    listStaffAll(supabase),
  ]);

  const resources = staff
    .filter((s) => s.is_active)
    .map((s) => ({ resourceId: s.id, resourceTitle: s.full_name }));

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Takvim</h1>
      <CalendarView appointments={appointments} resources={resources} />
    </div>
  );
}
