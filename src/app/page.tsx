import Link from "next/link";
import { getActiveServices, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

export default async function Home() {
  const shop = await getShop();
  const [services, hours] = await Promise.all([
    getActiveServices(shop.id),
    getShopHours(shop.id),
  ]);

  return (
    <>
      <SiteHeader shopName={shop.name} />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-24 sm:py-32">
          <p className="text-accent text-sm font-medium tracking-wide uppercase mb-4">
            Online Randevu
          </p>
          <h1 className="text-5xl sm:text-7xl leading-[1.05] max-w-3xl mb-6">
            {shop.name}
          </h1>
          <p className="text-fg-muted text-lg max-w-xl mb-10">
            Birkaç tıkla randevunuzu alın, dükkana geldiğinizde sıra sizi bekliyor olsun.
          </p>
          <Link
            href="/randevu-al"
            className="inline-flex rounded-full bg-accent text-accent-fg px-8 py-4 text-base font-medium"
          >
            Randevu Al
          </Link>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 border-t border-border">
          <h2 className="text-3xl mb-8">Hizmetler</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4"
              >
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm text-fg-muted">{s.duration_minutes} dk</span>
                </span>
                {formatPrice(s.price) && (
                  <span className="text-accent">{formatPrice(s.price)}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 border-t border-border">
          <h2 className="text-3xl mb-8">Çalışma Saatleri</h2>
          <div className="grid gap-2 max-w-md">
            {hours.map((h) => (
              <div
                key={h.day_of_week}
                className="flex items-center justify-between text-sm border-b border-border py-2"
              >
                <span className="text-fg-muted">{DAY_LABELS[h.day_of_week]}</span>
                <span>
                  {h.is_closed || !h.opens_at || !h.closes_at
                    ? "Kapalı"
                    : `${h.opens_at.slice(0, 5)} – ${h.closes_at.slice(0, 5)}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter shop={shop} />
    </>
  );
}
