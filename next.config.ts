import type { NextConfig } from "next";

/**
 * Galeri ve ekip fotoğrafları Supabase Storage'dan geliyor. Şablon her
 * müşteri için ayrı bir Supabase projesine deploy edildiğinden host
 * sabit yazılamaz, ortam değişkeninden türetiliyor.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
