import Link from "next/link";
import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Adres, telefon ve çalışma saatleri.",
};

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function IletisimPage() {
  const shop = await getShop();
  const hours = await getShopHours(shop.id);
  const ordered = DAY_ORDER.map((d) => hours.find((h) => h.day_of_week === d)).filter(Boolean);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
              Bize Ulaşın
            </p>
            <h1 className="mt-5 text-4xl sm:text-6xl">İletişim</h1>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
            <div className="border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Bilgiler
              </h2>

              <dl className="mt-6 space-y-6 text-sm">
                {shop.address && (
                  <div>
                    <dt className="text-fg-muted">Adres</dt>
                    <dd className="mt-1 leading-relaxed">{shop.address}</dd>
                  </div>
                )}
                {shop.phone && (
                  <div>
                    <dt className="text-fg-muted">Telefon</dt>
                    <dd className="mt-1">
                      <a
                        href={`tel:${shop.phone.replace(/\s/g, "")}`}
                        className="text-lg transition-colors hover:text-accent"
                      >
                        {shop.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {shop.phone && (
                <a
                  href={`tel:${shop.phone.replace(/\s/g, "")}`}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-sm border border-border-strong px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-fg sm:w-auto"
                >
                  Hemen Ara
                </a>
              )}
            </div>

            <div className="border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Çalışma Saatleri
              </h2>

              <dl className="mt-6 divide-y divide-border">
                {ordered.map((h) => (
                  <div key={h!.day_of_week} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-fg-muted">{DAY_LABELS[h!.day_of_week]}</dt>
                    <dd className="tabular-nums">
                      {h!.is_closed || !h!.opens_at || !h!.closes_at
                        ? "Kapalı"
                        : `${h!.opens_at.slice(0, 5)} – ${h!.closes_at.slice(0, 5)}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-bg-elevated">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Telefonla uğraşmayın</h2>
            <p className="mt-4 text-sm text-fg-muted">
              Randevunuzu siteden alın, onay e-postası gelsin.
            </p>
            <Link
              href="/randevu-al"
              className="mt-8 inline-flex items-center justify-center rounded-sm bg-accent px-8 py-4 text-sm font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Randevu Al
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter shop={shop} hours={hours} />
    </>
  );
}
