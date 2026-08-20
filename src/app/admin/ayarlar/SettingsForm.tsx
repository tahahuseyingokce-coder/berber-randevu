"use client";

import { useState, useTransition } from "react";
import type { Shop, ShopHour } from "@/lib/types";
import { updateShopHourAction, updateShopSettingsAction } from "./actions";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function SettingsForm({ shop, hours }: { shop: Shop; hours: ShopHour[] }) {
  return (
    <div className="grid gap-10">
      <ShopInfoForm shop={shop} />
      <HoursEditor hours={hours} />
    </div>
  );
}

function ShopInfoForm({ shop }: { shop: Shop }) {
  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [address, setAddress] = useState(shop.address ?? "");
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
          cutoffHours: Number(cutoffHours),
        });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-lg">
      <h2 className="text-xl">Dükkan Bilgileri</h2>

      <label className="grid gap-1 text-sm">
        Dükkan Adı
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Telefon
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Adres
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent resize-none"
        />
      </label>

      <label className="grid gap-1 text-sm">
        İptal Cutoff (saat)
        <input
          type="number"
          min={0}
          max={72}
          value={cutoffHours}
          onChange={(e) => setCutoffHours(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent w-32"
        />
        <span className="text-fg-subtle text-xs">
          Randevu saatine bu kadar saat kala müşteri artık iptal edemez.
        </span>
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}
      {saved && <p className="text-success text-sm">Kaydedildi.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="justify-self-start rounded-lg bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium disabled:opacity-40"
      >
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

function HoursEditor({ hours }: { hours: ShopHour[] }) {
  return (
    <div className="grid gap-3 max-w-lg">
      <h2 className="text-xl">Çalışma Saatleri</h2>
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
      <span className="w-24 shrink-0">{DAY_LABELS[hour.day_of_week]}</span>

      <label className="flex items-center gap-1.5 text-fg-muted text-xs shrink-0">
        <input
          type="checkbox"
          checked={!isClosed}
          disabled={isPending}
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
