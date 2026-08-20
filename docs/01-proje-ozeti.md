# Proje Özeti — Teknik Stack ve Roller

## Proje Tanımı
Berber/kuaförlere satılacak, randevu alınabilen web sitesi + admin panel + çalışan
paneli içeren bir SaaS ürünü. Tek kod tabanından (şablon) her müşteri için ayrı
deploy yapılacak (ayrı domain, ayrı Supabase veritabanı), hepsi birbirinden
tamamen bağımsız.

## Teknik Stack
- **Frontend + Backend:** Next.js (React), tek proje içinde (App Router)
- **Veritabanı/Auth:** Supabase (Postgres + Auth + RLS + Realtime)
- **Deploy:** Vercel (tek Pro hesap, her müşteri ayrı proje)
- **E-posta:** Resend (ücretsiz plan ile başla)
- **Zamanlanmış görevler:** Vercel Cron (demo: Hobby, satış sonrası: Pro)
- **Form:** React Hook Form + Zod (resolver ≥5.2.2 kullan, versiyon uyumluluğuna dikkat)
- **Tarih/saat:** date-fns + date-fns-tz
- **Takvim UI:** react-big-calendar (ücretsiz, çalışan sütunları manuel kurulacak)
- **Tasarım süreci:** Claude Design'da mockup → Claude Code'da gerçek geliştirme

## Roller
- **Ana Admin (dükkan sahibi):** Her şeye erişir
- **Çalışan (berber/çırak):** Kendi kullanıcı adı/şifresiyle girer (admin panelden
  "Çalışan Ekle" formuyla oluşturulur, gerçek e-posta+şifre), sadece kendi
  randevularını görür/onaylar, kendisinde randevusu olan müşterilerin bilgilerine
  erişir (tüm CRM'i arayamaz)

## Altyapı Kararları
- Supabase ücretsiz plan yeterli (kapasite açısından sorun yok)
- Auto-pause riski (7 gün kullanılmama) kabul edildi, önlem eklenmeyecek
- Periyodik otomatik yedekleme (Vercel Cron ile veritabanı export) eklenecek
