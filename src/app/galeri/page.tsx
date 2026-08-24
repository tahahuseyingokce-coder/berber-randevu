import Link from "next/link";
import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { getSitePhotos } from "@/lib/site-content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PhotoPlaceholder, SitePhoto } from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Salondan ve çalışmalarımızdan kareler.",
};

/**
 * Izgarada bazı hücreler iki sütun/satır kaplıyor. Fotoğraf sayısı
 * değiştikçe desen baştan tekrar eder, böylece 3 fotoğrafla da 12
 * fotoğrafla da düzen boşluksuz kapanır.
 */
const SPAN_PATTERN = [
  "col-span-2 row-span-2",
  "",
  "",
  "col-span-2",
  "",
  "",
  "col-span-2",
  "",
];

/** Henüz fotoğraf yüklenmemişse ızgaranın nasıl görüneceğini gösteren yer tutucular. */
const PLACEHOLDER_LABELS = [
  "Salon içi",
  "Saç kesimi",
  "Sakal tıraşı",
  "Fön / şekillendirme",
  "Bakım ürünleri",
  "Kesim detayı",
  "Ekip çalışırken",
  "Randevu köşesi",
];

export default async function GaleriPage() {
  const shop = await getShop();
  const [hours, photos] = await Promise.all([
    getShopHours(shop.id),
    getSitePhotos(shop.id, "gallery"),
  ]);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        {/* Başlık solda, açıklama sağda ve ikisi alt hizada — tasarımın
            tüm iç sayfalarında tekrar eden düzen. */}
        <section className="border-b-2 border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:items-end md:gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-fg-subtle">
                Galeri
              </p>
              <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
                İşin
                <br />
                kaydı.
              </h1>
            </div>
            <p className="max-w-[46ch] text-base leading-relaxed text-fg-muted">
              {photos.length > 0
                ? "Salondan ve müşterilerimizden kareler. Her kesim kendi hikâyesini anlatır."
                : "Fotoğraflar henüz eklenmedi — burası panelden yüklenecek görseller için ayrılmış alan."}
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid auto-rows-[160px] grid-cols-2 gap-0.5 bg-border p-0.5 sm:auto-rows-[238px] sm:grid-cols-4">
              {photos.length > 0
                ? photos.map((p, i) => (
                    <div
                      key={p.id}
                      className={`relative min-w-0 overflow-hidden ${
                        SPAN_PATTERN[i % SPAN_PATTERN.length]
                      }`}
                    >
                      <SitePhoto
                        storagePath={p.storage_path}
                        alt={p.alt}
                        placeholderLabel="Galeri"
                        sizes="(max-width: 640px) 50vw, 25vw"
                        priority={i === 0}
                      />
                    </div>
                  ))
                : PLACEHOLDER_LABELS.map((label, i) => (
                    <div
                      key={label}
                      className={`relative min-w-0 overflow-hidden ${
                        SPAN_PATTERN[i % SPAN_PATTERN.length]
                      }`}
                    >
                      <PhotoPlaceholder label={label} />
                    </div>
                  ))}
            </div>
          </div>
        </section>

        <section className="border-t-2 border-border bg-bg-elevated">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Yerinde görün, yerinizi ayırtın.</h2>
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
