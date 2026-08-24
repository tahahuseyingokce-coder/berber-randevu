import Link from "next/link";
import type { Metadata } from "next";
import { getActiveServices, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Hizmetler",
  description: "Sunduğumuz hizmetler, süreleri ve fiyatları.",
};

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function HizmetlerPage() {
  const shop = await getShop();
  // Ana sayfa ilk 6 hizmeti gösteriyor; burada katalogun tamamı listelenir.
  const [services, hours] = await Promise.all([
    getActiveServices(shop.id),
    getShopHours(shop.id),
  ]);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="on-invert bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-invert-muted">
              Ne Yapıyoruz
            </p>
            <h1 className="mt-5 text-5xl sm:text-7xl">Hizmetler</h1>
            <p className="mt-5 max-w-lg text-base text-invert-muted">
              Her hizmetin süresi bellidir — randevunuz o süreye göre ayrılır.
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            {services.length === 0 ? (
              <p className="text-sm text-fg-muted">Henüz hizmet tanımlanmamış.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <article
                    key={s.id}
                    className="flex flex-col border-2 border-border bg-surface p-6 transition-colors hover:bg-bg-elevated"
                  >
                    <h2 className="text-xl font-semibold">{s.name}</h2>
                    <p className="mt-2 text-sm text-fg-muted">{s.duration_minutes} dakika</p>

                    {formatPrice(s.price) && (
                      <p className="mt-4 font-display text-3xl text-highlight tabular-nums">
                        {formatPrice(s.price)}
                      </p>
                    )}

                    {/* Kartlar farklı yükseklikte olabilir — esneyen boşluk
                        butonu her kartta en alta hizalar. */}
                    <span className="min-h-6 flex-1" aria-hidden="true" />

                    <Link
                      href="/randevu-al"
                      className="inline-flex items-center justify-center bg-accent px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
                    >
                      Randevu Al
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t-2 border-border bg-bg-elevated">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Hangisini istediğinize karar verdiniz mi?</h2>
            <Link
              href="/randevu-al"
              className="mt-8 inline-flex items-center justify-center bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
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
