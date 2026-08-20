-- ============================================================
-- Faz 4: Hatırlatma e-postası takibi
-- Cron birden fazla kez çalışsa da (yeniden deneme, çakışan tetikleme)
-- aynı randevu için ikinci kez hatırlatma gönderilmemesi gerekir.
-- ============================================================
alter table appointments add column if not exists reminder_sent_at timestamptz;

-- Bekleyen hatırlatmaları hızlı bulmak için kısmi indeks.
create index if not exists appointments_pending_reminder_idx
  on appointments (starts_at)
  where reminder_sent_at is null and status = 'confirmed';
