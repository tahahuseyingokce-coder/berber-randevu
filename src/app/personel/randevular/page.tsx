import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listAppointments } from "@/lib/panel-data";
import { AppointmentTable } from "@/components/AppointmentTable";
import type { AppointmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Randevularım" };

const FILTERS: { key: string; label: string; status?: AppointmentStatus[] }[] = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Onay Bekleyen", status: ["pending"] },
  { key: "confirmed", label: "Onaylı", status: ["confirmed"] },
  { key: "cancelled", label: "İptal", status: ["cancelled"] },
];

export default async function PersonelRandevularPage({
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
      <h1 className="text-3xl">Randevularım</h1>

      <div className="flex gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/personel/randevular" : `/personel/randevular?filter=${f.key}`}
            className={`rounded-full border px-3 py-1.5 ${
              active.key === f.key ? "border-accent text-accent" : "border-border text-fg-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <AppointmentTable appointments={appointments} showStaffColumn={false} />
    </div>
  );
}
