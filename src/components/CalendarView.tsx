"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import type { AppointmentRow } from "@/lib/panel-data";

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
  month: "Ay",
  week: "Hafta",
  day: "Gün",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "Randevu",
  noEventsInRange: "Bu aralıkta randevu yok.",
};

export function CalendarView({
  appointments,
  resources,
}: {
  appointments: AppointmentRow[];
  resources?: { resourceId: string; resourceTitle: string }[];
}) {
  const events: CalEvent[] = appointments
    .filter((a) => a.status !== "cancelled")
    .map((a) => ({
      id: a.id,
      title: `${a.customers?.full_name ?? ""} — ${a.services?.name ?? ""}`,
      start: new Date(a.starts_at),
      end: new Date(a.ends_at),
      resourceId: a.staff?.id,
      status: a.status,
    }));

  return (
    <div className="rbc-dark-theme" style={{ height: 700 }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={resources ? Views.DAY : Views.WEEK}
        views={resources ? [Views.DAY, Views.WEEK] : [Views.WEEK, Views.DAY]}
        resources={resources}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="resourceTitle"
        messages={MESSAGES}
        eventPropGetter={(event) => ({
          className:
            (event as CalEvent).status === "pending" ? "rbc-event-pending" : "rbc-event-confirmed",
        })}
        style={{ height: "100%" }}
      />
    </div>
  );
}
