/**
 * Panel buton stilleri.
 *
 * Önceden her ekran kendi buton sınıflarını yazıyordu; ikincil eylemler
 * (Pasifleştir, Vazgeç, Sil) çerçevesiz `text-fg-muted` bağlantılar olduğu
 * için tıklanabilir olduğu anlaşılmıyordu. Buradaki her varyantın görünür
 * bir sınırı veya dolgusu var — eylem olduğu bir bakışta belli oluyor.
 *
 * Dokunma hedefi en az 40px: mobilde panel de kullanılıyor.
 */

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const size = "min-h-10 px-4 py-2";
const sizeSm = "min-h-9 px-3 py-1.5 text-xs";

/** Ekranın ana eylemi — sayfa başına bir tane. */
export const btnPrimary = `${base} ${size} bg-accent text-accent-fg shadow-sm hover:bg-accent-hover`;

/** Yan eylemler: Düzenle, Pasifleştir, Vazgeç. */
export const btnSecondary =
  `${base} ${size} border border-border-strong bg-surface text-fg ` +
  "hover:border-accent hover:text-accent";

/** Geri alınamayan eylemler. Dolgu değil çerçeve: yanlışlıkla tıklanmasın. */
export const btnDanger =
  `${base} ${size} border border-danger bg-surface text-danger ` +
  "hover:bg-danger hover:text-white";

/** Liste satırı içindeki küçük eylemler. */
export const btnPrimarySm = `${base} ${sizeSm} bg-accent text-accent-fg shadow-sm hover:bg-accent-hover`;

export const btnSecondarySm =
  `${base} ${sizeSm} border border-border-strong bg-surface text-fg ` +
  "hover:border-accent hover:text-accent";

export const btnDangerSm =
  `${base} ${sizeSm} border border-danger bg-surface text-danger ` +
  "hover:bg-danger hover:text-white";

/** Panel formlarındaki metin girişleri — tek yerden hizalansın. */
export const fieldClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg " +
  "outline-none transition-colors placeholder:text-fg-subtle focus:border-accent";
