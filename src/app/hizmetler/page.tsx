import Link from "next/link";
import type { Metadata } from "next";
import { getActiveServices, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";

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
  const [services, hours] = await Promise.all([
    getActiveServices(shop.id),
    getShopHours(shop.id),
  ]);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
              Ne Yapıyoruz
            </p>
            <h1 className="mt-5 text-4xl sm:text-6xl">Hizmetler</h1>
            <p className="mt-5 max-w-lg text-base text-fg-muted">
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
                    className="flex flex-col border border-border bg-surface transition-colors hover:border-accent"
                  >
                    <PlaceholderImage
                      label={s.name}
                      initial={s.name.charAt(0)}
                      aspect="aspect-[4/3]"
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-xl">{s.name}</h2>
                      <p className="mt-2 text-sm text-fg-muted">{s.duration_minutes} dakika</p>

                      {formatPrice(s.price) && (
                        <p className="mt-4 font-display text-3xl font-bold text-accent tabular-nums">
                          {formatPrice(s.price)}
                        </p>
                      )}

                      <Link
                        href="/randevu-al"
                        className="mt-6 inline-flex items-center justify-center rounded-sm bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
                      >
                        Randevu Al
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-bg-elevated">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Hangisini istediğinize karar verdiniz mi?</h2>
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
