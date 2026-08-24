import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { getCurrentStaff } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function AdminAyarlarPage() {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return null;

  const [shop, hours] = await Promise.all([getShop(), getShopHours(currentStaff.shop_id)]);

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl">Ayarlar</h1>
      <SettingsForm shop={shop} hours={hours} />
    </div>
  );
}
