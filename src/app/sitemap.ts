import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/hizmetler`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/iletisim`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/randevu-al`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
