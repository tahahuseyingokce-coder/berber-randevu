import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { listAppointments, type AppointmentRow } from "@/lib/panel-data";

export type DayBucket = {
  /** Dükkanın yerel tarihine göre "yyyy-MM-dd". */
  date: string;
  label: string;
  count: number;
};

export type DashboardStats = {
  todayCount: number;
  pendingCount: number;
  weekRevenue: number;
  upcoming: DayBucket[];
  todayAppointments: AppointmentRow[];
};

/**
 * Gün/hafta sınırları dükkanın IANA timezone'ına göre hesaplanır — sunucunun
 * (Vercel'de UTC) yerel saatine göre değil. Aksi halde akşam saatlerinde
 * "bugün" yanlış güne kayabilir.
 */
function shopDayRange(timezone: string, dayOffset = 0) {
  const nowInShop = toZonedTime(new Date(), timezone);
  const target = addDays(nowInShop, dayOffset);
  const dayStr = format(target, "yyyy-MM-dd");

  return {
    dayStr,
    from: fromZonedTime(`${dayStr}T00:00:00`, timezone),
    to: fromZonedTime(`${format(endOfDay(target), "yyyy-MM-dd")}T23:59:59.999`, timezone),
  };
}

export async function getDashboardStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  timezone: string,
  options: { includeRevenue?: boolean } = {},
): Promise<DashboardStats> {
  const nowInShop = toZonedTime(new Date(), timezone);

  const today = shopDayRange(timezone, 0);

  const weekStartStr = format(startOfWeek(nowInShop, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEndStr = format(endOfWeek(nowInShop, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekFrom = fromZonedTime(`${weekStartStr}T00:00:00`, timezone);
  const weekTo = fromZonedTime(`${weekEndStr}T23:59:59.999`, timezone);

  const horizonEnd = shopDayRange(timezone, 6).to;

  const [todayAppointments, pending, weekAppointments, upcomingAppointments] = await Promise.all([
    listAppointments(supabase, {
      from: today.from.toISOString(),
      to: today.to.toISOString(),
      status: ["pending", "confirmed", "completed"],
    }),
    listAppointments(supabase, { status: ["pending"] }),
    options.includeRevenue
      ? listAppointments(supabase, {
          from: weekFrom.toISOString(),
          to: weekTo.toISOString(),
          status: ["confirmed", "completed"],
        })
      : Promise.resolve([]),
    listAppointments(supabase, {
      from: startOfDay(new Date()).toISOString(),
      to: horizonEnd.toISOString(),
      status: ["pending", "confirmed", "completed"],
    }),
  ]);

  const weekRevenue = weekAppointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);

  // Önümüzdeki 7 gün için kova hazırla, sonra randevuları dükkan saatine göre yerleştir.
  const buckets = new Map<string, DayBucket>();
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(nowInShop, i);
    const key = format(d, "yyyy-MM-dd");
    buckets.set(key, { date: key, label: format(d, "d"), count: 0 });
  }

  for (const a of upcomingAppointments) {
    const key = format(toZonedTime(new Date(a.starts_at), timezone), "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return {
    todayCount: todayAppointments.length,
    pendingCount: pending.length,
    weekRevenue,
    upcoming: [...buckets.values()],
    todayAppointments,
  };
}
