import Link from "next/link";
import { getActiveServices, getShop } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

export default async function HizmetlerPage() {
  const shop = await getShop();
  const services = await getActiveServices(shop.id);

  return (
    <>
      <SiteHeader shopName={shop.name} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-16 sm:py-24 w-full">
        <h1 className="text-4xl sm:text-5xl mb-10">Hizmetler</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <Link
              key={s.id}
              href="/randevu-al"
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 hover:border-accent transition-colors"
            >
              <span>
                <span className="block font-medium">{s.name}</span>
                <span className="block text-sm text-fg-muted">{s.duration_minutes} dk</span>
              </span>
              {formatPrice(s.price) && <span className="text-accent">{formatPrice(s.price)}</span>}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter shop={shop} />
    </>
  );
}
