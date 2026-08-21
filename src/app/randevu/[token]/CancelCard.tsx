"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cancelAppointmentAction } from "./actions";

export type AppointmentInfo = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service_name: string;
  staff_name: string;
  shop_cutoff_hours: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal Edildi",
  completed: "Tamamlandı",
};

export function CancelCard({
  appointment,
  token,
}: {
  appointment: AppointmentInfo;
  token: string;
}) {
  const [status, setStatus] = useState(appointment.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cutoffPassed =
    new Date(appointment.starts_at).getTime() - Date.now() <=
    appointment.shop_cutoff_hours * 60 * 60 * 1000;

  function onCancel() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelAppointmentAction({ appointmentId: appointment.id, token });
        setStatus("cancelled");
      } catch (err) {
        setError(err instanceof Error ? err.message : "İptal edilemedi.");
      }
    });
  }

  const rows: Array<[string, string]> = [
    ["Hizmet", appointment.service_name],
    ["Çalışan", appointment.staff_name],
    ["Tarih", format(new Date(appointment.starts_at), "d MMMM yyyy, HH:mm", { locale: tr })],
    ["Durum", STATUS_LABELS[status] ?? status],
  ];

  return (
    <div className="border border-border bg-surface p-6 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
        Randevunuz
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl">Randevu Detayı</h1>

      <dl className="mt-8 divide-y divide-border border-y border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="text-fg-muted">{label}</dt>
            <dd
              className={
                label === "Durum" && status === "cancelled"
                  ? "text-danger"
                  : label === "Durum" && status === "confirmed"
                    ? "text-success"
                    : ""
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {status !== "cancelled" && (
        <div className="mt-8">
          {cutoffPassed && (
            <p className="mb-4 border-l-2 border-danger bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
              Randevu saatine {appointment.shop_cutoff_hours} saatten az kaldığı için siteden
              iptal edilemiyor. Lütfen bizi arayın.
            </p>
          )}

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <button
            type="button"
            onClick={onCancel}
            disabled={cutoffPassed || isPending}
            className="inline-flex w-full items-center justify-center rounded-sm border border-danger px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-danger sm:w-auto"
          >
            {isPending ? "İptal ediliyor…" : "Randevuyu İptal Et"}
          </button>
        </div>
      )}

      {status === "cancelled" && (
        <p className="mt-8 text-sm text-fg-muted">
          Bu randevu iptal edilmiştir. Yeni randevu almak isterseniz siteden oluşturabilirsiniz.
        </p>
      )}
    </div>
  );
}
