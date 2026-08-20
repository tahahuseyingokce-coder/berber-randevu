import { timingSafeEqual } from "node:crypto";

/**
 * Cron endpoint'leri e-posta gönderir ve tüm müşteri verisini dışa aktarır.
 * Bu yüzden yetkilendirme "fail closed" çalışır: CRON_SECRET tanımlı değilse
 * istek KABUL EDİLMEZ. (Sır yoksa herkese açmak, korumayı tamamen kaldırmak olurdu.)
 *
 * Vercel Cron istekleri `Authorization: Bearer <CRON_SECRET>` başlığıyla gelir.
 */
export function authorizeCronRequest(request: Request):
  | { ok: true }
  | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET tanımlı değil — istek reddedildi.");
    return {
      ok: false,
      status: 503,
      message: "Cron yapılandırılmamış: CRON_SECRET tanımlı değil.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!provided || !safeEquals(provided, secret)) {
    return { ok: false, status: 401, message: "Yetkisiz." };
  }

  return { ok: true };
}

/** Uzunluk farkını da sızdırmayan sabit zamanlı karşılaştırma. */
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Uzunluk farklıysa yine de sabit zamanlı bir karşılaştırma yapıp false dön.
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
