import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Adres, telefon ve çalışma saatleri.",
};

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default async function IletisimPage() {
  const shop = await getShop();
  const hours = await getShopHours(shop.id);

  return (
    <>
      <SiteHeader shopName={shop.name} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-16 sm:py-24 w-full">
        <h1 className="text-4xl sm:text-5xl mb-10">İletişim</h1>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl mb-4">Bilgiler</h2>
            <dl className="grid gap-3 text-sm">
              {shop.address && (
                <div>
                  <dt className="text-fg-muted">Adres</dt>
                  <dd>{shop.address}</dd>
                </div>
              )}
              {shop.phone && (
                <div>
                  <dt className="text-fg-muted">Telefon</dt>
                  <dd>
                    <a href={`tel:${shop.phone}`} className="hover:text-accent">
                      {shop.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl mb-4">Çalışma Saatleri</h2>
            <div className="grid gap-2 text-sm">
              {hours.map((h) => (
                <div key={h.day_of_week} className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-fg-muted">{DAY_LABELS[h.day_of_week]}</span>
                  <span>
                    {h.is_closed || !h.opens_at || !h.closes_at
                      ? "Kapalı"
                      : `${h.opens_at.slice(0, 5)} – ${h.closes_at.slice(0, 5)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter shop={shop} />
    </>
  );
}
