"use client";

import { useState, useTransition } from "react";
import type { Shop, ShopHour } from "@/lib/types";
import { btnPrimary, btnSecondarySm, fieldClass } from "@/components/ui/button";
import { HAZIR_PALETLER, normalizeTheme } from "@/lib/theme";
import {
  updateShopHourAction,
  updateShopSettingsAction,
  updateShopThemeAction,
} from "./actions";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function SettingsForm({ shop, hours }: { shop: Shop; hours: ShopHour[] }) {
  return (
    <div className="grid gap-10">
      <ShopInfoForm shop={shop} />
      <ThemeForm shop={shop} />
      <HoursEditor hours={hours} />
    </div>
  );
}

/**
 * Renk paleti. İki renk yetiyor; ara tonlar ve yazı renkleri sunucuda
 * türetiliyor, böylece okunmayan bir kombinasyon seçilemiyor.
 */
function ThemeForm({ shop }: { shop: Shop }) {
  const mevcut = normalizeTheme(shop);
  const [accent, setAccent] = useState(mevcut.accent);
  const [ink, setInk] = useState(mevcut.ink);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateShopThemeAction({ accent, ink });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
      <div>
        <h2 className="text-xl font-semibold">Renkler</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Sitenin tamamına uygulanır. Yazı renkleri okunurluk için otomatik seçilir.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HAZIR_PALETLER.map((p) => (
          <button
            key={p.ad}
            type="button"
            onClick={() => {
              setAccent(p.accent);
              setInk(p.ink);
              setSaved(false);
            }}
            className={btnSecondarySm}
            title={p.ad}
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full border border-border"
              style={{ background: p.accent }}
            />
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full border border-border"
              style={{ background: p.ink }}
            />
            {p.ad.split(" (")[0]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Vurgu rengi
          <span className="text-xs text-fg-subtle">Butonlar, fiyatlar, aktif sekme</span>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-surface"
              aria-label="Vurgu rengi seç"
            />
            <input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className={`${fieldClass} font-mono`}
            />
          </span>
        </label>

        <label className="grid gap-1 text-sm">
          Mürekkep rengi
          <span className="text-xs text-fg-subtle">Koyu bant, yazı ve çizgiler</span>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={ink}
              onChange={(e) => setInk(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-surface"
              aria-label="Mürekkep rengi seç"
            />
            <input
              value={ink}
              onChange={(e) => setInk(e.target.value)}
              className={`${fieldClass} font-mono`}
            />
          </span>
        </label>
      </div>

      {/* Kaydetmeden önce nasıl duracağını göster. */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="px-4 py-3" style={{ background: ink, color: "#ffffff" }}>
          <span className="text-sm font-bold uppercase tracking-wider">{shop.name}</span>
        </div>
        <div className="flex items-center gap-3 bg-surface px-4 py-4">
          <span
            className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider"
            style={{ background: accent, color: "#ffffff" }}
          >
            Randevu Al
          </span>
          <span className="text-lg font-black" style={{ color: accent }}>
            ₺250
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Kaydedildi.</p>}

      <button type="submit" disabled={isPending} className={`${btnPrimary} justify-self-start`}>
        {isPending ? "Kaydediliyor…" : "Renkleri Kaydet"}
      </button>
    </form>
  );
}

function ShopInfoForm({ shop }: { shop: Shop }) {
  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [address, setAddress] = useState(shop.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(shop.maps_url ?? "");
  const [cutoffHours, setCutoffHours] = useState(String(shop.cutoff_hours));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateShopSettingsAction({
          name,
          phone,
          address,
          mapsUrl,
          cutoffHours: Number(cutoffHours),
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
      <h2 className="text-xl font-semibold">Dükkan Bilgileri</h2>

      <label className="grid gap-1 text-sm">
        Dükkan Adı
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Telefon
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
      </label>

      <label className="grid gap-1 text-sm">
        Adres
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Google Haritalar Bağlantısı (opsiyonel)
        <input
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="https://www.google.com/maps/..."
          className={fieldClass}
        />
        <span className="text-xs text-fg-subtle">
          Boş bırakırsanız harita yukarıdaki adresten çizilir. Kapıyı tam göstermesi için
          Google Haritalar&apos;da dükkanınızı bulun, <strong>Paylaş → Harita yerleştir</strong>{" "}
          deyip çıkan bağlantıyı buraya yapıştırın.
        </span>
      </label>

      <label className="grid gap-1 text-sm">
        İptal Cutoff (saat)
        <input
          type="number"
          min={0}
          max={72}
          value={cutoffHours}
          onChange={(e) => setCutoffHours(e.target.value)}
          className={`${fieldClass} w-32`}
        />
        <span className="text-xs text-fg-subtle">
          Randevu saatine bu kadar saat kala müşteri artık iptal edemez.
        </span>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Kaydedildi.</p>}

      <button type="submit" disabled={isPending} className={`${btnPrimary} justify-self-start`}>
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

function HoursEditor({ hours }: { hours: ShopHour[] }) {
  return (
    <div className="grid max-w-lg gap-3">
      <h2 className="text-xl font-semibold">Çalışma Saatleri</h2>
      {hours.map((h) => (
        <HourRow key={h.day_of_week} hour={h} />
      ))}
    </div>
  );
}

function HourRow({ hour }: { hour: ShopHour }) {
  const [isClosed, setIsClosed] = useState(hour.is_closed);
  const [opensAt, setOpensAt] = useState(hour.opens_at?.slice(0, 5) ?? "09:00");
  const [closesAt, setClosesAt] = useState(hour.closes_at?.slice(0, 5) ?? "19:00");
  const [isPending, startTransition] = useTransition();

  function save(next: { isClosed: boolean; opensAt: string; closesAt: string }) {
    startTransition(() =>
      updateShopHourAction({
        dayOfWeek: hour.day_of_week,
        isClosed: next.isClosed,
        opensAt: next.opensAt,
        closesAt: next.closesAt,
      }),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
      <span className="w-24 shrink-0 font-medium">{DAY_LABELS[hour.day_of_week]}</span>

      <label className="flex shrink-0 items-center gap-1.5 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={!isClosed}
          disabled={isPending}
          className="h-4 w-4 accent-[var(--color-accent)]"
          onChange={(e) => {
            const nextClosed = !e.target.checked;
            setIsClosed(nextClosed);
            save({ isClosed: nextClosed, opensAt, closesAt });
          }}
        />
        Açık
      </label>

      {!isClosed && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={opensAt}
            disabled={isPending}
            onChange={(e) => setOpensAt(e.target.value)}
            onBlur={() => save({ isClosed, opensAt, closesAt })}
            className="rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm outline-none focus:border-accent"
          />
          <span className="text-fg-muted">–</span>
          <input
            type="time"
            value={closesAt}
            disabled={isPending}
            onChange={(e) => setClosesAt(e.target.value)}
            onBlur={() => save({ isClosed, opensAt, closesAt })}
            className="rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm outline-none focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}
