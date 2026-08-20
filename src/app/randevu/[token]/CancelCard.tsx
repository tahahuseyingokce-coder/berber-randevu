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

  return (
    <div className="rounded-2xl border border-border bg-surface p-8">
      <h1 className="text-3xl mb-6">Randevu Detayı</h1>
      <dl className="grid gap-2 text-sm mb-8">
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-fg-muted">Hizmet</dt>
          <dd>{appointment.service_name}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-fg-muted">Çalışan</dt>
          <dd>{appointment.staff_name}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-fg-muted">Tarih</dt>
          <dd>{format(new Date(appointment.starts_at), "d MMMM yyyy, HH:mm", { locale: tr })}</dd>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <dt className="text-fg-muted">Durum</dt>
          <dd className="capitalize">
            {status === "cancelled" ? "İptal edildi" : status === "confirmed" ? "Onaylandı" : "Onay bekliyor"}
          </dd>
        </div>
      </dl>

      {status !== "cancelled" && (
        <>
          {cutoffPassed && (
            <p className="text-danger text-sm mb-4">
              Bu randevu için iptal süresi geçti ({appointment.shop_cutoff_hours} saat kala iptal edilemez).
            </p>
          )}
          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          <button
            type="button"
            onClick={onCancel}
            disabled={cutoffPassed || isPending}
            className="rounded-lg border border-danger text-danger px-5 py-2 text-sm font-medium disabled:opacity-40"
          >
            {isPending ? "İptal ediliyor…" : "Randevuyu İptal Et"}
          </button>
        </>
      )}

      {status === "cancelled" && (
        <p className="text-fg-muted text-sm">Bu randevu iptal edilmiştir.</p>
      )}
    </div>
  );
}
