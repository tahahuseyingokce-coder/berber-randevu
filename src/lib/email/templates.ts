import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

/**
 * E-posta istemcileri CSS değişkenlerini ve harici stil dosyalarını desteklemez,
 * bu yüzden Şarap & Krem paletinin hex değerleri burada birebir yazılır.
 */
const C = {
  bg: "#1c1015",
  surface: "#2b171d",
  border: "#4a2c35",
  fg: "#f3e9e6",
  fgMuted: "#b8949c",
  accent: "#e9c98f",
  accentFg: "#1c1015",
} as const;

export type AppointmentEmailData = {
  shopName: string;
  shopPhone: string | null;
  shopAddress: string | null;
  timezone: string;
  customerName: string;
  staffName: string;
  serviceName: string;
  startsAt: string;
  durationMinutes: number;
  price: number | null;
  cancelUrl?: string;
};

function formatDateTime(iso: string, timezone: string) {
  const zoned = toZonedTime(new Date(iso), timezone);
  return format(zoned, "d MMMM yyyy, EEEE · HH:mm", { locale: tr });
}

function formatPrice(price: number | null) {
  if (price === null) return null;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

function layout({
  shopName,
  heading,
  intro,
  detailRows,
  cta,
  footerNote,
}: {
  shopName: string;
  heading: string;
  intro: string;
  detailRows: Array<[string, string]>;
  cta?: { label: string; url: string };
  footerNote?: string;
}) {
  const rows = detailRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};color:${C.fgMuted};font-size:14px;">${label}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${C.border};color:${C.fg};font-size:14px;text-align:right;">${value}</td>
        </tr>`,
    )
    .join("");

  const ctaBlock = cta
    ? `<tr><td style="padding-top:28px;">
         <a href="${cta.url}" style="display:inline-block;background:${C.accent};color:${C.accentFg};text-decoration:none;padding:12px 26px;border-radius:999px;font-size:14px;font-weight:600;">${cta.label}</a>
       </td></tr>`
    : "";

  const footerBlock = footerNote
    ? `<tr><td style="padding-top:24px;color:${C.fgMuted};font-size:12px;line-height:1.6;">${footerNote}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.surface};border:1px solid ${C.border};border-radius:16px;padding:32px;">
          <tr>
            <td style="color:${C.accent};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;padding-bottom:10px;">${shopName}</td>
          </tr>
          <tr>
            <td style="color:${C.fg};font-size:26px;font-family:Georgia,'Times New Roman',serif;line-height:1.2;padding-bottom:12px;">${heading}</td>
          </tr>
          <tr>
            <td style="color:${C.fgMuted};font-size:14px;line-height:1.6;font-family:Helvetica,Arial,sans-serif;padding-bottom:20px;">${intro}</td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;">
                ${rows}
              </table>
            </td>
          </tr>
          ${ctaBlock}
          ${footerBlock}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function baseRows(d: AppointmentEmailData): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Hizmet", d.serviceName],
    ["Çalışan", d.staffName],
    ["Tarih", formatDateTime(d.startsAt, d.timezone)],
    ["Süre", `${d.durationMinutes} dakika`],
  ];
  const price = formatPrice(d.price);
  if (price) rows.push(["Ücret", price]);
  return rows;
}

/** Müşteriye: randevu talebi alındı, çalışan onayı bekleniyor. */
export function customerBookingReceived(d: AppointmentEmailData) {
  return {
    subject: `Randevu talebiniz alındı — ${d.shopName}`,
    html: layout({
      shopName: d.shopName,
      heading: "Randevu talebiniz alındı",
      intro: `Merhaba ${d.customerName}, randevunuz sisteme kaydedildi. Çalışanımız onayladığında size tekrar bilgi vereceğiz.`,
      detailRows: baseRows(d),
      cta: d.cancelUrl ? { label: "Randevumu Görüntüle / İptal Et", url: d.cancelUrl } : undefined,
      footerNote: [
        d.shopAddress ? `Adres: ${d.shopAddress}` : null,
        d.shopPhone ? `Telefon: ${d.shopPhone}` : null,
      ]
        .filter(Boolean)
        .join("<br>"),
    }),
  };
}

/** Müşteriye: randevu çalışan tarafından onaylandı. */
export function customerBookingConfirmed(d: AppointmentEmailData) {
  return {
    subject: `Randevunuz onaylandı — ${d.shopName}`,
    html: layout({
      shopName: d.shopName,
      heading: "Randevunuz onaylandı",
      intro: `Merhaba ${d.customerName}, randevunuz onaylandı. Belirtilen saatte sizi bekliyoruz.`,
      detailRows: baseRows(d),
      cta: d.cancelUrl ? { label: "Randevumu Görüntüle / İptal Et", url: d.cancelUrl } : undefined,
      footerNote: [
        d.shopAddress ? `Adres: ${d.shopAddress}` : null,
        d.shopPhone ? `Telefon: ${d.shopPhone}` : null,
      ]
        .filter(Boolean)
        .join("<br>"),
    }),
  };
}

/** Müşteriye: randevu iptal edildi. */
export function customerBookingCancelled(d: AppointmentEmailData) {
  return {
    subject: `Randevunuz iptal edildi — ${d.shopName}`,
    html: layout({
      shopName: d.shopName,
      heading: "Randevunuz iptal edildi",
      intro: `Merhaba ${d.customerName}, aşağıdaki randevunuz iptal edilmiştir. Yeni bir randevu almak isterseniz bizi arayabilir veya siteden randevu oluşturabilirsiniz.`,
      detailRows: baseRows(d),
      footerNote: d.shopPhone ? `Telefon: ${d.shopPhone}` : undefined,
    }),
  };
}

/** Müşteriye: randevu hatırlatması (cron ile gönderilir). */
export function customerBookingReminder(d: AppointmentEmailData) {
  return {
    subject: `Yarınki randevunuz — ${d.shopName}`,
    html: layout({
      shopName: d.shopName,
      heading: "Randevunuzu hatırlatalım",
      intro: `Merhaba ${d.customerName}, yaklaşan randevunuzu hatırlatmak istedik.`,
      detailRows: baseRows(d),
      cta: d.cancelUrl ? { label: "Randevumu Görüntüle / İptal Et", url: d.cancelUrl } : undefined,
      footerNote: [
        d.shopAddress ? `Adres: ${d.shopAddress}` : null,
        d.shopPhone ? `Telefon: ${d.shopPhone}` : null,
      ]
        .filter(Boolean)
        .join("<br>"),
    }),
  };
}

/** Çalışana/berbere: yeni randevu talebi geldi. */
export function staffNewBooking(d: AppointmentEmailData & { customerPhone: string }) {
  return {
    subject: `Yeni randevu: ${d.customerName} — ${formatDateTime(d.startsAt, d.timezone)}`,
    html: layout({
      shopName: d.shopName,
      heading: "Yeni randevu talebi",
      intro: `${d.staffName} için yeni bir randevu talebi geldi. Panelden onaylayabilirsiniz.`,
      detailRows: [
        ["Müşteri", d.customerName],
        ["Telefon", d.customerPhone],
        ...baseRows(d),
      ],
    }),
  };
}

/** Çalışana/berbere: randevu müşteri tarafından iptal edildi. */
export function staffBookingCancelled(d: AppointmentEmailData & { customerPhone: string }) {
  return {
    subject: `Randevu iptal edildi: ${d.customerName} — ${formatDateTime(d.startsAt, d.timezone)}`,
    html: layout({
      shopName: d.shopName,
      heading: "Randevu iptal edildi",
      intro: `Aşağıdaki randevu iptal edilmiştir. Bu saat artık müsait.`,
      detailRows: [
        ["Müşteri", d.customerName],
        ["Telefon", d.customerPhone],
        ...baseRows(d),
      ],
    }),
  };
}
