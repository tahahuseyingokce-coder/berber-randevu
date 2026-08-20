"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { Service, Staff } from "@/lib/types";
import { createAppointmentAction, getAvailableSlotsAction } from "./actions";

const contactSchema = z.object({
  customerName: z.string().trim().min(2, "Ad soyad gerekli"),
  customerPhone: z.string().trim().min(7, "Geçerli bir telefon numarası girin"),
  customerEmail: z.string().email("Geçerli bir e-posta girin"),
});

type ContactForm = z.infer<typeof contactSchema>;

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

function nextDays(count: number, timezone: string) {
  const today = toZonedTime(new Date(), timezone);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function BookingForm({
  services,
  staff,
  timezone,
}: {
  services: Service[];
  staff: Staff[];
  timezone: string;
}) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [staffMember, setStaffMember] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ id: string } | null>(null);

  const days = useMemo(() => nextDays(14, timezone), [timezone]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  async function loadSlots(date: Date) {
    if (!service || !staffMember) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const result = await getAvailableSlotsAction({
        staffId: staffMember.id,
        serviceId: service.id,
        date: dateStr,
      });
      setSlots(result.slots);
    } finally {
      setLoadingSlots(false);
    }
  }

  function onSelectDay(date: Date) {
    setSelectedDate(date);
    void loadSlots(date);
  }

  function onSubmitContact(values: ContactForm) {
    if (!service || !staffMember || !selectedSlot) return;
    setSubmitError(null);
    startTransition(async () => {
      try {
        const result = await createAppointmentAction({
          staffId: staffMember.id,
          serviceId: service.id,
          startsAt: selectedSlot,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail,
        });
        setConfirmed(result.appointment as { id: string });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Randevu oluşturulamadı.");
      }
    });
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h2 className="text-3xl mb-3">Randevunuz alındı</h2>
        <p className="text-fg-muted">
          {staffMember?.full_name} ile {service?.name} için{" "}
          {selectedSlot && format(new Date(selectedSlot), "d MMMM yyyy, HH:mm", { locale: tr })}{" "}
          randevunuz oluşturuldu. Onay e-postası kısa süre içinde gönderilecek.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <ol className="flex items-center gap-2 mb-8 text-sm text-fg-subtle">
        {["Hizmet", "Çalışan", "Tarih & Saat", "Bilgileriniz"].map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${i + 1 === step ? "text-accent" : ""}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                i + 1 === step ? "border-accent text-accent" : "border-border"
              }`}
            >
              {i + 1}
            </span>
            {label}
            {i < 3 && <span className="mx-1 text-border-strong">→</span>}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="grid gap-3">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setService(s);
                setStep(2);
              }}
              className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-5 py-4 text-left hover:border-accent transition-colors"
            >
              <span>
                <span className="block font-medium">{s.name}</span>
                <span className="block text-sm text-fg-muted">{s.duration_minutes} dk</span>
              </span>
              {formatPrice(s.price) && <span className="text-accent">{formatPrice(s.price)}</span>}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-3">
          {staff.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setStaffMember(st);
                setStep(3);
              }}
              className="rounded-xl border border-border bg-bg-elevated px-5 py-4 text-left hover:border-accent transition-colors"
            >
              {st.full_name}
            </button>
          ))}
          <button type="button" onClick={() => setStep(1)} className="text-sm text-fg-muted text-left mt-2">
            ← Geri
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            {days.map((d) => (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onSelectDay(d)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm transition-colors ${
                  selectedDate && format(selectedDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
                    ? "border-accent text-accent"
                    : "border-border text-fg-muted hover:border-border-strong"
                }`}
              >
                {format(d, "d MMM, EEE", { locale: tr })}
              </button>
            ))}
          </div>

          {loadingSlots && <p className="text-fg-muted text-sm">Müsait saatler yükleniyor…</p>}

          {!loadingSlots && selectedDate && slots.length === 0 && (
            <p className="text-fg-muted text-sm">Bu gün için müsait saat yok, başka bir gün seçin.</p>
          )}

          {/* Slot listesi kendi scroll alanında: mobilde 30+ saat butonu
              sayfayı uzatıp "Devam Et"i ekranın çok altında bırakıyordu. */}
          {!loadingSlots && slots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
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

          <div className="flex justify-between mt-6">
            <button type="button" onClick={() => setStep(2)} className="text-sm text-fg-muted">
              ← Geri
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="rounded-lg bg-accent text-accent-fg px-5 py-2 text-sm font-medium disabled:opacity-40"
            >
              Devam Et
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit(onSubmitContact)} className="grid gap-4">
          <div className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            {service?.name} · {staffMember?.full_name} ·{" "}
            {selectedSlot && format(new Date(selectedSlot), "d MMMM yyyy, HH:mm", { locale: tr })}
          </div>

          <label className="grid gap-1 text-sm">
            Ad Soyad
            <input
              {...register("customerName")}
              className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
            />
            {errors.customerName && (
              <span className="text-danger text-xs">{errors.customerName.message}</span>
            )}
          </label>

          <label className="grid gap-1 text-sm">
            Telefon
            <input
              {...register("customerPhone")}
              className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
            />
            {errors.customerPhone && (
              <span className="text-danger text-xs">{errors.customerPhone.message}</span>
            )}
          </label>

          <label className="grid gap-1 text-sm">
            E-posta
            <input
              {...register("customerEmail")}
              className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
            />
            {errors.customerEmail && (
              <span className="text-danger text-xs">{errors.customerEmail.message}</span>
            )}
          </label>

          {submitError && <p className="text-danger text-sm">{submitError}</p>}

          <div className="flex justify-between mt-2">
            <button type="button" onClick={() => setStep(3)} className="text-sm text-fg-muted">
              ← Geri
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent text-accent-fg px-5 py-2 text-sm font-medium disabled:opacity-40"
            >
              {isSubmitting ? "Gönderiliyor…" : "Randevuyu Onayla"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
