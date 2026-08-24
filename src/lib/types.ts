export type Shop = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  phone: string | null;
  address: string | null;
  /** Panelden girilen Google Haritalar bağlantısı. Boşsa adresten türetilir. */
  maps_url: string | null;
  cutoff_hours: number;
  /** Hakkımızda sayfası metni. Boşsa sayfada varsayılan metin gösterilir. */
  about_title: string | null;
  about_body: string | null;
  /** Panelden seçilen palet. Boşsa şablonun varsayılan renkleri kullanılır. */
  theme_accent: string | null;
  theme_ink: string | null;
};

/** Hakkımızda sayfasındaki değer kartı. */
export type ShopValue = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
};

/** Galeri ızgarası ve Hakkımızda sayfasındaki fotoğraflar. */
export type SitePhoto = {
  id: string;
  storage_path: string;
  alt: string | null;
  placement: "gallery" | "about";
  sort_order: number;
};

export type ShopHour = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
};

export type Staff = {
  id: string;
  full_name: string;
  /** site-photos bucket'ındaki portre yolu. Boşsa yer tutucu gösterilir. */
  photo_path: string | null;
  /** Ekip kartındaki unvan ("Kurucu · Berber"). Yetki alanı `role`'den ayrıdır. */
  title: string | null;
  /** Ekip kartındaki kısa tanıtım. */
  bio: string | null;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
