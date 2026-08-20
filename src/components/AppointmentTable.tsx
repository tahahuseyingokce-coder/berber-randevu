"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";
import { confirmAppointmentAction, cancelAppointmentAsStaffAction } from "@/lib/appointment-actions";
import type { AppointmentRow } from "@/lib/panel-data";

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
          <tr className="text-left text-fg-muted border-b border-border">
            <th className="py-2 pr-4 font-normal">Tarih</th>
            <th className="py-2 pr-4 font-normal">Müşteri</th>
            <th className="py-2 pr-4 font-normal">Hizmet</th>
            {showStaffColumn && <th className="py-2 pr-4 font-normal">Çalışan</th>}
            <th className="py-2 pr-4 font-normal">Durum</th>
            <th className="py-2 pr-4 font-normal">İşlem</th>
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
                  <div className="flex gap-3">
                    {a.status === "pending" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => startTransition(() => confirmAppointmentAction(a.id))}
                        className="text-success text-xs font-medium disabled:opacity-40"
                      >
                        Onayla
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startTransition(() => cancelAppointmentAsStaffAction(a.id))}
                      className="text-danger text-xs font-medium disabled:opacity-40"
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
