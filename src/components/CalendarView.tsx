"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import type { AppointmentRow } from "@/lib/panel-data";
import type { ShopHour } from "@/lib/types";

const locales = { tr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: tr }),
  getDay,
  locales,
});

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  status: string;
};

const MESSAGES = {
  today: "Bugün",
  previous: "Geri",
  next: "İleri",
  day: "Gün",
  date: "Tarih",
  time: "Saat",
  event: "Randevu",
  noEventsInRange: "Bu aralıkta randevu yok.",
};

/** Saatlik satır yüksekliği (px) — dükkan saatlerinin tamamı iç kaydırma
 *  olmadan sığsın diye takvimin yüksekliği buradan hesaplanır. */
const HOUR_HEIGHT = 56;

/** Çalışma saatleri okunamazsa kullanılacak varsayılan aralık. */
const FALLBACK_RANGE = { startHour: 8, endHour: 21 };

/**
 * Randevu ızgarasının kapsayacağı saat aralığı.
 *
 * Önceden takvim 00:00–24:00 çiziyordu: ekranın çoğu boş kalıyor, randevular
 * okunamayacak kadar sıkışıyordu. Aralık dükkanın en erken açılışı ile en geç
 * kapanışına daraltılır, iki ucundan birer saat pay bırakılır.
 */
function workingRange(hours: ShopHour[]) {
  const open = hours
    .filter((h) => !h.is_closed && h.opens_at)
    .map((h) => Number(h.opens_at!.slice(0, 2)));
  const close = hours
    .filter((h) => !h.is_closed && h.closes_at)
    .map((h) => Number(h.closes_at!.slice(0, 2)));

  if (open.length === 0 || close.length === 0) return FALLBACK_RANGE;

  const startHour = Math.max(0, Math.min(...open) - 1);
  // Kapanış saatinde biten randevu son satırda görünsün diye bir saat pay.
  const endHour = Math.min(23, Math.max(...close) + 1);

  if (endHour <= startHour) return FALLBACK_RANGE;
  return { startHour, endHour };
}

function atHour(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function CalendarView({
  appointments,
  resources,
  shopHours = [],
}: {
  appointments: AppointmentRow[];
  resources?: { resourceId: string; resourceTitle: string }[];
  shopHours?: ShopHour[];
}) {
  // Takvim kontrollü kullanılıyor: react-big-calendar tek görünümde
  // gezinme oklarını yalnızca date prop'u dışarıdan yönetilirse çalıştırır.
  const [date, setDate] = useState(() => new Date());

  const events: CalEvent[] = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled")
        .map((a) => ({
          id: a.id,
          title: `${a.customers?.full_name ?? ""} — ${a.services?.name ?? ""}`,
          start: new Date(a.starts_at),
          end: new Date(a.ends_at),
          resourceId: a.staff?.id,
          status: a.status,
        })),
    [appointments],
  );

  const { startHour, endHour } = useMemo(() => workingRange(shopHours), [shopHours]);
  const height = (endHour - startHour) * HOUR_HEIGHT + 80;

  return (
    <div className="rbc-theme" style={{ height }}>
      <Calendar
        localizer={localizer}
        events={events}
        date={date}
        onNavigate={setDate}
        // Yalnızca gün görünümü: hafta görünümü çalışan sütunlarıyla birlikte
        // masaüstünde bile taşıyor, okunur bir genişliğe sığmıyordu.
        view={Views.DAY}
        views={[Views.DAY]}
        onView={() => undefined}
        min={atHour(startHour)}
        max={atHour(endHour, 59)}
        step={30}
        timeslots={2}
        resources={resources}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="resourceTitle"
        messages={MESSAGES}
        dayLayoutAlgorithm="no-overlap"
        eventPropGetter={(event) => ({
          className:
            (event as CalEvent).status === "pending" ? "rbc-event-pending" : "rbc-event-confirmed",
        })}
        style={{ height: "100%" }}
      />
    </div>
  );
}
