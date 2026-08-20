"use client";

import { useState, useTransition } from "react";
import { createEmployeeAction, toggleStaffActiveAction } from "./actions";

type StaffRow = {
  id: string;
  full_name: string;
  role: "owner" | "employee";
  phone: string | null;
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
          <div
            key={s.id}
            className={`flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm ${
              !s.is_active ? "opacity-50" : ""
            }`}
          >
            <div>
              <span className="font-medium">{s.full_name}</span>
              <span className="text-fg-muted ml-2">
                {s.role === "owner" ? "Sahip" : "Çalışan"}
                {s.phone ? ` · ${s.phone}` : ""}
              </span>
            </div>
            {s.role !== "owner" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => toggleStaffActiveAction(s.id, !s.is_active))}
                className="text-xs text-fg-muted hover:text-fg disabled:opacity-40"
              >
                {s.is_active ? "Pasifleştir" : "Aktifleştir"}
              </button>
            )}
          </div>
        ))}
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="justify-self-start rounded-lg bg-accent text-accent-fg px-4 py-2 text-sm font-medium"
        >
          Çalışan Ekle
        </button>
      )}

      {showForm && (
        <form onSubmit={onCreate} className="grid gap-3 max-w-md rounded-lg border border-accent bg-surface p-5">
          <label className="grid gap-1 text-sm">
            Ad Soyad
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-1 text-sm">
            E-posta
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
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
              className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Telefon (opsiyonel)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-border bg-bg-elevated px-3 py-2 outline-none focus:border-accent"
            />
          </label>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent text-accent-fg px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {isPending ? "Ekleniyor…" : "Kaydet"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-fg-muted text-sm">
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
