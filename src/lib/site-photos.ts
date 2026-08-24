/**
 * Fotoğraf yolu → URL. Bilinçli olarak bağımsız bir dosya: bu yardımcıyı
 * istemci bileşenleri de kullanıyor ve veri okuma fonksiyonlarının yanında
 * dursaydı `@supabase/supabase-js` tarayıcı paketine girerdi.
 */

/** Fotoğrafların yüklendiği Storage bucket'ı — public okuma açık. */
export const SITE_PHOTOS_BUCKET = "site-photos";

/**
 * Storage yolundan public URL üretir. Bucket public olduğu için imzalı
 * URL'e gerek yok; yol doğrudan CDN üzerinden servis edilir.
 */
export function sitePhotoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${SITE_PHOTOS_BUCKET}/${storagePath}`;
}
