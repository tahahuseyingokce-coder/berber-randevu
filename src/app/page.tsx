import Link from "next/link";
import { getActiveServices, getActiveStaff, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoPlaceholder, SitePhoto } from "@/components/PhotoPlaceholder";
import { getSitePhotos } from "@/lib/site-content";
import { buildLocalBusinessJsonLd } from "@/lib/seo";

/** Anasayfada galeriden bu kadar kare gösterilir; tamamı /galeri sayfasında. */
const HOME_GALLERY_LIMIT = 4;

/** Henüz fotoğraf yüklenmemişse gösterilen yer tutucu etiketleri. */
const GALLERY_PLACEHOLDERS = ["Salon içi", "Saç kesimi", "Sakal tıraşı", "Ekip çalışırken"];

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
  const [services, staff, hours, galleryPhotos] = await Promise.all([
    getActiveServices(shop.id),
    getActiveStaff(shop.id),
    getShopHours(shop.id),
    getSitePhotos(shop.id, "gallery"),
  ]);

  const galleryPreview = galleryPhotos.slice(0, HOME_GALLERY_LIMIT);

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
                className="inline-flex items-center justify-center bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-white hover:text-invert-bg"
              >
                Randevu Al
              </Link>
              <Link
                href="/hizmetler"
                className="inline-flex items-center justify-center border-2 border-invert-fg px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-invert-fg transition-colors hover:bg-invert-fg hover:text-invert-bg"
              >
                Hizmetleri Gör
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Niyetle kesim ---------------- */}
        <section className="border-b-2 border-border">
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
                className="inline-flex items-center bg-accent px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
              >
                Randevu Al
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Hizmetler ---------------- */}
        {featuredServices.length > 0 && (
          <section className="border-b-2 border-border">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Hizmetler</h2>
              <p className="mt-4 text-sm text-fg-muted">
                Her hizmetin süresi bellidir — randevunuz o süreye göre ayrılır.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredServices.map((s) => (
                  <article
                    key={s.id}
                    className="flex flex-col border-2 border-border bg-surface p-6 transition-colors hover:bg-bg-elevated"
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
                      className="mt-6 inline-flex text-xs font-extrabold uppercase tracking-wider text-accent underline-offset-4 hover:underline"
                    >
                      Randevu Al →
                    </Link>
                  </article>
                ))}
              </div>

              {hasMoreServices && (
                <Link
                  href="/hizmetler"
                  className="mt-10 inline-flex items-center border-2 border-border-strong px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors hover:border-accent hover:text-accent"
                >
                  Tüm hizmetleri gör ({services.length})
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ---------------- Ters bant: hakkımızda ---------------- */}
        <section className="on-invert border-b-2 border-border bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-invert-muted">
              Hakkımızda
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl">
              {shop.about_title?.trim() || "Kesim bir zanaattır."}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-invert-muted">
              {shop.about_body?.trim() ||
                "Randevunuzu aldığınız andan koltuktan kalktığınız ana kadar her adım belli. Ölçüyoruz, danışıyoruz, sonra kesiyoruz — sonucun her defasında aynı kalması için."}
            </p>
            <Link
              href="/hakkimizda"
              className="mt-8 inline-flex items-center justify-center border-2 border-invert-fg px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-invert-fg transition-colors hover:bg-invert-fg hover:text-invert-bg"
            >
              Bizi Tanıyın
            </Link>
          </div>
        </section>

        {/* ---------------- Galeri ---------------- */}
        <section className="border-b-2 border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl">Galeri</h2>
              <Link
                href="/galeri"
                className="text-xs font-extrabold uppercase tracking-wider text-accent hover:underline"
              >
                Tümünü Gör →
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-0.5 bg-border p-0.5 sm:grid-cols-4">
              {galleryPreview.length > 0
                ? galleryPreview.map((p) => (
                    <div key={p.id} className="relative h-48 min-w-0 overflow-hidden">
                      <SitePhoto
                        storagePath={p.storage_path}
                        alt={p.alt}
                        placeholderLabel="Galeri"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                  ))
                : GALLERY_PLACEHOLDERS.map((label) => (
                    <div key={label} className="relative h-48 min-w-0 overflow-hidden">
                      <PhotoPlaceholder label={label} />
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* ---------------- Ekip ---------------- */}
        {staff.length > 0 && (
          <section className="border-b-2 border-border">
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
                    className="border-t-2 border-accent bg-surface px-6 py-8 text-center"
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
          <section className="border-b-2 border-border">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2 md:gap-16">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl">Çalışma Saatleri</h2>
                <span className="mt-6 block h-1 w-16 bg-accent" />
                {shop.address && (
                  <p className="mt-6 text-sm leading-relaxed text-fg-muted">{shop.address}</p>
                )}
              </div>

              <dl className="divide-y-2 divide-border border-y-2 border-border">
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
              className="mt-9 inline-flex items-center justify-center bg-accent px-10 py-4 text-sm font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
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
