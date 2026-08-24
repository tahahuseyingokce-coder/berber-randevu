import Link from "next/link";
import type { Shop, ShopHour } from "@/lib/types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SiteFooter({ shop, hours = [] }: { shop: Shop; hours?: ShopHour[] }) {
  const ordered = DAY_ORDER.map((d) => hours.find((h) => h.day_of_week === d)).filter(
    (h): h is ShopHour => Boolean(h),
  );

  return (
    <footer className="mt-auto bg-invert-bg text-invert-fg">
      <div className="border-b-2 border-invert-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 md:grid-cols-3">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-lg font-black uppercase tracking-[-0.01em]">
                {shop.name}
              </p>
              <span className="h-2 w-2 bg-accent" aria-hidden="true" />
            </div>
            {shop.address && (
              <p className="mt-4 text-sm leading-relaxed text-invert-muted">{shop.address}</p>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone.replace(/\s/g, "")}`}
                className="mt-2 inline-block text-sm text-invert-muted transition-colors hover:text-white"
              >
                {shop.phone}
              </a>
            )}
          </div>

          {ordered.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-invert-muted">
                Çalışma Saatleri
              </h3>
              <dl className="mt-4 space-y-1.5 text-sm">
                {ordered.map((h) => (
                  <div key={h.day_of_week} className="flex justify-between gap-4">
                    <dt className="font-semibold">{DAY_LABELS[h.day_of_week]}</dt>
                    <dd className="text-invert-muted tabular-nums">
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
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-invert-muted">
              Bağlantılar
            </h3>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm font-semibold">
              <Link href="/hizmetler" className="transition-colors hover:text-invert-muted">
                Hizmetler
              </Link>
              <Link href="/galeri" className="transition-colors hover:text-invert-muted">
                Galeri
              </Link>
              <Link href="/hakkimizda" className="transition-colors hover:text-invert-muted">
                Hakkımızda
              </Link>
              <Link href="/iletisim" className="transition-colors hover:text-invert-muted">
                İletişim
              </Link>
              <Link href="/gizlilik" className="transition-colors hover:text-invert-muted">
                Gizlilik Politikası
              </Link>
            </nav>

            <Link
              href="/randevu-al"
              className="mt-6 inline-flex items-center bg-accent px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-white hover:text-invert-bg"
            >
              Randevu Al
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs uppercase tracking-wider text-invert-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {shop.name}
        </p>
        <p>Randevu ile çalışır</p>
      </div>
    </footer>
  );
}
