import type { Metadata } from "next";
import { getActiveServices, getActiveStaff, getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookingForm } from "./BookingForm";

export const metadata: Metadata = {
  title: "Randevu Al",
  description: "Birkaç adımda online randevunuzu oluşturun.",
};

export default async function RandevuAlPage() {
  const shop = await getShop();
  const [services, staff, hours] = await Promise.all([
    getActiveServices(shop.id),
    getActiveStaff(shop.id),
    getShopHours(shop.id),
  ]);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
              4 Adım
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl">Randevu Al</h1>
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <BookingForm services={services} staff={staff} timezone={shop.timezone} />
        </div>
      </main>

      <SiteFooter shop={shop} hours={hours} />
    </>
  );
}
