import Link from "next/link";
import type { Metadata } from "next";
import { getActiveStaff, getShop, getShopHours } from "@/lib/shop";
import { getShopValues, getSitePhotos } from "@/lib/site-content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SitePhoto } from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Çalışma prensiplerimiz ve ekibimiz.",
};

export default async function HakkimizdaPage() {
  const shop = await getShop();
  const [staff, hours, values, aboutPhotos] = await Promise.all([
    getActiveStaff(shop.id),
    getShopHours(shop.id),
    getShopValues(shop.id),
    getSitePhotos(shop.id, "about"),
  ]);

  const aboutPhoto = aboutPhotos[0] ?? null;

  // Panelden metin girilmediyse dükkan adından türeyen bir varsayılan kalır;
  // sayfa hiçbir dükkanda boş görünmesin.
  const title = shop.about_title?.trim() || "Kesim bir zanaattır.";
  const body =
    shop.about_body?.trim() ||
    `${shop.name}, kesimin bir hizmet değil bir zanaat olduğunu düşünür: ölçer, danışır, sonra keser.`;

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="border-b-2 border-border">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:items-end md:gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-fg-subtle">
                Hakkımızda
              </p>
              <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
            </div>
            <p className="max-w-[46ch] text-base leading-relaxed text-fg-muted">{body}</p>
          </div>
        </section>

        {values.length > 0 && (
          <section className="border-b-2 border-border">
            <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
              <div className="relative h-72 min-w-0 overflow-hidden border-b-2 border-border md:h-auto md:border-b-0 md:border-r-2">
                <SitePhoto
                  storagePath={aboutPhoto?.storage_path}
                  alt={aboutPhoto?.alt}
                  placeholderLabel="Salon fotoğrafı"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col gap-7 px-4 py-10 sm:px-6 md:py-14 md:pl-14">
                {values.map((v) => (
                  <div key={v.id} className="border-t-2 border-bg-elevated pt-5">
                    <h3 className="text-xl">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{v.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {staff.length > 0 && (
          <section>
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.16em]">Ekip</h2>

              <div className="mt-10 grid grid-cols-2 gap-0.5 bg-border p-0.5 sm:grid-cols-4">
                {staff.map((p) => (
                  <div key={p.id} className="flex flex-col bg-surface">
                    <div className="relative h-56 min-w-0 overflow-hidden border-b-2 border-border sm:h-[300px]">
                      <SitePhoto
                        storagePath={p.photo_path}
                        alt={p.full_name}
                        placeholderLabel="Portre"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="px-5 py-6">
                      <p className="text-xl font-extrabold tracking-[-0.015em]">{p.full_name}</p>
                      {p.title && (
                        <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.1em] text-accent">
                          {p.title}
                        </p>
                      )}
                      {p.bio && (
                        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{p.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="on-invert border-t-2 border-border bg-invert-bg text-invert-fg">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl sm:text-4xl">Bir seans ayırtın.</h2>
            <Link
              href="/randevu-al"
              className="mt-8 inline-flex items-center justify-center bg-accent px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-white hover:text-invert-bg"
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
