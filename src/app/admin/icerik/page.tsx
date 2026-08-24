import type { Metadata } from "next";
import { getActiveStaff, getShop } from "@/lib/shop";
import { getCurrentStaff } from "@/lib/auth";
import { getShopValues, getSitePhotos } from "@/lib/site-content";
import { ContentManager } from "./ContentManager";

export const metadata: Metadata = { title: "Site İçeriği" };

export default async function AdminIcerikPage() {
  const currentStaff = await getCurrentStaff();
  if (!currentStaff) return null;

  const [shop, values, photos, staff] = await Promise.all([
    getShop(),
    getShopValues(currentStaff.shop_id),
    getSitePhotos(currentStaff.shop_id),
    getActiveStaff(currentStaff.shop_id),
  ]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl">Site İçeriği</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Galeri ve Hakkımızda sayfalarında görünen metinler ve fotoğraflar.
        </p>
      </div>

      <ContentManager
        shop={shop}
        values={values}
        staff={staff}
        galleryPhotos={photos.filter((p) => p.placement === "gallery")}
        aboutPhoto={photos.find((p) => p.placement === "about") ?? null}
      />
    </div>
  );
}
