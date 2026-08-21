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
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
