import Link from "next/link";
import { getActiveServices, getActiveStaff, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildLocalBusinessJsonLd } from "@/lib/seo";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Ana sayfada vitrin var, katalog değil — tamamı /hizmetler sayfasında. */
const HOME_SERVICE_LIMIT = 6;

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function Home() {
  const shop = await getShop();
  const [services, staff, hours] = await Promise.all([
    getActiveServices(shop.id),
    getActiveStaff(shop.id),
    getShopHours(shop.id),
  ]);

  const jsonLd = buildLocalBusinessJsonLd(shop, hours);
  const orderedHours = DAY_ORDER.map((d) => hours.find((h) => h.day_of_week === d)).filter(Boolean);

  const featuredServices = services.slice(0, HOME_SERVICE_LIMIT);
  const hasMoreServices = services.length > HOME_SERVICE_LIMIT;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="on-invert bg-invert-bg text-invert-fg">
          <div className="mx-auto flex min-h-[78svh] w-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 sm:py-32">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-invert-muted">
              Online Randevu
            </p>

            <h1 className="mt-6 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">
              Sadece bir kesim değil.
              <span className="mt-1 block text-highlight">Bir standart.</span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-invert-muted sm:text-lg">
              Sıra beklemeyin. Randevunuzu birkaç tıkla alın, geldiğinizde koltuk sizi
              bekliyor olsun.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/randevu-al"
                className="inline-flex items-center justify-center rounded-sm bg-invert-fg px-8 py-4 text-sm font-semibold uppercase tracking-wider text-invert-bg transition-opacity hover:opacity-85"
              >
                Randevu Al
              </Link>
              <Link
                href="/hizmetler"
                className="inline-flex items-center justify-center rounded-sm border border-invert-muted px-8 py-4 text-sm font-semibold uppercase tracking-wider text-invert-fg transition-colors hover:border-invert-fg"
              >
                Hizmetleri Gör
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Niyetle kesim ---------------- */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Özenle, aceleye getirmeden</h2>
              <span className="mt-6 block h-1 w-16 bg-highlight" />
            </div>
            <div className="flex flex-col items-start gap-6">
              <p className="text-base leading-relaxed text-fg-muted">
                Her randevu tek kişiye ayrılmış zamandır. Ne aceleye gelir, ne de sıraya. Kesim
                boyunca tek işimiz sizsiniz — sonucun her defasında aynı kalması için.
              </p>
              <Link
                href="/randevu-al"
                className="inline-flex items-center rounded-sm bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
              >
                Randevu Al
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Hizmetler ---------------- */}
        {featuredServices.length > 0 && (
          <section className="border-b border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Hizmetler</h2>
              <p className="mt-4 text-sm text-fg-muted">
                Her hizmetin süresi bellidir — randevunuz o süreye göre ayrılır.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredServices.map((s) => (
                  <article
                    key={s.id}
                    className="flex flex-col border border-border bg-surface p-6 transition-colors hover:border-accent"
                  >
                    <h3 className="text-xl">{s.name}</h3>
                    <p className="mt-2 text-sm text-fg-muted">
                      {s.duration_minutes} dakikalık randevu.
                    </p>
                    {formatPrice(s.price) && (
                      <p className="mt-4 font-display text-3xl text-highlight tabular-nums">
                        {formatPrice(s.price)}
                      </p>
                    )}
                    <Link
                      href="/randevu-al"
                      className="mt-6 inline-flex text-xs font-semibold uppercase tracking-wider text-accent underline-offset-4 hover:underline"
                    >
                      Randevu Al →
                    </Link>
                  </article>
                ))}
              </div>

              {hasMoreServices && (
                <Link
                  href="/hizmetler"
                  className="mt-10 inline-flex items-center rounded-sm border border-border-strong px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-accent hover:text-accent"
                >
                  Tüm hizmetleri gör ({services.length})
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ---------------- Ters bant: deneyim ---------------- */}
        <section className="on-invert bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl">Deneyim</h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-invert-muted">
              Randevunuzu aldığınız andan koltuktan kalktığınız ana kadar her adım belli.
              Ne zaman geleceğinizi, kimin ilgileneceğini ve ne kadar süreceğini önceden
              bilirsiniz.
            </p>
          </div>
        </section>

        {/* ---------------- Ekip ---------------- */}
        {staff.length > 0 && (
          <section className="border-b border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">Ekibimiz</h2>
                <p className="mt-4 text-sm text-fg-muted">
                  Randevu alırken dilediğiniz ustayı seçebilirsiniz.
                </p>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((p) => (
                  <div
                    key={p.id}
                    className="border-t-2 border-highlight bg-surface px-6 py-8 text-center"
                  >
                    <h3 className="text-lg">{p.full_name}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Çalışma saatleri ---------------- */}
        {orderedHours.length > 0 && (
          <section className="border-b border-border">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-16">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">Çalışma Saatleri</h2>
                <span className="mt-6 block h-1 w-16 bg-highlight" />
                {shop.address && (
                  <p className="mt-6 text-sm leading-relaxed text-fg-muted">{shop.address}</p>
                )}
              </div>

              <dl className="divide-y divide-border border-y border-border">
                {orderedHours.map((h) => (
                  <div key={h!.day_of_week} className="flex justify-between gap-4 py-3.5 text-sm">
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
          </section>
        )}

        {/* ---------------- Kapanış CTA ---------------- */}
        <section className="bg-bg-elevated">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl">Yerinizi ayırtın.</h2>
            <p className="mx-auto mt-5 max-w-md text-base text-fg-muted">
              Uygun saati seçin, gerisini biz halledelim.
            </p>
            <Link
              href="/randevu-al"
              className="mt-9 inline-flex items-center justify-center rounded-sm bg-accent px-10 py-4 text-sm font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
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
