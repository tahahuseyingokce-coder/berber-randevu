# Berber / Kuaför Randevu Sistemi

Berber ve kuaförlere satılan, randevu alınabilen web sitesi + admin paneli +
çalışan paneli. Tek kod tabanından her müşteri için ayrı deploy yapılır:
ayrı domain, ayrı Supabase projesi, tamamen bağımsız veri.

## Teknik Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Supabase** — Postgres + Auth + RLS
- **Resend** — e-posta bildirimleri
- **Vercel** — deploy + Cron
- date-fns / react-hook-form + zod / react-big-calendar

## Kurulum

```bash
npm install
```

`.env.local.example` dosyasını `.env.local` olarak kopyalayıp doldurun:

```bash
cp .env.local.example .env.local
```

Ardından:

```bash
npm run dev
```

## Ortam Değişkenleri

| Değişken | Zorunlu | Ne işe yarar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Evet | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Evet | Public (anon) anahtar |
| `NEXT_PUBLIC_SITE_URL` | Evet | Site adresi — iptal linkleri, sitemap ve OG etiketleri bunu kullanır |
| `SUPABASE_SERVICE_ROLE_KEY` | Kısmen | Çalışan hesabı oluşturma ve cron işleri için. **Gizli** — asla istemciye sızmamalı |
| `RESEND_API_KEY` | Hayır | Tanımlı değilse e-posta gönderilmez, randevu akışı normal çalışır |
| `RESEND_FROM_EMAIL` | Hayır | Gönderen adresi (varsayılan Resend test adresi) |
| `CRON_SECRET` | Cron için | Tanımlı değilse cron endpoint'leri **isteği reddeder** |

## Veritabanı

Migration'lar `supabase/migrations/` altında. Yeni bir müşteri için önce şema:

```bash
npx supabase link --project-ref <proje-ref>
npx supabase db push
```

## Yeni Müşteri Kurulumu

Şema kurulduktan sonra dükkan kaydı, haftalık saatler ve sahip hesabı gerekir.
Bunları elle açmak yerine:

```bash
npm run kurulum
```

Betik sırayla sorar, sonra şunları oluşturur:

- `shops` kaydı
- 7 günlük `shop_hours` (Pzt–Cmt 09:00–19:00, Pazar kapalı — panelden değiştirilir)
- Supabase Auth kullanıcısı + `role='owner'` olan `staff` kaydı
- Hakkımızda değer kartları (migration bunları yalnızca o an var olan dükkanlar
  için ekliyor; sonradan kurulan dükkanda sayfa boş kalırdı)
- İsteğe bağlı örnek hizmetler
- `.env.<slug>` şablonu — Vercel'e girilecek değişkenler, `CRON_SECRET` üretilmiş

Aynı kurulumu tekrarlanabilir yapmak için dosyadan da çalışır:

```bash
npm run kurulum -- --dosya musteri.local.json
```

```json
{
  "supabaseUrl": "https://xxx.supabase.co",
  "serviceKey": "<service_role>",
  "dukkan": { "ad": "Berber Adı", "telefon": "...", "adres": "...", "cutoffHours": 2 },
  "sahip": { "ad": "...", "eposta": "...", "sifre": "..." },
  "ornekHizmetler": true,
  "siteUrl": "https://musteri.vercel.app"
}
```

> Dosya gizli anahtar içerir. Adı `kurulum*.local.json` olmalı — `.gitignore`
> bu deseni kapsıyor.

Betik projede zaten bir dükkan varsa hiçbir şey yazmaz; her müşteri ayrı
Supabase projesi kullanır.

### Güvenlik Notları

- Her tabloda RLS açık. Sahip (`owner`) dükkanın tamamını, çalışan (`employee`)
  yalnızca kendi randevularını ve o randevulardaki müşterileri görür.
- Randevu oluşturma `create_appointment` RPC'si üzerinden yapılır — müşteri
  upsert'i ve randevu insert'i tek transaction'da olur.
- Çifte randevu koruması uygulama kodunda değil, veritabanında:
  `EXCLUDE USING GIST` constraint'i.
- `anon` rolü `staff` tablosunda yalnızca `id, shop_id, full_name, role,
  is_active` kolonlarını okuyabilir — telefon ve e-posta kapalıdır.

## Cron İşleri

`vercel.json` iki zamanlanmış görev tanımlar:

| Endpoint | Zamanlama | İş |
|---|---|---|
| `/api/cron/hatirlatma` | Her gün 07:00 UTC | 36 saat içindeki onaylı randevular için hatırlatma e-postası |
| `/api/cron/yedekleme` | Her Pazar 02:00 UTC | Veritabanı JSON export'u, dükkan sahibine e-posta ile |

İkisi de `Authorization: Bearer $CRON_SECRET` bekler ve `SUPABASE_SERVICE_ROLE_KEY`
gerektirir. Hatırlatmalar `appointments.reminder_sent_at` ile takip edilir, bu
yüzden cron tekrar çalışsa bile aynı randevu için ikinci e-posta gitmez.

**Yedekleme dosyası müşteri iletişim bilgileri içerir** — gönderildiği posta
kutusunun güvenli olduğundan emin olun.

## Testler

Playwright E2E testleri `e2e/` altında. Masaüstü ve mobil viewport'ta çalışır.

```bash
npm test
```

Testler dev server'ı 3100 portunda kendisi başlatır. Zaten çalışan bir
`next dev` varsa önce onu durdurun — Next.js aynı dizinde ikinci bir dev
server'a izin vermez.

Giriş ve rol testleri kimlik bilgilerini ortamdan okur; tanımlı değilse
atlanır (repoya kimlik gömülmemesi için):

```
E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD
E2E_EMPLOYEE_EMAIL / E2E_EMPLOYEE_PASSWORD
```

Kapsam: public sayfalar, SEO çıktıları (sitemap/robots/JSON-LD), 4 adımlı
randevu akışı, form doğrulama, erişim koruması, rol ayrımı ve cron
endpoint'lerinin yetkisiz erişime kapalı olduğu.

> Testler gerçek Supabase projesine yazar. Ayrı bir test projesi kullanmanız
> önerilir; aksi halde oluşan kayıtları sonradan temizleyin.

## Deploy (Vercel)

1. Yeni Vercel projesi oluştur, repoyu bağla
2. Yukarıdaki ortam değişkenlerini ekle (`CRON_SECRET` için güçlü, rastgele bir
   değer üret)
3. Deploy et — `vercel.json` cron'ları otomatik kurulur

## Sayfalar

**Public:** `/` · `/hizmetler` · `/galeri` · `/hakkimizda` · `/iletisim` ·
`/randevu-al` · `/randevu/[token]` (iptal) · `/gizlilik`

**Admin (owner):** `/admin` · `/admin/takvim` · `/admin/randevular` ·
`/admin/randevular/yeni` · `/admin/musteriler` · `/admin/calisanlar` ·
`/admin/hizmetler` · `/admin/icerik` · `/admin/ayarlar`

**Personel:** `/personel` · `/personel/takvim` · `/personel/randevular` ·
`/personel/musteriler`

**Auth:** `/giris`
