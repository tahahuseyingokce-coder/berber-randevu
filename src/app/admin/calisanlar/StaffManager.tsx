"use client";

import { useState, useTransition } from "react";
import {
  btnPrimary,
  btnPrimarySm,
  btnSecondary,
  btnSecondarySm,
  fieldClass,
} from "@/components/ui/button";
import { createEmployeeAction, toggleStaffActiveAction, updateStaffAction } from "./actions";

type StaffRow = {
  id: string;
  full_name: string;
  role: "owner" | "employee";
  phone: string | null;
  email: string | null;
  is_active: boolean;
};

export function StaffManager({ staff }: { staff: StaffRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createEmployeeAction({ fullName, email, password, phone });
        setFullName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Çalışan eklenemedi.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        {staff.map((s) => (
          <StaffCard key={s.id} member={s} />
        ))}
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className={`${btnPrimary} justify-self-start`}
        >
          Çalışan Ekle
        </button>
      )}

      {showForm && (
        <form
          onSubmit={onCreate}
          className="grid max-w-md gap-3 rounded-lg border border-accent bg-surface p-5"
        >
          <h2 className="text-base font-semibold">Yeni Çalışan</h2>

          <label className="grid gap-1 text-sm">
            Ad Soyad
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            E-posta
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Şifre
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Telefon (opsiyonel)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className={btnPrimary}>
              {isPending ? "Ekleniyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isPending}
              className={btnSecondary}
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Tek çalışan satırı; düzenleme aynı kartın içinde açılır.
 *
 * Sahip kaydı da düzenlenebilir (kurulumdan gelen demo ismi değiştirmenin
 * tek yolu bu), ama pasifleştirilemez — kendini kilitleyip panele
 * giremez hale gelmesin.
 */
function StaffCard({ member }: { member: StaffRow }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(member.full_name);
  const [email, setEmail] = useState(member.email ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateStaffAction({ staffId: member.id, fullName, email, phone });
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  function onCancel() {
    setFullName(member.full_name);
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setError(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={onSave}
        className="grid gap-3 rounded-lg border border-accent bg-surface p-4 text-sm"
      >
        <label className="grid gap-1">
          Ad Soyad
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1">
          E-posta
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <span className="text-xs text-fg-subtle">
            Bu adres hem bildirimler hem giriş için kullanılır; ikisi birlikte güncellenir.
          </span>
        </label>
        <label className="grid gap-1">
          Telefon (opsiyonel)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
        </label>

        {error && <p className="text-danger">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className={btnPrimarySm}>
            {isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={btnSecondarySm}
          >
            Vazgeç
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm ${
        member.is_active ? "" : "opacity-60"
      }`}
    >
      <div className="min-w-0">
        <span className="font-medium">{member.full_name}</span>
        <span className="ml-2 text-fg-muted">
          {member.role === "owner" ? "Sahip" : "Çalışan"}
          {member.phone ? ` · ${member.phone}` : ""}
          {member.is_active ? "" : " · Pasif"}
        </span>
        {member.email && <div className="text-xs text-fg-subtle">{member.email}</div>}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(true)} className={btnSecondarySm}>
          Düzenle
        </button>
        {member.role !== "owner" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => toggleStaffActiveAction(member.id, !member.is_active))
            }
            className={btnSecondarySm}
          >
            {member.is_active ? "Pasifleştir" : "Aktifleştir"}
          </button>
        )}
      </div>
    </div>
  );
}
