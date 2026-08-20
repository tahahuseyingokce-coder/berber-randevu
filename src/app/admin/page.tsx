import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayAppointments, pendingAppointments, { count: customerCount }] = await Promise.all([
    listAppointments(supabase, {
      from: todayStart.toISOString(),
      to: todayEnd.toISOString(),
      status: ["pending", "confirmed", "completed"],
    }),
    listAppointments(supabase, { status: ["pending"] }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Bugünkü Randevular", value: todayAppointments.length },
    { label: "Onay Bekleyen", value: pendingAppointments.length },
    { label: "Toplam Müşteri", value: customerCount ?? 0 },
  ];

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-3xl font-medium">{s.value}</p>
            <p className="text-sm text-fg-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Bugün</h2>
          <Link href="/admin/randevular" className="text-sm text-accent">
            Tüm randevular →
          </Link>
        </div>

        {todayAppointments.length === 0 && (
          <p className="text-fg-muted text-sm">Bugün için randevu yok.</p>
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
                <span className="text-fg-muted">{a.staff?.full_name}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
