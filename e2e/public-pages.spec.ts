import { test, expect } from "@playwright/test";

test.describe("Public sayfalar", () => {
  test("anasayfa dükkan bilgisiyle açılır", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Randevu Al" }).first()).toBeVisible();

    // Hizmetler ve çalışma saatleri veritabanından geliyor olmalı.
    await expect(page.getByRole("heading", { name: "Hizmetler" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Çalışma Saatleri" }).first()).toBeVisible();
  });

  test("mobil menü açılıp kapanır", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Yalnızca mobil viewport için");

    await page.goto("/");

    const openBtn = page.getByLabel("Menüyü aç");
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const menu = page.getByRole("navigation").last();
    await expect(menu.getByRole("link", { name: "Hizmetler" })).toBeVisible();

    await page.getByLabel("Menüyü kapat").click();
    await expect(page.getByLabel("Menüyü aç")).toBeVisible();
  });

  test("mobilde yatay kaydırma olmaz", async ({ page }) => {
    for (const path of [
      "/",
      "/hizmetler",
      "/galeri",
      "/hakkimizda",
      "/iletisim",
      "/randevu-al",
      "/gizlilik",
    ]) {
      await page.goto(path);
      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      expect(scrollW, `${path} yatay taşıyor`).toBeLessThanOrEqual(clientW + 1);
    }
  });

  test("hizmetler sayfası en az bir hizmet listeler", async ({ page }) => {
    await page.goto("/hizmetler");

    await expect(page.getByRole("heading", { name: "Hizmetler", level: 1 })).toBeVisible();

    // Her hizmet kendi kartında (article) süresiyle birlikte listelenir.
    const cards = page.getByRole("article");
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(/dakika/);
  });

  test("iletişim sayfası açılır", async ({ page }) => {
    await page.goto("/iletisim");
    await expect(page.getByRole("heading", { name: "İletişim", level: 1 })).toBeVisible();
  });

  test("galeri sayfası açılır", async ({ page }) => {
    await page.goto("/galeri");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // Değer kartları ve ekip veritabanından geliyor; panelden silinmedikçe
  // kurulum sırasında eklenen varsayılanlar burada görünür.
  test("hakkımızda sayfası değer kartlarını listeler", async ({ page }) => {
    await page.goto("/hakkimizda");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ekip" })).toBeVisible();
  });

  test("gizlilik sayfası açılır", async ({ page }) => {
    await page.goto("/gizlilik");
    await expect(page.getByRole("heading", { name: "Gizlilik Politikası" })).toBeVisible();
  });

  test("sayfa başlıkları dükkan adıyla şablonlanır", async ({ page }) => {
    await page.goto("/hizmetler");
    await expect(page).toHaveTitle(/Hizmetler \| .+/);
  });

  test("konsola hata basılmaz", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });
});

test.describe("SEO", () => {
  test("sitemap public route'ları içerir, panelleri içermez", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const xml = await res.text();
    expect(xml).toContain("/hizmetler");
    expect(xml).toContain("/randevu-al");
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/personel");
  });

  test("robots.txt panelleri disallow eder", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);

    const txt = await res.text();
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("Disallow: /personel");
    expect(txt).toContain("Sitemap:");
  });

  test("anasayfada LocalBusiness yapılandırılmış verisi var", async ({ page }) => {
    await page.goto("/");

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toBeTruthy();

    const parsed = JSON.parse(jsonLd!);
    expect(parsed["@type"]).toBe("HairSalon");
    expect(parsed.name).toBeTruthy();
    expect(Array.isArray(parsed.openingHoursSpecification)).toBe(true);
  });
});
