import { test, expect } from "@playwright/test";

/**
 * Giriş testleri demo hesap bilgilerini ortamdan okur. Tanımlı değilse
 * atlanır — böylece kimlik bilgisi repoya gömülmez ve CI'da eksikse
 * test sessizce yanlış sonuç vermez.
 */
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD;
const EMPLOYEE_EMAIL = process.env.E2E_EMPLOYEE_EMAIL;
const EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD;

test.describe("Erişim koruması", () => {
  test("giriş yapmadan /admin girişe yönlendirir", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/giris/);
    await expect(page.getByRole("heading", { name: "Giriş Yap" })).toBeVisible();
  });

  test("giriş yapmadan /personel girişe yönlendirir", async ({ page }) => {
    await page.goto("/personel");
    await expect(page).toHaveURL(/\/giris/);
  });

  test("giriş yapmadan admin alt sayfaları da korunur", async ({ page }) => {
    for (const path of ["/admin/musteriler", "/admin/calisanlar", "/admin/ayarlar"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/giris/);
    }
  });

  test("hatalı şifre reddedilir", async ({ page }) => {
    await page.goto("/giris");

    await page.getByLabel("E-posta").fill("olmayan@ornek.test");
    await page.getByLabel("Şifre").fill("yanlissifre");
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
    await expect(page).toHaveURL(/\/giris/);
  });
});

test.describe("Rol ayrımı", () => {
  test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E_OWNER_* ortam değişkenleri tanımlı değil");

  test("sahip admin paneline girer", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(OWNER_EMAIL!);
    await page.getByLabel("Şifre").fill(OWNER_PASSWORD!);
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Bugünkü Randevular")).toBeVisible();
    await expect(page.getByText("Bu Hafta Ciro")).toBeVisible();
  });

  test("sahip tüm admin sekmelerini görür", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(OWNER_EMAIL!);
    await page.getByLabel("Şifre").fill(OWNER_PASSWORD!);
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    for (const path of ["/admin/randevular", "/admin/musteriler", "/admin/hizmetler", "/admin/ayarlar"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
    }
  });
});

test.describe("Çalışan kısıtları", () => {
  test.skip(
    !EMPLOYEE_EMAIL || !EMPLOYEE_PASSWORD,
    "E2E_EMPLOYEE_* ortam değişkenleri tanımlı değil",
  );

  test("çalışan personel paneline yönlenir ve /admin'e giremez", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(EMPLOYEE_EMAIL!);
    await page.getByLabel("Şifre").fill(EMPLOYEE_PASSWORD!);
    await page.getByRole("button", { name: "Giriş Yap" }).click();

    await expect(page).toHaveURL(/\/personel$/);

    // Doğrudan admin'e gitmeye çalışınca personel paneline geri atılmalı.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/personel$/);
  });

  test("çalışan panelinde ciro gösterilmez", async ({ page }) => {
    await page.goto("/giris");
    await page.getByLabel("E-posta").fill(EMPLOYEE_EMAIL!);
    await page.getByLabel("Şifre").fill(EMPLOYEE_PASSWORD!);
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(page).toHaveURL(/\/personel$/);

    await expect(page.getByText("Bu Hafta Ciro")).toHaveCount(0);
  });
});
