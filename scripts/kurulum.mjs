#!/usr/bin/env node
/**
 * Yeni müşteri kurulumu.
 *
 * Şablon her müşteri için ayrı Supabase projesine deploy ediliyor. Migration'lar
 * şemayı kuruyor ama içeriği kurmuyor: dükkan kaydı, haftalık saatler ve sahip
 * hesabı elle açılmak zorundaydı. Bu adımlar sırayla ve doğru shop_id ile
 * yapılmadığında panel açılmıyor, üstelik hata mesajı bunu söylemiyor.
 *
 * Betik bu üçünü tek komutta ve idempotent şekilde kuruyor.
 *
 * Kullanım:
 *   npm run kurulum
 *
 * Önkoşul: hedef Supabase projesinde migration'lar uygulanmış olmalı
 *   npx supabase link --project-ref <ref>
 *   npx supabase db push
 */

import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const rl = createInterface({ input: process.stdin, output: process.stdout });

/**
 * Dosyadan kurulum: `npm run kurulum -- --dosya musteri.local.json`
 *
 * Elle soru-cevap tek müşteri için yeterli ama tekrarlanabilir değil ve
 * otomatik test edilemiyor (Node readline boru ile beslenen girdide
 * yalnızca ilk soruyu cevaplıyor). Dosya modu aynı kurulumu birebir
 * tekrar çalıştırmayı da mümkün kılıyor.
 *
 * Dosya gizli anahtar içerir — adı *.local.json olmalı, .gitignore kapsamında.
 */
function ayarDosyasiniOku() {
  const i = process.argv.indexOf("--dosya");
  if (i === -1) return null;

  const yol = process.argv[i + 1];
  if (!yol) throw new Error("--dosya için bir yol verin.");
  if (!existsSync(yol)) throw new Error(`Ayar dosyası bulunamadı: ${yol}`);

  const ayar = JSON.parse(readFileSync(yol, "utf8"));
  const eksik = [];
  if (!ayar.supabaseUrl) eksik.push("supabaseUrl");
  if (!ayar.serviceKey) eksik.push("serviceKey");
  if (!ayar.dukkan?.ad) eksik.push("dukkan.ad");
  if (!ayar.sahip?.eposta) eksik.push("sahip.eposta");
  if (!ayar.sahip?.ad) eksik.push("sahip.ad");
  if (!ayar.sahip?.sifre) eksik.push("sahip.sifre");
  if (eksik.length) throw new Error(`Ayar dosyasında eksik alanlar: ${eksik.join(", ")}`);

  return ayar;
}

const renk = {
  bilgi: (s) => `\x1b[36m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  uyari: (s) => `\x1b[33m${s}\x1b[0m`,
  hata: (s) => `\x1b[31m${s}\x1b[0m`,
  soluk: (s) => `\x1b[90m${s}\x1b[0m`,
};

function sor(soru, varsayilan = "") {
  const etiket = varsayilan ? `${soru} ${renk.soluk(`(${varsayilan})`)}: ` : `${soru}: `;
  return new Promise((cevapla) => {
    rl.question(etiket, (cevap) => cevapla(cevap.trim() || varsayilan));
  });
}

/**
 * Şifre/anahtar yazılırken ekrana basılmasın.
 *
 * Terminalde readline'ın kendi çıktısı maskeleniyor. Girdi boru ile
 * geliyorsa (test, otomasyon) maskeleme hem gereksiz hem de readline'ı
 * kilitliyordu — o durumda düz okunuyor.
 */
function sifreSor(soru) {
  const etiket = `${soru}: `;
  return new Promise((cevapla) => {
    if (!process.stdin.isTTY) {
      rl.question(etiket, (cevap) => cevapla(cevap.trim()));
      return;
    }

    const orijinalYaz = rl._writeToOutput;
    rl._writeToOutput = function (metin) {
      if (metin.includes(soru)) orijinalYaz.call(rl, metin);
      else if (metin.trim()) orijinalYaz.call(rl, "*");
    };

    rl.question(etiket, (cevap) => {
      rl._writeToOutput = orijinalYaz;
      process.stdout.write("\n");
      cevapla(cevap.trim());
    });
  });
}

async function evetMi(soru, varsayilan = true) {
  const cevap = await sor(`${soru} (e/h)`, varsayilan ? "e" : "h");
  return cevap.toLowerCase().startsWith("e");
}

function slugYap(metin) {
  const tr = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u" };
  return metin
    .toLocaleLowerCase("tr")
    .replace(/[çğıİöşü]/g, (k) => tr[k] ?? k)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** Hakkımızda sayfası boş görünmesin diye varsayılan değer kartları. */
const VARSAYILAN_DEGERLER = [
  {
    title: "Tek seansta tek müşteri",
    body: "Koltuklar arasında koşturmuyoruz. Randevunuz size ayrılmıştır, üzerine pay bırakılır.",
    sort_order: 1,
  },
  {
    title: "Önce tespit, sonra kesim",
    body: "Saç tipiniz ve günlük rutininiz üzerine kısa bir konuşma yapmadan makasa dokunmuyoruz.",
    sort_order: 2,
  },
  {
    title: "Şeffaf fiyat",
    body: "Liste sitede ve salonda aynı. Uzunluk farkı doğuracak işlerde ücret randevu öncesi söylenir.",
    sort_order: 3,
  },
];

const BASLANGIC_HIZMETLERI = [
  { name: "Saç Kesimi", duration_minutes: 30, price: 250, sort_order: 1 },
  { name: "Sakal Tıraşı", duration_minutes: 20, price: 150, sort_order: 2 },
  { name: "Saç + Sakal", duration_minutes: 45, price: 350, sort_order: 3 },
  { name: "Çocuk Kesimi", duration_minutes: 25, price: 200, sort_order: 4 },
];

function bitir(kod) {
  rl.close();
  process.exit(kod);
}

async function main() {
  const ayar = ayarDosyasiniOku();

  console.log(renk.bilgi("\n═══ Yeni müşteri kurulumu ═══\n"));
  if (ayar) console.log(renk.soluk("Ayar dosyasından okunuyor.\n"));
  console.log(
    renk.soluk(
      "Önkoşul: hedef Supabase projesinde migration'lar uygulanmış olmalı\n" +
        "  npx supabase link --project-ref <ref> && npx supabase db push\n",
    ),
  );

  // ---------- Bağlantı ----------
  const supabaseUrl = ayar
    ? ayar.supabaseUrl
    : await sor("Supabase Proje URL'i (https://xxx.supabase.co)");
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supabaseUrl)) {
    console.error(renk.hata("Geçerli bir Supabase proje URL'i girin."));
    bitir(1);
  }

  let serviceKey;
  if (ayar) {
    serviceKey = ayar.serviceKey;
  } else {
    console.log(renk.soluk("  Service role key: Supabase → Project Settings → API → service_role"));
    serviceKey = await sifreSor("Service Role Key");
  }
  if (!serviceKey) {
    console.error(renk.hata("Service role key gerekli."));
    bitir(1);
  }

  const sb = createClient(supabaseUrl.replace(/\/$/, ""), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ---------- Şema kontrolü ----------
  process.stdout.write("\nŞema kontrol ediliyor… ");
  const { error: semaHatasi } = await sb.from("site_photos").select("id").limit(1);
  if (semaHatasi) {
    console.log(renk.hata("başarısız"));
    console.error(
      renk.hata(`\nŞema eksik veya erişilemiyor: ${semaHatasi.message}\n`) +
        renk.uyari("Önce migration'ları uygulayın:\n") +
        "  npx supabase link --project-ref <ref>\n  npx supabase db push\n",
    );
    bitir(1);
  }
  console.log(renk.ok("tamam"));

  // ---------- Zaten kurulu mu? ----------
  const { data: mevcut } = await sb.from("shops").select("id, name").limit(1).maybeSingle();
  if (mevcut) {
    console.log(renk.uyari(`\nBu projede zaten bir dükkan var: "${mevcut.name}"`));
    console.log(renk.soluk("Betik mevcut kaydı değiştirmez. Yeni müşteri için yeni proje açın."));
    bitir(1);
  }

  // ---------- Dükkan bilgileri ----------
  let dukkanAdi, slug, telefon, adres, timezone, cutoff;
  if (ayar) {
    ({ ad: dukkanAdi, telefon = "", adres = "" } = ayar.dukkan);
    slug = ayar.dukkan.slug || slugYap(dukkanAdi);
    timezone = ayar.dukkan.timezone || "Europe/Istanbul";
    cutoff = Number(ayar.dukkan.cutoffHours ?? 2);
  } else {
    console.log(renk.bilgi("\n── Dükkan bilgileri ──"));
    dukkanAdi = await sor("İşletme adı");
    if (!dukkanAdi) {
      console.error(renk.hata("İşletme adı zorunlu."));
      bitir(1);
    }
    slug = await sor("Slug", slugYap(dukkanAdi));
    telefon = await sor("Telefon", "");
    adres = await sor("Adres", "");
    timezone = await sor("Zaman dilimi", "Europe/Istanbul");
    cutoff = Number(await sor("İptal süresi (randevuya kaç saat kala kapansın)", "2"));
  }

  // ---------- Sahip hesabı ----------
  let sahipAd, sahipEposta, sahipSifre;
  if (ayar) {
    ({ ad: sahipAd, eposta: sahipEposta, sifre: sahipSifre } = ayar.sahip);
  } else {
    console.log(renk.bilgi("\n── Sahip (admin) hesabı ──"));
    sahipAd = await sor("Ad soyad");
    sahipEposta = await sor("E-posta");
    if (!sahipAd || !sahipEposta) {
      console.error(renk.hata("Sahip adı ve e-postası zorunlu."));
      bitir(1);
    }
    console.log(renk.soluk("  Bu şifreyi müşteriye siz teslim edeceksiniz. En az 8 karakter."));
    sahipSifre = await sifreSor("Şifre");
  }
  if (!sahipSifre || sahipSifre.length < 8) {
    console.error(renk.hata("Şifre en az 8 karakter olmalı."));
    bitir(1);
  }

  // ---------- Seçenekler ----------
  let hizmetEkle, siteUrl;
  if (ayar) {
    hizmetEkle = ayar.ornekHizmetler !== false;
    siteUrl = ayar.siteUrl || "https://ornek.vercel.app";
  } else {
    console.log(renk.bilgi("\n── Başlangıç içeriği ──"));
    hizmetEkle = await evetMi("Örnek hizmetler eklensin mi (panelden düzenlenebilir)");
    siteUrl = await sor("Site adresi (Vercel URL veya domain)", "https://ornek.vercel.app");
  }

  // ---------- Kurulum ----------
  console.log(renk.bilgi("\n── Kuruluyor ──"));

  // 1) Dükkan
  const { data: shop, error: shopHatasi } = await sb
    .from("shops")
    .insert({
      name: dukkanAdi,
      slug,
      timezone,
      phone: telefon || null,
      address: adres || null,
      cutoff_hours: Number.isFinite(cutoff) ? cutoff : 2,
    })
    .select("id")
    .single();

  if (shopHatasi) {
    console.error(renk.hata(`Dükkan oluşturulamadı: ${shopHatasi.message}`));
    bitir(1);
  }
  console.log(renk.ok("✓") + " Dükkan kaydı");

  // 2) Haftalık saatler — Pazartesi-Cumartesi açık, Pazar kapalı
  const saatler = [0, 1, 2, 3, 4, 5, 6].map((gun) => ({
    shop_id: shop.id,
    day_of_week: gun,
    is_closed: gun === 0,
    opens_at: gun === 0 ? null : "09:00",
    closes_at: gun === 0 ? null : "19:00",
  }));
  const { error: saatHatasi } = await sb.from("shop_hours").insert(saatler);
  if (saatHatasi) {
    console.error(renk.hata(`Çalışma saatleri eklenemedi: ${saatHatasi.message}`));
    bitir(1);
  }
  console.log(renk.ok("✓") + ` Çalışma saatleri (${GUN_ADLARI[1]}–${GUN_ADLARI[6]} 09:00–19:00, ${GUN_ADLARI[0]} kapalı)`);

  // 3) Sahip: önce auth kullanıcısı, sonra staff kaydı
  const { data: authUser, error: authHatasi } = await sb.auth.admin.createUser({
    email: sahipEposta,
    password: sahipSifre,
    email_confirm: true,
  });
  if (authHatasi || !authUser?.user) {
    console.error(renk.hata(`Giriş hesabı oluşturulamadı: ${authHatasi?.message}`));
    bitir(1);
  }

  const { error: staffHatasi } = await sb.from("staff").insert({
    shop_id: shop.id,
    auth_user_id: authUser.user.id,
    full_name: sahipAd,
    email: sahipEposta,
    role: "owner",
    is_active: true,
  });
  if (staffHatasi) {
    // Yarım kalmış auth kullanıcısı bırakmayalım.
    await sb.auth.admin.deleteUser(authUser.user.id);
    console.error(renk.hata(`Sahip kaydı oluşturulamadı: ${staffHatasi.message}`));
    bitir(1);
  }
  console.log(renk.ok("✓") + ` Sahip hesabı (${sahipEposta})`);

  // 4) Değer kartları
  //    Migration bunları yalnızca o an var olan dükkanlar için ekliyor;
  //    sonradan kurulan dükkanda Hakkımızda sayfası boş kalırdı.
  const { error: degerHatasi } = await sb
    .from("shop_values")
    .insert(VARSAYILAN_DEGERLER.map((d) => ({ ...d, shop_id: shop.id })));
  if (degerHatasi) {
    console.log(renk.uyari("! Değer kartları eklenemedi: " + degerHatasi.message));
  } else {
    console.log(renk.ok("✓") + " Hakkımızda değer kartları");
  }

  // 5) Örnek hizmetler
  if (hizmetEkle) {
    const { error: hizmetHatasi } = await sb
      .from("services")
      .insert(BASLANGIC_HIZMETLERI.map((h) => ({ ...h, shop_id: shop.id, is_active: true })));
    if (hizmetHatasi) {
      console.log(renk.uyari("! Hizmetler eklenemedi: " + hizmetHatasi.message));
    } else {
      console.log(renk.ok("✓") + ` ${BASLANGIC_HIZMETLERI.length} örnek hizmet`);
    }
  }

  // ---------- Ortam değişkenleri ----------
  const cronSecret = randomBytes(32).toString("base64url");
  const envDosya = `.env.${slug}`;
  const envIcerik = [
    `# ${dukkanAdi} — Vercel ortam değişkenleri`,
    `# Bu dosya .gitignore kapsamında; içeriği Vercel → Settings → Environment Variables'a girin.`,
    ``,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.replace(/\/$/, "")}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase → Project Settings → API → anon public>`,
    `SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API → service_role>`,
    `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
    `CRON_SECRET=${cronSecret}`,
    `RESEND_API_KEY=<Resend → API Keys>`,
    `RESEND_FROM_EMAIL=Randevu <randevu@${slug}.com>`,
    ``,
  ].join("\n");

  if (existsSync(envDosya)) {
    console.log(renk.uyari(`\n! ${envDosya} zaten var, üzerine yazılmadı.`));
  } else {
    writeFileSync(envDosya, envIcerik, "utf8");
    console.log(renk.ok("✓") + ` Ortam değişkeni şablonu: ${envDosya}`);
  }

  // ---------- Özet ----------
  console.log(renk.bilgi("\n═══ Kurulum tamam ═══\n"));
  console.log(`  Dükkan     : ${dukkanAdi}`);
  console.log(`  Panel      : ${siteUrl}/giris`);
  console.log(`  Sahip      : ${sahipEposta}`);
  console.log(renk.soluk(`  Şifre      : (siz belirlediniz — burada gösterilmiyor)`));

  console.log(renk.uyari("\nKalan adımlar:"));
  console.log(`  1. ${envDosya} içindeki <...> alanlarını doldurun`);
  console.log(`  2. Vercel'de yeni proje açıp bu değişkenleri girin`);
  console.log(`  3. Deploy sonrası NEXT_PUBLIC_SITE_URL'i gerçek adresle güncelleyin`);
  console.log(`  4. Panelden hizmetleri, saatleri ve fotoğrafları müşteriye göre düzenleyin`);
  console.log(
    renk.soluk(
      `  Not: RESEND_API_KEY girilmezse randevu onay ve hatırlatma e-postaları gönderilmez.\n`,
    ),
  );

  bitir(0);
}

main().catch((err) => {
  console.error(renk.hata(`\nBeklenmeyen hata: ${err?.message ?? err}`));
  bitir(1);
});
