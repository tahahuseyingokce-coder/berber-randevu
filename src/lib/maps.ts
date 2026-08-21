import type { Shop } from "@/lib/types";

/**
 * Google Haritalar gömme adresi.
 *
 * `output=embed` biçimi API anahtarı istemez — dükkan adresi yeterli.
 * Adresten türetilen konum bazen tam kapıyı göstermez; o yüzden panelden
 * girilen `maps_url` her zaman önceliklidir (Haritalar'da "Paylaş → Harita
 * yerleştir" ile alınan bağlantı).
 */
export function buildMapEmbedSrc(shop: Shop): string | null {
  const custom = normalizeGoogleMapsUrl(shop.maps_url);
  if (custom) return custom;

  if (!shop.address) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(shop.address)}&z=16&hl=tr&output=embed`;
}

/** "Yol Tarifi Al" bağlantısı — gömme değil, Haritalar uygulamasını açar. */
export function buildMapLinkHref(shop: Shop): string | null {
  if (!shop.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`;
}

/**
 * Panelden gelen bağlantıyı gömülebilir hale getirir.
 *
 * Yalnızca Google Haritalar alan adlarını kabul eder: iframe'e keyfi bir URL
 * yazılabilseydi, panele erişen biri sayfaya istediği içeriği gömebilirdi.
 * Kullanıcı çoğu zaman `<iframe src="...">` bloğunun tamamını değil, düz
 * bağlantıyı yapıştırır — ikisi de çalışsın diye src özniteliği ayıklanır.
 */
export function normalizeGoogleMapsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Yapıştırılan tam iframe kodundan src değerini çek.
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const candidate = srcMatch ? srcMatch[1] : trimmed;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const allowed =
    host === "www.google.com" ||
    host === "maps.google.com" ||
    host === "google.com" ||
    /^(www\.)?google\.[a-z.]+$/.test(host);

  if (!allowed || !url.pathname.startsWith("/maps")) return null;

  // /maps/embed zaten gömülebilir; diğer /maps bağlantılarına output=embed eklenir.
  if (!url.pathname.startsWith("/maps/embed") && !url.searchParams.has("output")) {
    url.searchParams.set("output", "embed");
  }

  return url.toString();
}
