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

function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const shop = await getShop();

  const [stats, { count: customerCount }] = await Promise.all([
    getDashboardStats(supabase, shop.timezone, { includeRevenue: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
  ]);

  const tiles = [
    { label: "Bugünkü Randevular", value: String(stats.todayCount) },
    { label: "Onay Bekleyen", value: String(stats.pendingCount), highlight: stats.pendingCount > 0 },
    { label: "Bu Hafta Ciro", value: formatPrice(stats.weekRevenue) },
    { label: "Toplam Müşteri", value: String(customerCount ?? 0) },
  ];

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-surface p-5">
            <p className={`text-3xl font-medium tabular-nums ${t.highlight ? "text-accent" : ""}`}>
              {t.value}
            </p>
            <p className="text-sm text-fg-muted mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      <UpcomingChart data={stats.upcoming} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Bugün</h2>
          <Link href="/admin/randevular" className="text-sm text-accent">
            Tüm randevular →
          </Link>
        </div>

        {stats.todayAppointments.length === 0 && (
          <p className="text-fg-muted text-sm">Bugün için randevu yok.</p>
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
                <span className="text-fg-muted truncate">{a.staff?.full_name}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
