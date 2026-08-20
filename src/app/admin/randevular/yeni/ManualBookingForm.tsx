"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Service, Staff } from "@/lib/types";
import { getAvailableSlotsAction } from "@/app/randevu-al/actions";
import { createManualAppointmentAction } from "./actions";

export function ManualBookingForm({ services, staff }: { services: Service[]; staff: Staff[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadSlots(nextServiceId: string, nextStaffId: string, nextDate: string) {
    if (!nextServiceId || !nextStaffId || !nextDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const result = await getAvailableSlotsAction({
        serviceId: nextServiceId,
        staffId: nextStaffId,
        date: nextDate,
      });
      setSlots(result.slots);
    } finally {
      setLoadingSlots(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Bir saat seçin.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createManualAppointmentAction({
          staffId,
          serviceId,
          startsAt: selectedSlot,
          customerName,
          customerPhone,
          customerEmail,
        });
        router.push("/admin/randevular");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Randevu oluşturulamadı.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 max-w-lg">
      <label className="grid gap-1 text-sm">
        Hizmet
        <select
          required
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            void loadSlots(e.target.value, staffId, date);
          }}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        >
          <option value="">Seçin</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.duration_minutes} dk)
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        Çalışan
        <select
          required
          value={staffId}
          onChange={(e) => {
            setStaffId(e.target.value);
            void loadSlots(serviceId, e.target.value, date);
          }}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        >
          <option value="">Seçin</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        Tarih
        <input
          type="date"
          required
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            void loadSlots(serviceId, staffId, e.target.value);
          }}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="text-sm mb-2">Saat</p>
        {loadingSlots && <p className="text-fg-muted text-sm">Yükleniyor…</p>}
        {!loadingSlots && serviceId && staffId && slots.length === 0 && (
          <p className="text-fg-muted text-sm">Bu gün için müsait saat yok.</p>
        )}
        {!loadingSlots && slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  selectedSlot === slot
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border text-fg hover:border-border-strong"
                }`}
              >
                {format(new Date(slot), "HH:mm")}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="grid gap-1 text-sm">
        Müşteri Adı Soyadı
        <input
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Telefon
        <input
          required
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-1 text-sm">
        E-posta
        <input
          type="email"
          required
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium disabled:opacity-40 justify-self-start"
      >
        {isPending ? "Kaydediliyor…" : "Randevuyu Oluştur"}
      </button>
    </form>
  );
}
