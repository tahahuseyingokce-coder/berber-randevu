import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { getShop } from "@/lib/shop";
import { getSiteUrl } from "@/lib/seo";
import { buildThemeCss, normalizeTheme } from "@/lib/theme";

// latin-ext: Türkçe'ye özgü ş/ğ/ı/İ karakterleri latin alt kümesinde yok.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: shop.name,
      template: `%s | ${shop.name}`,
    },
    description: `${shop.name} — online randevu alın, hızlı ve kolay.`,
    openGraph: {
      title: shop.name,
      description: `${shop.name} için online randevu alın.`,
      locale: "tr_TR",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Palet dükkan kaydından geliyor; globals.css'teki varsayılanları ezer.
  // Değerler veritabanında #rrggbb kısıtıyla korunuyor ve buildThemeCss
  // ayrıca doğruluyor, o yüzden stil olarak gömülmesi güvenli.
  const shop = await getShop();
  const themeCss = buildThemeCss(normalizeTheme(shop));

  return (
    <html
      lang="tr"
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        {/* Stil <head> içine elle konmuyor: App Router head'i kendi
            yönetiyor ve elle eklenen etiket hydration hatası veriyordu.
            :root değişkenleri belgede nerede tanımlandığından bağımsız
            çalışır. */}
        {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
        {children}
      </body>
    </html>
  );
}
