import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { getShop } from "@/lib/shop";
import { getSiteUrl } from "@/lib/seo";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
