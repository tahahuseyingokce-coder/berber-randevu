# Berber/Kuaför Randevu Sistemi — Proje Giriş Dosyası

Bu dosya, Claude Code'un projeye başlarken önce okuması gereken giriş noktasıdır.
Detaylı bilgiler `docs/` klasöründeki diğer dosyalarda bölünmüş halde bulunur.

## Proje Nedir?
Berber/kuaförlere satılacak, randevu alınabilen web sitesi + admin panel + çalışan
paneli içeren bir SaaS ürünü. Tek kod tabanından (şablon) her müşteri için ayrı
deploy yapılır (ayrı domain, ayrı Supabase veritabanı), hepsi birbirinden tamamen
bağımsızdır.

## Dosya Haritası
- `01-proje-ozeti.md` — Proje tanımı, teknik stack, roller
- `02-is-mantigi.md` — İş mantığı kararları + kapsam dışı bırakılanlar
- `03-veritabani-semasi.md` — Tablolar ve teknik kritik noktalar (exclusion constraint, RPC, timezone, RLS)
- `04-sayfa-route-listesi.md` — Public / Admin / Personel / Auth route listesi
- `05-tasarim-yonu.md` — Claude Design tasarım brief'i (stil, palet, tipografi)
- `06-gelistirme-fazlari.md` — Faz 0'dan Faz 5'e geliştirme planı

## Önerilen Okuma Sırası
1. Bu dosya (genel bakış)
2. `01-proje-ozeti.md`
3. `03-veritabani-semasi.md` (Faz 0 için kritik)
4. `02-is-mantigi.md`
5. `04-sayfa-route-listesi.md`
6. `06-gelistirme-fazlari.md`
7. `05-tasarim-yonu.md` (UI geliştirilirken)

## Şu Anki Durum
Tasarım (Claude Design ile mockup) tamamlandı ve onaylandı. Sıradaki adım
Faz 0: Next.js + Supabase + Auth + RLS temel altyapısının kurulması.
