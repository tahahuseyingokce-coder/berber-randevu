import { test, expect } from "@playwright/test";

/**
 * Cron endpoint'leri e-posta gönderir ve tüm müşteri verisini dışa aktarır.
 * Yetkisiz erişim bu yüzden en kritik regresyon riski — her senaryoyu kapsa.
 */
const CRON_PATHS = ["/api/cron/hatirlatma", "/api/cron/yedekleme"];

test.describe("Cron güvenliği", () => {
  for (const path of CRON_PATHS) {
    test(`${path} — başlıksız istek reddedilir`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(600);
      expect(res.status()).not.toBe(200);
    });

    test(`${path} — yanlış secret reddedilir`, async ({ request }) => {
      const res = await request.get(path, {
        headers: { Authorization: "Bearer kesinlikle-yanlis-bir-secret" },
      });
      expect(res.status()).not.toBe(200);
    });

    test(`${path} — farklı uzunlukta secret çökmeden reddedilir`, async ({ request }) => {
      const res = await request.get(path, { headers: { Authorization: "Bearer x" } });
      expect(res.status()).not.toBe(200);
      expect(res.status()).not.toBe(500);
    });

    test(`${path} — Bearer öneki olmadan reddedilir`, async ({ request }) => {
      const res = await request.get(path, {
        headers: { Authorization: process.env.CRON_SECRET ?? "bir-sey" },
      });
      expect(res.status()).not.toBe(200);
    });

    test(`${path} — yetkisiz yanıtta veri sızmaz`, async ({ request }) => {
      const res = await request.get(path);
      const body = await res.text();

      // Yanıt müşteri verisi ya da tablo dökümü içermemeli.
      expect(body).not.toContain("customers");
      expect(body).not.toContain("@");
      expect(body.length).toBeLessThan(500);
    });
  }
});
