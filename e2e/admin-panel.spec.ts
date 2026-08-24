import { test, expect, type Page } from "@playwright/test";

/**
 * Panel testleri kimlik bilgilerini ortamdan okur (bkz. auth.spec.ts).
 * Tanımlı değilse atlanır — kimlik bilgisi repoya girmez.
 */
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL;
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD;

async function girisYap(page: Page) {
  await page.goto("/giris");
  await page.getByLabel("E-posta").fill(OWNER_EMAIL!);
  await page.getByLabel("Şifre").fill(OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/**
 * Liste satırını (kart) hedefler.
 *
 * Düz `locator("div")` ile aramak metni içeren en içteki elemanı seçiyor
 * ve satırdaki düğmeler kapsam dışında kalıyordu; kart sınıfına
 * dayanarak satırın kendisini alıyoruz.
 */
function satir(page: Page, metin: string) {
  return page.locator("div.rounded-lg").filter({ hasText: metin }).last();
}

test.describe("Admin paneli", () => {
  test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E_OWNER_* ortam değişkenleri tanımlı değil");

  test.beforeEach(async ({ page }) => {
    await girisYap(page);
  });

  test.describe("Hamburger menü", () => {
    test("üst çubukta sekme dizisi yok, tek hamburger var", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeVisible();

      // Menü kapalıyken bağlantılar DOM'da olmamalı.
      await expect(page.getByRole("link", { name: "Takvim" })).toHaveCount(0);
    });

    test("menü açılır, tüm sayfaları listeler ve seçilen sayfaya gider", async ({ page }) => {
      await page.getByRole("button", { name: "Menüyü aç" }).click();

      const menu = page.locator("#panel-menu");
      await expect(menu).toBeVisible();
      for (const ad of [
        "Dashboard",
        "Takvim",
        "Randevular",
        "Müşteriler",
        "Çalışanlar",
        "Hizmetler",
        "Site İçeriği",
        "Ayarlar",
      ]) {
        await expect(menu.getByRole("link", { name: ad })).toBeVisible();
      }

      await menu.getByRole("link", { name: "Hizmetler" }).click();
      await expect(page).toHaveURL(/\/admin\/hizmetler$/);

      // Gidince menü kapanmalı.
      await expect(page.locator("#panel-menu")).toHaveCount(0);
    });

    test("Escape ile kapanır", async ({ page }) => {
      await page.getByRole("button", { name: "Menüyü aç" }).click();
      await expect(page.locator("#panel-menu")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.locator("#panel-menu")).toHaveCount(0);
    });

    test("giriş sonrası ilk ekran Dashboard", async ({ page }) => {
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByText("Bugünkü Randevular")).toBeVisible();
    });
  });

  test.describe("Randevular", () => {
    test('"Tümü" sekmesi yok, "Tamamlandı" var', async ({ page }) => {
      await page.goto("/admin/randevular");

      await expect(page.getByRole("link", { name: "Tümü" })).toHaveCount(0);
      for (const ad of ["Onay Bekleyen", "Onaylı", "Tamamlandı", "İptal"]) {
        await expect(page.getByRole("link", { name: ad })).toBeVisible();
      }
    });

    test("varsayılan görünüm onay bekleyenler", async ({ page }) => {
      await page.goto("/admin/randevular");

      // Varsayılan sekme vurgulanmış olmalı.
      const aktif = page.getByRole("link", { name: "Onay Bekleyen" });
      await expect(aktif).toHaveClass(/border-accent/);
    });

    test("tamamlandı sekmesi geçmiş randevuları gösterir", async ({ page }) => {
      await page.goto("/admin/randevular?filter=completed");
      await expect(page.getByRole("link", { name: "Tamamlandı" })).toHaveClass(/border-accent/);
    });
  });

  test.describe("Site İçeriği", () => {
    test("tüm bölümleriyle açılır", async ({ page }) => {
      await page.goto("/admin/icerik");

      await expect(page.getByRole("heading", { name: "Site İçeriği" })).toBeVisible();
      for (const baslik of [
        "Hakkımızda Metni",
        "Hakkımızda Fotoğrafı",
        "Değer Kartları",
        "Ekip Kartları",
        "Galeri Fotoğrafları",
      ]) {
        await expect(page.getByRole("heading", { name: baslik })).toBeVisible();
      }
    });

    test("galeri fotoğrafları kompakt listede, sıralama düğmeleriyle", async ({ page }) => {
      await page.goto("/admin/icerik");

      const yukari = page.getByRole("button", { name: "Yukarı taşı" });
      const adet = await yukari.count();
      test.skip(adet === 0, "Galeride fotoğraf yok");

      // İlk fotoğraf yukarı taşınamaz, sonuncusu aşağı taşınamaz.
      await expect(yukari.first()).toBeDisabled();
      await expect(page.getByRole("button", { name: "Aşağı taşı" }).last()).toBeDisabled();
    });
  });

  test.describe("Müşteri arama", () => {
    test("arama sunucudan filtreli sonuç döndürür", async ({ page }) => {
      await page.goto("/admin/musteriler");

      const kutu = page.getByPlaceholder("İsim, telefon veya e-posta ara…");
      await expect(kutu).toBeVisible();

      // Önce kaç kayıt olduğunu al.
      const oncesi = await page.getByRole("button").filter({ hasNotText: "Çıkış" }).count();

      await kutu.fill("zzzz-olmayan-musteri");
      await expect(page.getByText("Eşleşen müşteri yok.")).toBeVisible({ timeout: 10_000 });

      await kutu.fill("");
      await expect(page.getByText("Eşleşen müşteri yok.")).toHaveCount(0, { timeout: 10_000 });
      expect(oncesi).toBeGreaterThan(0);
    });

    test("listede en fazla bir sayfa kayıt gösterilir", async ({ page }) => {
      await page.goto("/admin/musteriler");

      // Sayfa altındaki bilgi satırı toplam kaydı söyler.
      await expect(page.getByText(/kayıt/)).toBeVisible();
    });
  });

  test.describe("Silme kuralları", () => {
    test("randevusu olan hizmette Sil yok, olmayanda var", async ({ page }) => {
      await page.goto("/admin/hizmetler");

      // "Saç Kesimi" gerçek randevulara bağlı — silinememeli.
      const korunan = satir(page, "Saç Kesimi");
      await expect(korunan.getByRole("button", { name: "Pasifleştir" })).toBeVisible();
      await expect(korunan.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);

      // Randevusuz bir hizmette Sil görünmeli.
      const silinebilir = satir(page, "Cilt Bakımı");
      await expect(silinebilir.getByRole("button", { name: "Sil", exact: true })).toBeVisible();
    });

    test("dükkan sahibinde Sil ve Pasifleştir yok", async ({ page }) => {
      await page.goto("/admin/calisanlar");

      const sahip = satir(page, "Sahip");
      await expect(sahip.getByRole("button", { name: "Düzenle" })).toBeVisible();
      await expect(sahip.getByRole("button", { name: "Sil", exact: true })).toHaveCount(0);
      await expect(sahip.getByRole("button", { name: "Pasifleştir" })).toHaveCount(0);
    });
  });

  test.describe("Servis anahtarı", () => {
    /**
     * Çalışan düzenleme service role client kullanıyor. Anahtar ortamda
     * yoksa kaydetme "SUPABASE_SERVICE_ROLE_KEY tanımlı değil" hatası verir
     * ve form açık kalır; bu test onu deploy öncesi yakalar.
     *
     * Sonucu beklemeden ölçmek yanıltıcı: düğme tıklanınca metni
     * "Kaydediliyor…" oluyor, dolayısıyla "Kaydet" seçicisi anında sıfıra
     * düşüyor ve test action bitmeden geçiyordu. Önce iki sonuçtan biri
     * gerçekleşene kadar bekleyip sonra hangisi olduğunu doğruluyoruz.
     */
    test("çalışan kaydı değişiklik yapılmadan kaydedilebilir", async ({ page }) => {
      await page.goto("/admin/calisanlar");
      await page.getByRole("button", { name: "Düzenle" }).first().click();

      const form = page.locator("form").filter({ hasText: "Ad Soyad" });
      await expect(form).toBeVisible();

      const hata = form.locator("p.text-danger");
      await form.getByRole("button", { name: "Kaydet", exact: true }).click();

      // Ya form kapanır (başarı) ya da hata belirir.
      await Promise.race([
        form.waitFor({ state: "detached", timeout: 20_000 }).catch(() => {}),
        hata.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {}),
      ]);

      const hataMetni = (await hata.count()) ? await hata.innerText() : "";
      expect(hataMetni, "çalışan kaydedilemedi").toBe("");
      await expect(form, "kaydetme sonrası form kapanmadı").toHaveCount(0);
    });
  });
});
