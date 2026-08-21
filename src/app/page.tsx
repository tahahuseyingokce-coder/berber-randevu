import Link from "next/link";
import { getActiveServices, getActiveStaff, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { buildLocalBusinessJsonLd } from "@/lib/seo";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="relative flex min-h-[85svh] items-center overflow-hidden">
          <div className="photo-placeholder absolute inset-0" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/60 to-bg"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
              Online Randevu
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Sadece bir kesim değil.
              <span className="block text-accent">Bir standart.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">
              Sıra beklemeyin. Randevunuzu birkaç tıkla alın, geldiğinizde koltuk sizi
              bekliyor olsun.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/randevu-al"
                className="inline-flex items-center justify-center rounded-sm bg-accent px-8 py-4 text-sm font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
              >
                Randevu Al
              </Link>
              <Link
                href="/hizmetler"
                className="inline-flex items-center justify-center rounded-sm border border-border-strong px-8 py-4 text-sm font-semibold uppercase tracking-wider text-fg transition-colors hover:border-fg"
              >
                Hizmetleri Gör
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Niyetle kesim ---------------- */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Özenle, aceleye getirmeden</h2>
              <span className="mt-6 block h-0.5 w-16 bg-accent" />
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
        {services.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Hizmetler</h2>
              <p className="mt-4 text-sm text-fg-muted">
                Her hizmetin süresi bellidir — randevunuz o süreye göre ayrılır.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <article
                    key={s.id}
                    className="group border border-border bg-surface transition-colors hover:border-accent"
                  >
                    <PlaceholderImage
                      label={s.name}
                      initial={s.name.charAt(0)}
                      aspect="aspect-[4/3]"
                    />
                    <div className="p-6">
                      <h3 className="text-xl">{s.name}</h3>
                      <p className="mt-2 text-sm text-fg-muted">
                        {s.duration_minutes} dakikalık randevu.
                        {formatPrice(s.price) ? ` ${formatPrice(s.price)}.` : ""}
                      </p>
                      <Link
                        href="/randevu-al"
                        className="mt-5 inline-flex text-xs font-semibold uppercase tracking-wider text-accent"
                      >
                        Randevu Al →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Açık bant: deneyim ---------------- */}
        <section className="bg-light-bg text-light-fg">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl">Deneyim</h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-light-muted">
              Randevunuzu aldığınız andan koltuktan kalktığınız ana kadar her adım belli.
              Ne zaman geleceğinizi, kimin ilgileneceğini ve ne kadar süreceğini önceden
              bilirsiniz.
            </p>
          </div>
        </section>

        {/* ---------------- Ekip ---------------- */}
        {staff.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">Ekibimiz</h2>
                <p className="mt-4 text-sm text-fg-muted">
                  Randevu alırken dilediğiniz ustayı seçebilirsiniz.
                </p>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((p) => (
                  <div key={p.id} className="border border-border bg-surface">
                    <PlaceholderImage
                      label={p.full_name}
                      initial={p.full_name.charAt(0)}
                      aspect="aspect-[4/5]"
                    />
                    <div className="p-5">
                      <h3 className="text-lg">{p.full_name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Fiyatlar ---------------- */}
        {services.some((s) => s.price !== null) && (
          <section className="border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Fiyatlar</h2>
              <p className="mt-4 text-sm text-fg-muted">
                Sürpriz yok. Ödeme dükkanda, nakit veya kart.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services
                  .filter((s) => s.price !== null)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col border border-border bg-surface p-6 transition-colors hover:border-accent"
                    >
                      <h3 className="text-lg">{s.name}</h3>
                      <p className="mt-4 font-display text-4xl font-bold text-accent tabular-nums">
                        {formatPrice(s.price)}
                      </p>
                      <p className="mt-2 text-sm text-fg-muted">{s.duration_minutes} dakika</p>
                      <Link
                        href="/randevu-al"
                        className="mt-6 inline-flex items-center justify-center rounded-sm bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
                      >
                        Randevu Al
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- Çalışma saatleri ---------------- */}
        {orderedHours.length > 0 && (
          <section className="border-t border-border">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-16">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">Çalışma Saatleri</h2>
                <span className="mt-6 block h-0.5 w-16 bg-accent" />
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
        <section className="border-t border-border bg-bg-elevated">
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
