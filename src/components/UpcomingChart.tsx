import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { DayBucket } from "@/lib/dashboard-stats";

/**
 * Önümüzdeki 7 günün randevu dağılımı. Tek seri olduğu için lejant yok —
 * başlık seriyi zaten adlandırıyor. Değerler doğrudan çubuğun üstünde;
 * eksen/ızgara geri planda kalır.
 */
export function UpcomingChart({ data }: { data: DayBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  // Not: çubuk kapsayıcısı items-stretch (varsayılan) kalmalı. items-end
  // verilirse sütunlar içerik yüksekliğinde kalır ve çubukların yüzde
  // yüksekliği 0'a düşer — hizalama çubukların kendi içinde yapılır.

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-lg">Önümüzdeki 7 Gün</h2>
        <span className="text-fg-muted text-sm tabular-nums">{total} randevu</span>
      </div>

      {total === 0 ? (
        <p className="text-fg-muted text-sm">Önümüzdeki 7 gün için randevu yok.</p>
      ) : (
        <div className="flex gap-2 h-40" role="img" aria-label="Günlük randevu dağılımı">
          {data.map((d) => {
            const day = parseISO(d.date);
            const heightPct = (d.count / max) * 100;

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 min-w-0 h-full">
                <span
                  className={`text-xs tabular-nums ${
                    d.count > 0 ? "text-fg" : "text-fg-subtle"
                  }`}
                >
                  {d.count}
                </span>

                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t bg-accent transition-[height]"
                    style={{ height: `${Math.max(heightPct, d.count > 0 ? 6 : 0)}%` }}
                    title={`${format(day, "d MMMM EEEE", { locale: tr })}: ${d.count} randevu`}
                  />
                </div>

                <div className="text-center leading-tight">
                  <div className="text-xs text-fg-muted tabular-nums">{format(day, "d")}</div>
                  <div className="text-[10px] text-fg-subtle uppercase tracking-wide">
                    {format(day, "EEE", { locale: tr })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
