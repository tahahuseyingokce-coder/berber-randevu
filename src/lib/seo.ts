import type { Shop, ShopHour } from "@/lib/types";

const SCHEMA_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * schema.org HairSalon yapılandırılmış verisi — Google'ın adres/telefon/
 * çalışma saatleri bilgisini arama sonuçlarında zengin kart olarak
 * gösterebilmesi için.
 */
export function buildLocalBusinessJsonLd(shop: Shop, hours: ShopHour[]) {
  const siteUrl = getSiteUrl();

  const openingHoursSpecification = hours
    .filter((h) => !h.is_closed && h.opens_at && h.closes_at)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY_NAMES[h.day_of_week],
      opens: h.opens_at!.slice(0, 5),
      closes: h.closes_at!.slice(0, 5),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: shop.name,
    url: siteUrl,
    telephone: shop.phone ?? undefined,
    address: shop.address
      ? {
          "@type": "PostalAddress",
          streetAddress: shop.address,
        }
      : undefined,
    openingHoursSpecification,
  };
}
