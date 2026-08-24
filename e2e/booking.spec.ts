import { test, expect, type Page } from "@playwright/test";

/** Her çalışma için benzersiz telefon — testler aynı veritabanını paylaşıyor. */
function uniquePhone() {
  return `0555${Date.now().toString().slice(-7)}`;
}

/**
 * Adım grupları aria-label ile hedefleniyor. Sayfadaki ilk butonu seçmek
 * kırılgandı: header'daki menü butonu listeye girip testi yanlış yönlendiriyordu.
 */
const group = (page: Page, name: string) => page.getByRole("group", { name });

async function goToSlotStep(page: Page) {
  await page.goto("/randevu-al");

  await group(page, "Hizmet seçimi").getByRole("button").first().click();
  await group(page, "Çalışan seçimi").getByRole("button").first().click();

  // Körlemesine ilk günü seçmek kırılgandı: dükkan kapandıktan sonra
  // (ya da kapalı bir günde) bugün için hiç saat üretilmiyor ve test
  // akşam çalıştırıldığında sebepsiz kırmızıya düşüyordu. Saat çıkan
  // ilk güne kadar ilerliyoruz.
  const days = group(page, "Gün seçimi").getByRole("button");
  const dayCount = await days.count();

  for (let i = 0; i < dayCount; i++) {
    await days.nth(i).click();

    // isVisible() beklemeden anında döner; saatler sunucudan geldiği için
    // burada polling yapan expect gerekiyor.
    const slot = group(page, "Saat seçimi").getByRole("button").first();
    try {
      await expect(slot).toBeVisible({ timeout: 8_000 });
      return slot;
    } catch {
      // Bu günde müsait saat yok — sıradaki güne bak.
    }
  }

  throw new Error(
    "Randevu penceresindeki hiçbir günde müsait saat yok — çalışma saatleri ve test verisi kontrol edilmeli.",
  );
}

async function fillContactStep(page: Page, phone: string, email: string) {
  await page.getByLabel("Ad Soyad").fill("Playwright Test");
  await page.getByLabel("Telefon").fill(phone);
  await page.getByLabel("E-posta").fill(email);
  await page.getByRole("button", { name: "Randevuyu Onayla" }).click();
}

test.describe("Randevu alma", () => {
  test("4 adımlı form randevu oluşturur", async ({ page }) => {
    const slot = await goToSlotStep(page);
    await slot.click();
    await page.getByRole("button", { name: "Devam Et" }).click();

    const phone = uniquePhone();
    await fillContactStep(page, phone, `${phone}@example.test`);

    await expect(page.getByRole("heading", { name: "Randevunuz alındı" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("saat seçilmeden devam edilemez", async ({ page }) => {
    await page.goto("/randevu-al");

    await group(page, "Hizmet seçimi").getByRole("button").first().click();
    await group(page, "Çalışan seçimi").getByRole("button").first().click();

    // Gün/saat henüz seçilmedi — "Devam Et" pasif olmalı.
    await expect(page.getByRole("button", { name: "Devam Et" })).toBeDisabled();
  });

  test("geçersiz e-posta ile gönderilemez", async ({ page }) => {
    const slot = await goToSlotStep(page);
    await slot.click();
    await page.getByRole("button", { name: "Devam Et" }).click();

    await fillContactStep(page, "05550000000", "gecersiz-eposta");

    await expect(page.getByText("Geçerli bir e-posta girin")).toBeVisible();
  });

  test("adım göstergesi ilerler", async ({ page }) => {
    await page.goto("/randevu-al");

    await group(page, "Hizmet seçimi").getByRole("button").first().click();
    await expect(group(page, "Çalışan seçimi")).toBeVisible();

    await group(page, "Çalışan seçimi").getByRole("button").first().click();
    await expect(group(page, "Gün seçimi")).toBeVisible();
  });
});

test.describe("Randevu iptali", () => {
  test("geçersiz token 404 verir", async ({ page }) => {
    const res = await page.goto("/randevu/00000000-0000-0000-0000-000000000000");
    expect(res?.status()).toBe(404);
  });
});
