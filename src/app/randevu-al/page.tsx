import { getActiveServices, getActiveStaff, getShop } from "@/lib/shop";
import { BookingForm } from "./BookingForm";

export default async function RandevuAlPage() {
  const shop = await getShop();
  const [services, staff] = await Promise.all([
    getActiveServices(shop.id),
    getActiveStaff(shop.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-5xl mb-8">Randevu Al</h1>
      <BookingForm services={services} staff={staff} timezone={shop.timezone} />
    </main>
  );
}
