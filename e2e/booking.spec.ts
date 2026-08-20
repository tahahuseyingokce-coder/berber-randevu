import { test, expect, type Page } from "@playwright/test";

/** Her çalışma için benzersiz telefon — testler aynı veritabanını paylaşıyor. */
function uniquePhone() {
  return `0555${Date.now().toString().slice(-7)}`;
}

async function fillBookingForm(page: Page, phone: string) {
  await page.goto("/randevu-al");

  // 1. Hizmet
  await page.getByRole("button", { name: /dk/ }).first().click();

  // 2. Çalışan
  await page.getByRole("button").filter({ hasNotText: "Geri" }).first().click();

  // 3. Tarih ve saat
  await page.getByRole("button", { name: /Ağu|Eyl|Eki|Kas|Ara|Oca|Şub|Mar|Nis|May|Haz|Tem/ }).first().click();

  const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();

  await page.getByRole("button", { name: "Devam Et" }).click();

  // 4. Müşteri bilgileri
  await page.getByLabel("Ad Soyad").fill("Playwright Test");
  await page.getByLabel("Telefon").fill(phone);
  await page.getByLabel("E-posta").fill(`${phone}@example.test`);

  await page.getByRole("button", { name: "Randevuyu Onayla" }).click();
}

test.describe("Randevu alma", () => {
  test("4 adımlı form randevu oluşturur", async ({ page }) => {
    await fillBookingForm(page, uniquePhone());

    await expect(page.getByRole("heading", { name: "Randevunuz alındı" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("saat seçilmeden devam edilemez", async ({ page }) => {
    await page.goto("/randevu-al");

    await page.getByRole("button", { name: /dk/ }).first().click();
    await page.getByRole("button").filter({ hasNotText: "Geri" }).first().click();

    // Henüz gün/saat seçilmedi — "Devam Et" pasif olmalı.
    await expect(page.getByRole("button", { name: "Devam Et" })).toBeDisabled();
  });

  test("geçersiz e-posta ile gönderilemez", async ({ page }) => {
    await page.goto("/randevu-al");

    await page.getByRole("button", { name: /dk/ }).first().click();
    await page.getByRole("button").filter({ hasNotText: "Geri" }).first().click();
    await page
      .getByRole("button", { name: /Ağu|Eyl|Eki|Kas|Ara|Oca|Şub|Mar|Nis|May|Haz|Tem/ })
      .first()
      .click();

    const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 15_000 });
    await slot.click();
    await page.getByRole("button", { name: "Devam Et" }).click();

    await page.getByLabel("Ad Soyad").fill("Playwright Test");
    await page.getByLabel("Telefon").fill("05550000000");
    await page.getByLabel("E-posta").fill("gecersiz-eposta");
    await page.getByRole("button", { name: "Randevuyu Onayla" }).click();

    await expect(page.getByText("Geçerli bir e-posta girin")).toBeVisible();
  });
});

test.describe("Randevu iptali", () => {
  test("geçersiz token 404 verir", async ({ page }) => {
    const res = await page.goto("/randevu/00000000-0000-0000-0000-000000000000");
    expect(res?.status()).toBe(404);
  });
});
