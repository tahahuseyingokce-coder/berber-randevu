"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  addCustomerNoteAction,
  getCustomerHistoryAction,
  getCustomerNotesAction,
} from "@/lib/customer-actions";
import { StatusBadge } from "@/components/StatusBadge";
import type { AppointmentStatus } from "@/lib/types";

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
};

type Note = {
  id: string;
  note: string;
  created_at: string;
  staff: { full_name: string } | null;
};

type HistoryItem = {
  id: string;
  starts_at: string;
  status: AppointmentStatus;
  services: { name: string } | null;
  staff: { full_name: string } | null;
};

export function CustomerBrowser({ customers }: { customers: Customer[] }) {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tab, setTab] = useState<"notes" | "history">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const filtered = customers.filter((c) => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return true;
    return (
      c.full_name.toLocaleLowerCase("tr").includes(q) ||
      c.phone.includes(q) ||
      c.email.toLocaleLowerCase("tr").includes(q)
    );
  });

  async function selectCustomer(customer: Customer) {
    setSelected(customer);
    setTab("notes");
    setError(null);
    setLoadingNotes(true);
    try {
      const [noteData, historyData] = await Promise.all([
        getCustomerNotesAction(customer.id),
        getCustomerHistoryAction(customer.id),
      ]);
      setNotes(noteData as unknown as Note[]);
      setHistory(historyData as unknown as HistoryItem[]);
    } finally {
      setLoadingNotes(false);
    }
  }

  function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newNote.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await addCustomerNoteAction({ customerId: selected.id, note: newNote.trim() });
        setNewNote("");
        const data = await getCustomerNotesAction(selected.id);
        setNotes(data as unknown as Note[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not eklenemedi.");
      }
    });
  }

  if (customers.length === 0) {
    return <p className="text-fg-muted text-sm">Henüz müşteri yok.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="grid gap-2 content-start">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, telefon veya e-posta ara…"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {filtered.length === 0 && (
          <p className="text-fg-muted text-sm py-2">Aramanızla eşleşen müşteri yok.</p>
        )}

        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCustomer(c)}
            className={`text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
              selected?.id === c.id ? "border-accent" : "border-border hover:border-border-strong"
            }`}
          >
            <div>{c.full_name}</div>
            <div className="text-fg-muted text-xs">{c.phone}</div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        {!selected && (
          <p className="text-fg-muted text-sm">
            Notları ve randevu geçmişini görmek için bir müşteri seçin.
          </p>
        )}

        {selected && (
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg">{selected.full_name}</h3>
              <p className="text-fg-muted text-sm">
                {selected.phone} · {selected.email}
              </p>
            </div>

            <div className="flex gap-4 border-b border-border text-sm">
              {(
                [
                  ["notes", `Notlar${notes.length ? ` (${notes.length})` : ""}`],
                  ["history", `Randevu Geçmişi${history.length ? ` (${history.length})` : ""}`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 pb-2 transition-colors ${
                    tab === key
                      ? "border-accent text-accent"
                      : "border-transparent text-fg-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "notes" && (
              <>
                <form onSubmit={onAddNote} className="grid gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Not ekle…"
                    rows={2}
                    className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  />
                  {error && <p className="text-danger text-xs">{error}</p>}
                  <button
                    type="submit"
                    disabled={isPending || !newNote.trim()}
                    className="justify-self-start rounded-lg bg-accent text-accent-fg px-4 py-1.5 text-xs font-medium disabled:opacity-40"
                  >
                    Ekle
                  </button>
                </form>

                <div className="grid gap-3">
                  {loadingNotes && <p className="text-fg-muted text-sm">Yükleniyor…</p>}
                  {!loadingNotes && notes.length === 0 && (
                    <p className="text-fg-muted text-sm">Henüz not yok.</p>
                  )}
                  {notes.map((n) => (
                    <div key={n.id} className="border-t border-border pt-3 text-sm">
                      <p className="whitespace-pre-wrap">{n.note}</p>
                      <p className="text-fg-subtle text-xs mt-1">
                        {n.staff?.full_name} ·{" "}
                        {format(new Date(n.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "history" && (
              <div className="grid gap-2">
                {loadingNotes && <p className="text-fg-muted text-sm">Yükleniyor…</p>}
                {!loadingNotes && history.length === 0 && (
                  <p className="text-fg-muted text-sm">Henüz randevu geçmişi yok.</p>
                )}
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="tabular-nums">
                        {format(new Date(h.starts_at), "d MMM yyyy, HH:mm", { locale: tr })}
                      </span>
                      <span className="text-fg-muted ml-2">
                        {h.services?.name}
                        {h.staff?.full_name ? ` · ${h.staff.full_name}` : ""}
                      </span>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
