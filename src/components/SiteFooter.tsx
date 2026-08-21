import Link from "next/link";
import type { Shop, ShopHour } from "@/lib/types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SiteFooter({ shop, hours = [] }: { shop: Shop; hours?: ShopHour[] }) {
  const ordered = DAY_ORDER.map((d) => hours.find((h) => h.day_of_week === d)).filter(
    (h): h is ShopHour => Boolean(h),
  );

  return (
    <footer className="mt-auto">
      <div className="border-t border-border bg-bg-elevated">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-[0.16em]">
              {shop.name}
            </p>
            {shop.address && (
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">{shop.address}</p>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone.replace(/\s/g, "")}`}
                className="mt-2 inline-block text-sm text-fg-muted transition-colors hover:text-accent"
              >
                {shop.phone}
              </a>
            )}
          </div>

          {ordered.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Çalışma Saatleri
              </h3>
              <dl className="mt-4 space-y-1.5 text-sm">
                {ordered.map((h) => (
                  <div key={h.day_of_week} className="flex justify-between gap-4">
                    <dt className="text-fg-muted">{DAY_LABELS[h.day_of_week]}</dt>
                    <dd className="tabular-nums">
                      {h.is_closed || !h.opens_at || !h.closes_at
                        ? "Kapalı"
                        : `${h.opens_at.slice(0, 5)} – ${h.closes_at.slice(0, 5)}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Bağlantılar
            </h3>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm">
              <Link href="/hizmetler" className="text-fg-muted transition-colors hover:text-fg">
                Hizmetler
              </Link>
              <Link href="/iletisim" className="text-fg-muted transition-colors hover:text-fg">
                İletişim
              </Link>
              <Link href="/gizlilik" className="text-fg-muted transition-colors hover:text-fg">
                Gizlilik Politikası
              </Link>
            </nav>

            <Link
              href="/randevu-al"
              className="mt-6 inline-flex items-center rounded-sm bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Randevu Al
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-accent-fg sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {shop.name}
          </p>
          <p className="opacity-85">Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
