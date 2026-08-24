/**
 * Dükkana göre renk paleti.
 *
 * Dükkan sahibi yalnızca iki renk seçiyor: vurgu ve mürekkep. Geri kalan
 * tonlar burada türetiliyor. Sebebi okunabilirlik: serbest bırakılsaydı
 * açık sarı vurgu üzerine beyaz yazı gibi okunmaz kombinasyonlar
 * seçilebilirdi. Yazı rengi arka planın parlaklığına göre otomatik
 * seçiliyor.
 */

export const VARSAYILAN_ACCENT = "#ba1200";
export const VARSAYILAN_INK = "#031927";

/** Panelde tek tıkla seçilebilen hazır paletler. */
export const HAZIR_PALETLER: Array<{ ad: string; accent: string; ink: string }> = [
  { ad: "Klasik (kırmızı · lacivert)", accent: "#ba1200", ink: "#031927" },
  { ad: "Antrasit · turuncu", accent: "#c2410c", ink: "#1c1917" },
  { ad: "Zeytin · krem", accent: "#4d7c0f", ink: "#1a2e05" },
  { ad: "Bordo · kömür", accent: "#9f1239", ink: "#18181b" },
  { ad: "Petrol · altın", accent: "#a16207", ink: "#042f2e" },
  { ad: "Mor · gece", accent: "#6d28d9", ink: "#1e1b4b" },
];

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: Rgb) {
  const p = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

/** WCAG bağıl parlaklık — yazı renginin seçimi buna bakıyor. */
function luminance({ r, g, b }: Rgb) {
  const k = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

/** Verilen zemin üzerinde okunur bir yazı rengi döner. */
function okunurYazi(zemin: Rgb, koyu: Rgb) {
  return luminance(zemin) > 0.45 ? rgbToHex(koyu) : "#ffffff";
}

/** Rengi beyazla karıştırıp açık ton üretir (0 = renk, 1 = beyaz). */
function beyazaKaristir(renk: Rgb, oran: number): Rgb {
  return {
    r: renk.r + (255 - renk.r) * oran,
    g: renk.g + (255 - renk.g) * oran,
    b: renk.b + (255 - renk.b) * oran,
  };
}

export type ShopTheme = { accent: string; ink: string };

export function normalizeTheme(input: {
  theme_accent?: string | null;
  theme_ink?: string | null;
}): ShopTheme {
  const accent = input.theme_accent && hexToRgb(input.theme_accent) ? input.theme_accent : VARSAYILAN_ACCENT;
  const ink = input.theme_ink && hexToRgb(input.theme_ink) ? input.theme_ink : VARSAYILAN_INK;
  return { accent: accent.toLowerCase(), ink: ink.toLowerCase() };
}

/**
 * globals.css'teki değişkenleri ezen CSS üretir. Varsayılan paletteyse
 * boş döner — gereksiz stil etiketi basılmaz.
 */
export function buildThemeCss(theme: ShopTheme): string {
  if (theme.accent === VARSAYILAN_ACCENT && theme.ink === VARSAYILAN_INK) return "";

  const accent = hexToRgb(theme.accent);
  const ink = hexToRgb(theme.ink);
  if (!accent || !ink) return "";

  const degiskenler: Record<string, string> = {
    "--color-accent": theme.accent,
    "--color-accent-fg": okunurYazi(accent, ink),
    "--color-accent-hover": theme.ink,
    "--color-highlight": theme.accent,
    "--color-highlight-fg": okunurYazi(accent, ink),

    "--color-fg": theme.ink,
    "--color-fg-muted": rgbToHex(beyazaKaristir(ink, 0.42)),
    "--color-fg-subtle": rgbToHex(beyazaKaristir(ink, 0.62)),
    "--color-border": theme.ink,
    "--color-border-strong": theme.ink,

    "--color-bg-elevated": rgbToHex(beyazaKaristir(ink, 0.9)),
    "--color-surface-hover": rgbToHex(beyazaKaristir(ink, 0.9)),

    "--color-invert-bg": theme.ink,
    "--color-invert-fg": "#ffffff",
    "--color-invert-muted": rgbToHex(beyazaKaristir(ink, 0.62)),

    "--color-danger": theme.accent,
  };

  const govde = Object.entries(degiskenler)
    .map(([ad, deger]) => `${ad}:${deger}`)
    .join(";");

  return `:root{${govde}}`;
}
