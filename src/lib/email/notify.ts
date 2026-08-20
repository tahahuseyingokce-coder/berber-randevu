import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmailsSafely, type SendEmailInput } from "./client";
import {
  customerBookingCancelled,
  customerBookingConfirmed,
  customerBookingReceived,
  customerBookingReminder,
  staffBookingCancelled,
  staffNewBooking,
  type AppointmentEmailData,
} from "./templates";
import { getSiteUrl } from "@/lib/seo";

type NotificationRow = {
  appointment_id: string;
  starts_at: string;
  status: string;
  duration_minutes: number;
  service_name: string;
  service_price: number | null;
  staff_name: string;
  staff_email: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shop_name: string;
  shop_phone: string | null;
  shop_address: string | null;
  shop_timezone: string;
};

export type BookingEvent = "created" | "confirmed" | "cancelled_by_customer" | "cancelled_by_staff" | "reminder";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

async function fetchNotificationData(
  supabase: AnyClient,
  cancelToken: string,
): Promise<NotificationRow | null> {
  const { data, error } = await supabase
    .rpc("get_notification_data", { p_cancel_token: cancelToken })
    .maybeSingle<NotificationRow>();

  if (error) {
    console.error("[email] Bildirim verisi alınamadı:", error.message);
    return null;
  }
  return data;
}

function toEmailData(row: NotificationRow, cancelToken: string): AppointmentEmailData {
  return {
    shopName: row.shop_name,
    shopPhone: row.shop_phone,
    shopAddress: row.shop_address,
    timezone: row.shop_timezone,
    customerName: row.customer_name,
    staffName: row.staff_name,
    serviceName: row.service_name,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    price: row.service_price,
    cancelUrl: `${getSiteUrl()}/randevu/${cancelToken}`,
  };
}

/**
 * Randevu olayına göre ilgili taraflara e-posta gönderir.
 * ASLA throw etmez — e-posta gönderimi randevu akışını bloke etmemelidir.
 */
export async function notifyBookingEvent(
  supabase: AnyClient,
  cancelToken: string,
  event: BookingEvent,
): Promise<void> {
  try {
    const row = await fetchNotificationData(supabase, cancelToken);
    if (!row) return;

    const d = toEmailData(row, cancelToken);
    const messages: SendEmailInput[] = [];

    switch (event) {
      case "created": {
        const c = customerBookingReceived(d);
        messages.push({ to: row.customer_email, ...c });

        if (row.staff_email) {
          const s = staffNewBooking({ ...d, customerPhone: row.customer_phone });
          messages.push({ to: row.staff_email, ...s });
        }
        break;
      }

      case "confirmed": {
        const c = customerBookingConfirmed(d);
        messages.push({ to: row.customer_email, ...c });
        break;
      }

      case "cancelled_by_customer": {
        const c = customerBookingCancelled(d);
        messages.push({ to: row.customer_email, ...c });

        if (row.staff_email) {
          const s = staffBookingCancelled({ ...d, customerPhone: row.customer_phone });
          messages.push({ to: row.staff_email, ...s });
        }
        break;
      }

      case "cancelled_by_staff": {
        const c = customerBookingCancelled(d);
        messages.push({ to: row.customer_email, ...c });
        break;
      }

      case "reminder": {
        const c = customerBookingReminder(d);
        messages.push({ to: row.customer_email, ...c });
        break;
      }
    }

    await sendEmailsSafely(messages);
  } catch (err) {
    console.error("[email] Bildirim gönderilirken beklenmeyen hata:", err);
  }
}
