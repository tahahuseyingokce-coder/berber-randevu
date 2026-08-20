import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PersonelDashboardPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayAppointments, pendingAppointments] = await Promise.all([
    listAppointments(supabase, {
      from: todayStart.toISOString(),
      to: todayEnd.toISOString(),
      status: ["pending", "confirmed", "completed"],
    }),
    listAppointments(supabase, { status: ["pending"] }),
  ]);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-3xl font-medium">{todayAppointments.length}</p>
          <p className="text-sm text-fg-muted mt-1">Bugünkü Randevularım</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-3xl font-medium">{pendingAppointments.length}</p>
          <p className="text-sm text-fg-muted mt-1">Onay Bekleyen</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Bugün</h2>
          <Link href="/personel/randevular" className="text-sm text-accent">
            Tüm randevularım →
          </Link>
        </div>

        {todayAppointments.length === 0 && (
          <p className="text-fg-muted text-sm">Bugün için randevunuz yok.</p>
        )}

        <div className="grid gap-2">
          {todayAppointments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium tabular-nums">
                  {format(new Date(a.starts_at), "HH:mm", { locale: tr })}
                </span>
                <span>{a.customers?.full_name}</span>
                <span className="text-fg-muted">{a.services?.name}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
