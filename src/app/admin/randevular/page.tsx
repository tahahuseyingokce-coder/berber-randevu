import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { AppointmentTable } from "@/components/AppointmentTable";
import { btnPrimary } from "@/components/ui/button";
import type { AppointmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Randevular" };

const FILTERS: { key: string; label: string; status?: AppointmentStatus[] }[] = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Onay Bekleyen", status: ["pending"] },
  { key: "confirmed", label: "Onaylı", status: ["confirmed"] },
  { key: "cancelled", label: "İptal", status: ["cancelled"] },
];

export default async function AdminRandevularPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const supabase = await createClient();
  const appointments = await listAppointments(supabase, { status: active.status });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Randevular</h1>
        <Link
          href="/admin/randevular/yeni"
          className={btnPrimary}
        >
          Manuel Randevu Ekle
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/randevular" : `/admin/randevular?filter=${f.key}`}
            className={`rounded-full border px-3.5 py-1.5 font-medium transition-colors ${
              active.key === f.key
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface text-fg-muted hover:border-accent hover:text-accent"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <AppointmentTable appointments={appointments} />
    </div>
  );
}
