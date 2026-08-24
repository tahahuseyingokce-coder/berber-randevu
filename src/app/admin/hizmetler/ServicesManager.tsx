"use client";

import { useState, useTransition } from "react";
import type { Service } from "@/lib/types";
import {
  btnDangerSm,
  btnPrimary,
  btnPrimarySm,
  btnSecondarySm,
  fieldClass,
} from "@/components/ui/button";
import {
  createServiceAction,
  deleteServiceAction,
  toggleServiceActiveAction,
  updateServiceAction,
} from "./actions";

/** Randevusu olan hizmet silinemez; düğme buna göre gösterilir. */
type ServiceRow = Service & { is_active: boolean; appointment_count: number };

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
            className={fieldClass}
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
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Fiyat (opsiyonel)
          <input
            type="number"
            min={0}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={isPending} className={btnPrimary}>
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
            <ServiceRowView
              key={s.id}
              service={s}
              onEdit={() => setEditingId(s.id)}
              onError={setError}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ServiceRowView({
  service,
  onEdit,
  onError,
}: {
  service: ServiceRow;
  onEdit: () => void;
  onError: (msg: string | null) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sunucu da aynı kuralı uyguluyor; buradaki kontrol yalnızca
  // çalışmayacak bir düğme göstermemek için.
  const canDelete = service.appointment_count === 0;

  function onDelete() {
    onError(null);
    startTransition(async () => {
      try {
        await deleteServiceAction(service.id);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Silinemedi.");
        setConfirming(false);
      }
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm ${
        !service.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <span className="font-medium">{service.name}</span>
        <span className="ml-2 text-fg-muted">
          {service.duration_minutes} dk
          {service.price !== null ? ` · ${formatPrice(service.price)}` : ""}
          {service.is_active ? "" : " · Pasif"}
        </span>
      </div>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-fg-muted">{service.name} silinsin mi?</span>
          <button type="button" onClick={onDelete} disabled={isPending} className={btnDangerSm}>
            {isPending ? "Siliniyor…" : "Evet, sil"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className={btnSecondarySm}
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={onEdit} className={btnSecondarySm}>
            Düzenle
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleServiceActiveAction(service.id, !service.is_active))
            }
            className={btnSecondarySm}
          >
            {service.is_active ? "Pasifleştir" : "Aktifleştir"}
          </button>
          {canDelete && (
            <button type="button" onClick={() => setConfirming(true)} className={btnDangerSm}>
              Sil
            </button>
          )}
        </div>
      )}
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
        className={fieldClass}
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className={fieldClass}
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className={fieldClass}
      />
      <button type="submit" disabled={isPending} className={btnPrimarySm}>
        Kaydet
      </button>
      <button type="button" onClick={onDone} className={btnSecondarySm}>
        Vazgeç
      </button>
    </form>
  );
}
