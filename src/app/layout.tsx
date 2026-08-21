import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { getShop } from "@/lib/shop";
import { getSiteUrl } from "@/lib/seo";

// latin-ext: Türkçe'ye özgü ş/ğ/ı/İ karakterleri latin alt kümesinde yok.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
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
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
