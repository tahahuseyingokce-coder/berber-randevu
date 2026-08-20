# İş Mantığı Kararları ve Kapsam Dışı Bırakılanlar

## İş Mantığı Kararları
- **Onay akışı:** Manuel — çalışan kendi randevusunu onaylar. Telefonla/admin
  panelden girilen randevular **otomatik onaylı** sayılır.
- **Müşteri kaydı:** Üyelik yok, sadece ad+telefon+e-posta (e-posta zorunlu)
- **Bildirim:** E-posta ile (randevu onayı + hatırlatma, hem müşteriye hem berbere)
- **Çalışan-hizmet:** Her çalışan her hizmeti yapabilir (eşleştirme yok)
- **Ödeme:** Kapıda ödeme, online kapora yok
- **Müşteri notları:** Müşteriye bağlı (çalışana değil) — kim yazarsa yazsın
  herkes görür, isim+tarih ile loglanır, üzerine eklenir (silinmez)
- **Erteleme:** Yok, sadece iptal var
- **İptal cutoff:** Var — dükkan ayarlarından kaç saat kala iptal edilemeyeceği
  belirlenebilir (varsayılan 2 saat)
- **Manuel randevu girişi:** Admin panelden var (telefon randevuları için),
  otomatik onaylı
- **Gizlilik:** Basit KVKK/gizlilik metni sayfası var, ama müşteri verisi silme
  özelliği yok

## Kapsam Dışı Bırakılanlar (bilinçli olarak eklenmedi)
- Buffer time (hizmetler arası tampon süre)
- Favori çalışan hatırlatması
- Galeri / Instagram embed
- Bekleme listesi (waitlist)
- iCal/Google Calendar senkronizasyonu
- Mail gönderim hatası takip ekranı
- CSV export
- Müşteri veri silme özelliği
