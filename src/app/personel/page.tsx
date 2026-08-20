import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { getShop } from "@/lib/shop";
import { StatusBadge } from "@/components/StatusBadge";
import { UpcomingChart } from "@/components/UpcomingChart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PersonelDashboardPage() {
  const supabase = await createClient();
  const shop = await getShop();

  // Ciro dükkan geneline ait bir bilgi; çalışan panelinde gösterilmez.
  const stats = await getDashboardStats(supabase, shop.timezone);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-3xl font-medium tabular-nums">{stats.todayCount}</p>
          <p className="text-sm text-fg-muted mt-1">Bugünkü Randevularım</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p
            className={`text-3xl font-medium tabular-nums ${
              stats.pendingCount > 0 ? "text-accent" : ""
            }`}
          >
            {stats.pendingCount}
          </p>
          <p className="text-sm text-fg-muted mt-1">Onay Bekleyen</p>
        </div>
      </div>

      <UpcomingChart data={stats.upcoming} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Bugün</h2>
          <Link href="/personel/randevular" className="text-sm text-accent">
            Tüm randevularım →
          </Link>
        </div>

        {stats.todayAppointments.length === 0 && (
          <p className="text-fg-muted text-sm">Bugün için randevunuz yok.</p>
        )}

        <div className="grid gap-2">
          {stats.todayAppointments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-medium tabular-nums shrink-0">
                  {format(new Date(a.starts_at), "HH:mm", { locale: tr })}
                </span>
                <span className="truncate">{a.customers?.full_name}</span>
                <span className="text-fg-muted truncate">{a.services?.name}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
