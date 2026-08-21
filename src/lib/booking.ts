import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

type BusyRange = { starts_at: string; ends_at: string };

/**
 * Randevu bugünden itibaren en fazla bu kadar gün ileriye alınabilir.
 * Form da bu kadar gün gösterir; sunucu tarafı ayrıca doğrular, çünkü
 * eylem doğrudan da çağrılabilir.
 */
export const BOOKING_WINDOW_DAYS = 14;

/** "YYYY-MM-DD" günü, dükkanın yerel saatine göre randevu penceresinde mi? */
export function isWithinBookingWindow(dateStr: string, timezone: string, now = new Date()) {
  const today = toZonedTime(now, timezone);
  today.setHours(0, 0, 0, 0);

  const last = new Date(today);
  last.setDate(last.getDate() + BOOKING_WINDOW_DAYS - 1);

  const target = new Date(`${dateStr}T00:00:00`);
  return target >= today && target <= last;
}

/**
 * Verilen gün için müsait randevu başlangıç saatlerini üretir.
 * 15 dakikalık adımlarla dener, hizmet süresi kadar yer olup olmadığını
 * ve mevcut randevularla çakışıp çakışmadığını kontrol eder.
 */
export function generateAvailableSlots({
  dateStr,
  timezone,
  opensAt,
  closesAt,
  serviceDurationMinutes,
  busyRanges,
  now,
  stepMinutes = 15,
}: {
  dateStr: string; // "YYYY-MM-DD" — dükkanın yerel tarihi
  timezone: string;
  opensAt: string; // "HH:mm"
  closesAt: string; // "HH:mm"
  serviceDurationMinutes: number;
  busyRanges: BusyRange[];
  now: Date;
  stepMinutes?: number;
}): Date[] {
  const dayStart = fromZonedTime(`${dateStr}T${opensAt}:00`, timezone);
  const dayEnd = fromZonedTime(`${dateStr}T${closesAt}:00`, timezone);

  const busy = busyRanges.map((r) => ({
    start: new Date(r.starts_at),
    end: new Date(r.ends_at),
  }));

  const slots: Date[] = [];
  let cursor = dayStart;

  while (!isBefore(dayEnd, addMinutes(cursor, serviceDurationMinutes))) {
    const slotEnd = addMinutes(cursor, serviceDurationMinutes);
    const overlaps = busy.some((r) => isBefore(cursor, r.end) && isBefore(r.start, slotEnd));
    const inPast = isBefore(cursor, now);

    if (!overlaps && !inPast) {
      slots.push(cursor);
    }

    cursor = addMinutes(cursor, stepMinutes);
  }

  return slots;
}
