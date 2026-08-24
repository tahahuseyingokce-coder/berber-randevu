import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { AppointmentTable } from "@/components/AppointmentTable";
import { btnPrimary } from "@/components/ui/button";
import type { AppointmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Randevular" };

/**
 * Her sekme tek bir duruma bakar. "Tümü" kaldırıldı: liste büyüdükçe
 * en kalabalık ve en az işe yarayan görünüm oydu. Onay bekleyenler
 * ilk sekme, çünkü panelde iş gerektiren tek durum o.
 */
const FILTERS: { key: string; label: string; status: AppointmentStatus[] }[] = [
  { key: "pending", label: "Onay Bekleyen", status: ["pending"] },
  { key: "confirmed", label: "Onaylı", status: ["confirmed"] },
  { key: "completed", label: "Tamamlandı", status: ["completed"] },
  { key: "cancelled", label: "İptal", status: ["cancelled"] },
];

export default async function AdminRandevularPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "pending" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const supabase = await createClient();
  const appointments = await listAppointments(supabase, { status: active.status });

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Randevular</h1>
        <Link href="/admin/randevular/yeni" className={btnPrimary}>
          Manuel Randevu Ekle
        </Link>
      </div>

      {/* Alt çizgili sekme: yuvarlak dolgu rozetlerden daha sakin duruyor
          ve hangi görünümde olunduğu yine tek bakışta belli. */}
      <div className="flex gap-1 overflow-x-auto border-b border-border text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/randevular?filter=${f.key}`}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 font-medium transition-colors ${
              active.key === f.key
                ? "border-accent text-accent"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {appointments.length === 0 ? (
        <p className="py-6 text-sm text-fg-muted">
          Bu görünümde randevu yok.
        </p>
      ) : (
        <AppointmentTable appointments={appointments} />
      )}
    </div>
  );
}
