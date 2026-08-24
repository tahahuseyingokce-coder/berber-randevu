import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { getShop } from "@/lib/shop";
import { getSiteUrl } from "@/lib/seo";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
