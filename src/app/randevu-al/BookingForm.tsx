"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { Service, Staff } from "@/lib/types";
import { BOOKING_WINDOW_DAYS } from "@/lib/booking";
import { createAppointmentAction, getAvailableSlotsAction } from "./actions";

const contactSchema = z.object({
  customerName: z.string().trim().min(2, "Ad soyad gerekli"),
  customerPhone: z.string().trim().min(7, "Geçerli bir telefon numarası girin"),
  customerEmail: z.string().email("Geçerli bir e-posta girin"),
});

type ContactForm = z.infer<typeof contactSchema>;

const STEPS = ["Hizmet", "Çalışan", "Tarih & Saat", "Bilgileriniz"] as const;

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function nextDays(count: number, timezone: string) {
  const today = toZonedTime(new Date(), timezone);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// text-base (16px): iOS'ta daha küçük punto girişte otomatik zoom yapıyor.
const inputClass =
  "w-full rounded-sm border border-border bg-bg-elevated px-4 py-3 text-base outline-none transition-colors focus:border-accent";

// Not: iletişim formunda noValidate kullanılıyor — input type'ları mobil
// klavye için duruyor, ama hata mesajları tek yerden (zod) geliyor. Aksi
// halde tarayıcının kendi baloncuğu devreye girip Türkçe mesajları gizliyor.

const primaryButton =
  "inline-flex items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-40";

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

  const days = useMemo(() => nextDays(BOOKING_WINDOW_DAYS, timezone), [timezone]);

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
      <div className="border border-border bg-surface p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-accent-fg"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h2 className="mt-6 text-3xl sm:text-4xl">Randevunuz alındı</h2>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
          {staffMember?.full_name} ile {service?.name} için{" "}
          <span className="text-fg">
            {selectedSlot && format(new Date(selectedSlot), "d MMMM yyyy, HH:mm", { locale: tr })}
          </span>{" "}
          randevunuz oluşturuldu. Onay e-postası kısa süre içinde gönderilecek.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface p-5 sm:p-8">
      {/* Adım göstergesi — mobilde tek satır, masaüstünde tüm adımlar */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Adım {step}/4
          </span>
          <span className="text-sm">{STEPS[step - 1]}</span>
        </div>
        <div className="mt-3 flex gap-1.5 sm:hidden" aria-hidden="true">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`h-0.5 flex-1 ${i + 1 <= step ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>

        <ol className="hidden sm:flex sm:items-center sm:gap-3 sm:text-sm">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 ${
                  i + 1 === step ? "text-accent" : "text-fg-subtle"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                    i + 1 <= step ? "border-accent text-accent" : "border-border"
                  }`}
                >
                  {i + 1}
                </span>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="text-border-strong">→</span>}
            </li>
          ))}
        </ol>
      </div>

      {step === 1 && (
        <div className="grid gap-2.5" role="group" aria-label="Hizmet seçimi">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setService(s);
                setStep(2);
              }}
              className="flex min-h-[60px] items-center justify-between gap-4 rounded-sm border border-border bg-bg-elevated px-5 py-4 text-left transition-colors hover:border-accent"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{s.name}</span>
                <span className="block text-sm text-fg-muted">{s.duration_minutes} dk</span>
              </span>
              {formatPrice(s.price) && (
                <span className="shrink-0 font-display font-bold text-accent tabular-nums">
                  {formatPrice(s.price)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-2.5" role="group" aria-label="Çalışan seçimi">
          {staff.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setStaffMember(st);
                setStep(3);
              }}
              className="min-h-[56px] rounded-sm border border-border bg-bg-elevated px-5 py-4 text-left transition-colors hover:border-accent"
            >
              {st.full_name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-2 self-start py-2 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            ← Geri
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Önümüzdeki 2 hafta
          </p>

          {/* Günler yatay kaydırma yerine sarmalayan ızgarada: kaydırma çubuğu
              hem çirkin duruyordu hem de görünmeyen günler gözden kaçıyordu.
              14 gün mobilde 4×4, masaüstünde 7×2 olarak tek bakışta sığıyor. */}
          <div
            className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-7"
            role="group"
            aria-label="Gün seçimi"
          >
            {days.map((d) => {
              const isActive =
                selectedDate && format(selectedDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => onSelectDay(d)}
                  aria-pressed={Boolean(isActive)}
                  className={`min-h-[58px] rounded-sm border px-1 py-2.5 text-center text-sm transition-colors ${
                    isActive
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border text-fg-muted hover:border-accent hover:text-fg"
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-wide opacity-80">
                    {format(d, "EEE", { locale: tr })}
                  </span>
                  <span className="block font-medium tabular-nums">
                    {format(d, "d MMM", { locale: tr })}
                  </span>
                </button>
              );
            })}
          </div>

          {!selectedDate && (
            <p className="text-sm text-fg-muted">Önce bir gün seçin.</p>
          )}

          {loadingSlots && <p className="text-sm text-fg-muted">Müsait saatler yükleniyor…</p>}

          {!loadingSlots && selectedDate && slots.length === 0 && (
            <p className="text-sm text-fg-muted">
              Bu gün için müsait saat yok, başka bir gün seçin.
            </p>
          )}

          {/* Slot listesi kendi scroll alanında: mobilde 30+ saat butonu
              sayfayı uzatıp "Devam Et"i ekranın çok altında bırakıyordu. */}
          {!loadingSlots && slots.length > 0 && (
            <div
              className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
              role="group"
              aria-label="Saat seçimi"
            >
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`min-h-[44px] rounded-sm border text-sm tabular-nums transition-colors ${
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

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              ← Geri
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className={primaryButton}
            >
              Devam Et
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit(onSubmitContact)} noValidate className="grid gap-5">
          <div className="rounded-sm border-l-2 border-accent bg-bg-elevated px-4 py-3 text-sm">
            <span className="text-fg">{service?.name}</span>
            <span className="text-fg-muted">
              {" · "}
              {staffMember?.full_name}
              {" · "}
              {selectedSlot && format(new Date(selectedSlot), "d MMMM, HH:mm", { locale: tr })}
            </span>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="text-fg-muted">Ad Soyad</span>
            <input {...register("customerName")} className={inputClass} autoComplete="name" />
            {errors.customerName && (
              <span className="text-xs text-danger">{errors.customerName.message}</span>
            )}
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-fg-muted">Telefon</span>
            <input
              {...register("customerPhone")}
              className={inputClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.customerPhone && (
              <span className="text-xs text-danger">{errors.customerPhone.message}</span>
            )}
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="text-fg-muted">E-posta</span>
            <input
              {...register("customerEmail")}
              className={inputClass}
              type="email"
              inputMode="email"
              autoComplete="email"
            />
            {errors.customerEmail && (
              <span className="text-xs text-danger">{errors.customerEmail.message}</span>
            )}
          </label>

          {submitError && <p className="text-sm text-danger">{submitError}</p>}

          <div className="mt-1 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="py-2 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              ← Geri
            </button>
            <button type="submit" disabled={isSubmitting} className={primaryButton}>
              {isSubmitting ? "Gönderiliyor…" : "Randevuyu Onayla"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
