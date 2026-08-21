"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";
import { confirmAppointmentAction, cancelAppointmentAsStaffAction } from "@/lib/appointment-actions";
import type { AppointmentRow } from "@/lib/panel-data";
import { btnDangerSm, btnSecondarySm } from "@/components/ui/button";

export function AppointmentTable({
  appointments,
  showStaffColumn = true,
}: {
  appointments: AppointmentRow[];
  showStaffColumn?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (appointments.length === 0) {
    return <p className="text-fg-muted text-sm">Randevu bulunamadı.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-fg-muted">
            <th className="py-2 pr-4 font-medium">Tarih</th>
            <th className="py-2 pr-4 font-medium">Müşteri</th>
            <th className="py-2 pr-4 font-medium">Hizmet</th>
            {showStaffColumn && <th className="py-2 pr-4 font-medium">Çalışan</th>}
            <th className="py-2 pr-4 font-medium">Durum</th>
            <th className="py-2 pr-4 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id} className="border-b border-border">
              <td className="py-3 pr-4 tabular-nums whitespace-nowrap">
                {format(new Date(a.starts_at), "d MMM, HH:mm", { locale: tr })}
              </td>
              <td className="py-3 pr-4">
                <div>{a.customers?.full_name}</div>
                <div className="text-fg-muted text-xs">{a.customers?.phone}</div>
              </td>
              <td className="py-3 pr-4">{a.services?.name}</td>
              {showStaffColumn && <td className="py-3 pr-4">{a.staff?.full_name}</td>}
              <td className="py-3 pr-4">
                <StatusBadge status={a.status} />
              </td>
              <td className="py-3 pr-4">
                {(a.status === "pending" || a.status === "confirmed") && (
                  <div className="flex gap-2">
                    {a.status === "pending" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => startTransition(() => confirmAppointmentAction(a.id))}
                        className={btnSecondarySm}
                      >
                        Onayla
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startTransition(() => cancelAppointmentAsStaffAction(a.id))}
                      className={btnDangerSm}
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
