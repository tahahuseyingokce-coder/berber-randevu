"use client";

import { useState, useTransition } from "react";
import type { Service } from "@/lib/types";
import { createServiceAction, toggleServiceActiveAction, updateServiceAction } from "./actions";

type ServiceRow = Service & { is_active: boolean };

function formatPrice(price: number | null) {
  if (price === null) return "";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

export function ServicesManager({ services }: { services: ServiceRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newPrice, setNewPrice] = useState("");

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createServiceAction({
          name: newName,
          durationMinutes: Number(newDuration),
          price: newPrice ? Number(newPrice) : null,
        });
        setNewName("");
        setNewDuration("30");
        setNewPrice("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hizmet eklenemedi.");
      }
    });
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
        <label className="grid gap-1 text-sm">
          Hizmet Adı
          <input
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Süre (dk)
          <input
            required
            type="number"
            min={5}
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Fiyat (opsiyonel)
          <input
            type="number"
            min={0}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent text-accent-fg px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Ekle
        </button>
      </form>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="grid gap-2">
        {services.map((s) =>
          editingId === s.id ? (
            <EditRow
              key={s.id}
              service={s}
              onDone={() => setEditingId(null)}
              onError={setError}
            />
          ) : (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm ${
                !s.is_active ? "opacity-50" : ""
              }`}
            >
              <div>
                <span className="font-medium">{s.name}</span>
                <span className="text-fg-muted ml-2">
                  {s.duration_minutes} dk{s.price !== null ? ` · ${formatPrice(s.price)}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingId(s.id)}
                  className="text-fg-muted text-xs hover:text-fg"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => toggleServiceActiveAction(s.id, !s.is_active))
                  }
                  className="text-xs text-fg-muted hover:text-fg disabled:opacity-40"
                >
                  {s.is_active ? "Pasifleştir" : "Aktifleştir"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EditRow({
  service,
  onDone,
  onError,
}: {
  service: ServiceRow;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const [name, setName] = useState(service.name);
  const [duration, setDuration] = useState(String(service.duration_minutes));
  const [price, setPrice] = useState(service.price !== null ? String(service.price) : "");
  const [isPending, startTransition] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    startTransition(async () => {
      try {
        await updateServiceAction({
          id: service.id,
          name,
          durationMinutes: Number(duration),
          price: price ? Number(price) : null,
        });
        onDone();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Güncellenemedi.");
      }
    });
  }

  return (
    <form
      onSubmit={onSave}
      className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto_auto] items-end rounded-lg border border-accent bg-surface px-4 py-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent text-accent-fg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
      >
        Kaydet
      </button>
      <button type="button" onClick={onDone} className="text-fg-muted text-xs">
        Vazgeç
      </button>
    </form>
  );
}
