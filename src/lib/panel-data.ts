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

export async function listServicesAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, is_active, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function listStaffAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name, role, phone, email, is_active, auth_user_id")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function listCustomersAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, created_at")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
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
