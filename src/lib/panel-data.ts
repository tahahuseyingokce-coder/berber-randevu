import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppointmentStatus } from "@/lib/types";

export type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: "online" | "manual";
  services: { name: string; duration_minutes: number; price: number | null } | null;
  staff: { id: string; full_name: string } | null;
  customers: { id: string; full_name: string; phone: string; email: string } | null;
};

export async function listAppointments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  opts: { status?: AppointmentStatus[]; from?: string; to?: string } = {},
): Promise<AppointmentRow[]> {
  let query = supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, source, services(name, duration_minutes, price), staff:staff!appointments_staff_id_fkey(id, full_name), customers(id, full_name, phone, email)",
    )
    .order("starts_at", { ascending: true });

  if (opts.status) query = query.in("status", opts.status);
  if (opts.from) query = query.gte("starts_at", opts.from);
  if (opts.to) query = query.lte("starts_at", opts.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as AppointmentRow[];
}

/**
 * Randevusu olan hizmet/çalışan silinemez (`on delete restrict`). Kaydın
 * kaç randevuda kullanıldığını birlikte çekiyoruz ki panel çalışmayacak
 * bir "Sil" düğmesi göstermesin.
 */
type WithAppointmentCount = { appointments: { count: number }[] };

function appointmentCountOf(row: WithAppointmentCount) {
  return row.appointments?.[0]?.count ?? 0;
}

export async function listServicesAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, is_active, sort_order, appointments(count)")
    .order("sort_order");
  if (error) throw error;

  return (data ?? []).map((s) => ({
    ...s,
    appointment_count: appointmentCountOf(s as unknown as WithAppointmentCount),
  }));
}

export async function listStaffAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  // staff'a iki farklı yabancı anahtar var (randevunun sahibi ve randevuyu
  // giren kişi); sayım randevunun sahibi üzerinden yapılmalı.
  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, full_name, role, phone, email, is_active, auth_user_id, appointments:appointments!appointments_staff_id_fkey(count)",
    )
    .order("full_name");
  if (error) throw error;

  return (data ?? []).map((s) => ({
    ...s,
    appointment_count: appointmentCountOf(s as unknown as WithAppointmentCount),
  }));
}

/**
 * Müşteri listesi tek seferde kaç satır getirir.
 *
 * Liste eskiden tüm müşterileri çekip ekrana basıyordu; birkaç yüz
 * müşteriden sonra hem yanıt hem DOM şişiyordu. Arama artık veritabanında
 * yapılıyor, ekranda her zaman en fazla bu kadar satır oluyor.
 */
export const CUSTOMER_PAGE_SIZE = 20;

/**
 * PostgREST `or` filtresi virgül ve parantezle ayrıştırılıyor; arama
 * terimindeki bu karakterler filtreyi bozar (ya da başka bir koşul
 * enjekte eder), o yüzden temizleniyor.
 */
function sanitizeSearchTerm(term: string) {
  return term.replace(/[,()*%\\"']/g, " ").trim();
}

export async function searchCustomers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  query = "",
  limit = CUSTOMER_PAGE_SIZE,
) {
  let request = supabase
    .from("customers")
    .select("id, full_name, phone, email", { count: "exact" })
    .order("full_name")
    .limit(limit);

  const term = sanitizeSearchTerm(query);
  if (term) {
    request = request.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await request;
  if (error) throw error;

  return { customers: data ?? [], total: count ?? 0 };
}

export async function listCustomerNotes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("customer_notes")
    .select("id, note, created_at, updated_at, author_staff_id, staff(full_name)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
