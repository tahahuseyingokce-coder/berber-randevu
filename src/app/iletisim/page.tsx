import Link from "next/link";
import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildMapEmbedSrc, buildMapLinkHref } from "@/lib/maps";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Adres, telefon, konum ve çalışma saatleri.",
};

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function IletisimPage() {
  const shop = await getShop();
  const hours = await getShopHours(shop.id);
  const ordered = DAY_ORDER.map((d) => hours.find((h) => h.day_of_week === d)).filter(Boolean);

  const mapSrc = buildMapEmbedSrc(shop);
  const mapLink = buildMapLinkHref(shop);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="on-invert bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-invert-muted">
              Bize Ulaşın
            </p>
            <h1 className="mt-5 text-5xl sm:text-7xl">İletişim</h1>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2">
            <div className="border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
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

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center justify-center rounded-sm bg-accent px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
                  >
                    Hemen Ara
                  </a>
                )}
                {mapLink && (
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-sm border border-border-strong px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-accent hover:text-accent"
                  >
                    Yol Tarifi Al
                  </a>
                )}
              </div>
            </div>

            <div className="border border-border bg-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-highlight">
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

        {/* ---------------- Konum ---------------- */}
        {mapSrc && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
              <h2 className="text-3xl sm:text-4xl">Konum</h2>
              <span className="mt-5 block h-1 w-16 bg-highlight" />

              <div className="mt-8 overflow-hidden border border-border bg-bg-elevated">
                <iframe
                  src={mapSrc}
                  title={`${shop.name} konumu — Google Haritalar`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="block h-[320px] w-full border-0 sm:h-[440px]"
                />
              </div>
            </div>
          </section>
        )}

        <section className="on-invert border-t border-border bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Telefonla uğraşmayın</h2>
            <p className="mt-4 text-sm text-invert-muted">
              Randevunuzu siteden alın, onay e-postası gelsin.
            </p>
            <Link
              href="/randevu-al"
              className="mt-8 inline-flex items-center justify-center rounded-sm bg-invert-fg px-8 py-4 text-sm font-semibold uppercase tracking-wider text-invert-bg transition-opacity hover:opacity-85"
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
