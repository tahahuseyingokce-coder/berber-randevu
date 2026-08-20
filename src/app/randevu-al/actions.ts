"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { generateAvailableSlots } from "@/lib/booking";
import { getShop } from "@/lib/shop";
import { notifyBookingEvent } from "@/lib/email/notify";

const slotsInputSchema = z.object({
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function getAvailableSlotsAction(input: z.infer<typeof slotsInputSchema>) {
  const { staffId, serviceId, date } = slotsInputSchema.parse(input);
  const supabase = createPublicClient();
  const shop = await getShop();

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const [{ data: service }, { data: hours }, { data: busyRanges, error: busyError }] =
    await Promise.all([
      supabase.from("services").select("duration_minutes").eq("id", serviceId).single(),
      supabase
        .from("shop_hours")
        .select("opens_at, closes_at, is_closed")
        .eq("shop_id", shop.id)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle(),
      supabase.rpc("get_busy_ranges", {
        p_staff_id: staffId,
        p_date: date,
        p_timezone: shop.timezone,
      }),
    ]);

  if (busyError) throw busyError;
  if (!service) throw new Error("Hizmet bulunamadı.");
  if (!hours || hours.is_closed || !hours.opens_at || !hours.closes_at) {
    return { slots: [] as string[] };
  }

  const slots = generateAvailableSlots({
    dateStr: date,
    timezone: shop.timezone,
    opensAt: hours.opens_at.slice(0, 5),
    closesAt: hours.closes_at.slice(0, 5),
    serviceDurationMinutes: service.duration_minutes,
    busyRanges: busyRanges ?? [],
    now: new Date(),
  });

  return { slots: slots.map((s) => s.toISOString()) };
}

const createAppointmentSchema = z.object({
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  customerName: z.string().trim().min(2, "Ad soyad gerekli").max(120),
  customerPhone: z.string().trim().min(7, "Geçerli bir telefon numarası girin").max(20),
  customerEmail: z.string().email("Geçerli bir e-posta girin"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export async function createAppointmentAction(input: CreateAppointmentInput) {
  const parsed = createAppointmentSchema.parse(input);
  const supabase = createPublicClient();
  const shop = await getShop();

  const { data, error } = await supabase.rpc("create_appointment", {
    p_shop_id: shop.id,
    p_staff_id: parsed.staffId,
    p_service_id: parsed.serviceId,
    p_customer_name: parsed.customerName,
    p_customer_phone: parsed.customerPhone,
    p_customer_email: parsed.customerEmail,
    p_starts_at: parsed.startsAt,
    p_status: "pending",
    p_source: "online",
  });

  if (error) {
    throw new Error(error.message);
  }

  const appointment = data as { id: string; cancel_token: string } | null;

  // E-posta gönderimi randevuyu bloke etmez: hata olsa da randevu geçerlidir.
  if (appointment?.cancel_token) {
    await notifyBookingEvent(supabase, appointment.cancel_token, "created");
  }

  return { appointment: data };
}
