import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { CalendarView } from "@/components/CalendarView";

export const metadata: Metadata = { title: "Takvim" };

export default async function PersonelTakvimPage() {
  const supabase = await createClient();
  const appointments = await listAppointments(supabase);

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl">Takvim</h1>
      <CalendarView appointments={appointments} />
    </div>
  );
}
