import type { Metadata } from "next";
import { getActiveServices, getActiveStaff } from "@/lib/shop";
import { getCurrentStaff } from "@/lib/auth";
import { ManualBookingForm } from "./ManualBookingForm";

export const metadata: Metadata = { title: "Manuel Randevu Ekle" };

export default async function AdminYeniRandevuPage() {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return null;

  const [services, staff] = await Promise.all([
    getActiveServices(currentStaff.shop_id),
    getActiveStaff(currentStaff.shop_id),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl mb-1">Manuel Randevu Ekle</h1>
        <p className="text-fg-muted text-sm">
          Telefonla alınan randevular için — otomatik onaylı olarak oluşturulur.
        </p>
      </div>
      <ManualBookingForm services={services} staff={staff} />
    </div>
  );
}
