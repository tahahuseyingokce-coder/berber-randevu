"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  addCustomerNoteAction,
  deleteCustomerNoteAction,
  getCustomerHistoryAction,
  getCustomerNotesAction,
  searchCustomersAction,
  updateCustomerNoteAction,
} from "@/lib/customer-actions";
import { StatusBadge } from "@/components/StatusBadge";
import {
  btnDangerSm,
  btnPrimary,
  btnPrimarySm,
  btnSecondarySm,
  fieldClass,
} from "@/components/ui/button";
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
  updated_at: string | null;
  author_staff_id: string | null;
  staff: { full_name: string } | null;
};

type HistoryItem = {
  id: string;
  starts_at: string;
  status: AppointmentStatus;
  services: { name: string } | null;
  staff: { full_name: string } | null;
};

export type ViewerStaff = {
  id: string;
  role: "owner" | "employee";
};

export function CustomerBrowser({
  initialCustomers,
  total,
  viewer,
}: {
  initialCustomers: Customer[];
  /** Dükkandaki toplam müşteri sayısı — listede yalnızca bir sayfası var. */
  total: number;
  viewer: ViewerStaff;
}) {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tab, setTab] = useState<"notes" | "history">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>(initialCustomers);
  const [matchCount, setMatchCount] = useState(total);
  const [searching, setSearching] = useState(false);

  // Arama veritabanında yapılıyor; her tuşta istek atmamak için
  // yazma durduktan sonra gönderiliyor.
  const requestId = useRef(0);
  useEffect(() => {
    const term = query.trim();
    const timer = setTimeout(async () => {
      const id = ++requestId.current;
      setSearching(true);
      try {
        const data = await searchCustomersAction(term);
        // Yavaş kalan eski bir yanıt yenisinin üstüne yazmasın.
        if (id !== requestId.current) return;
        setResults(data.customers);
        setMatchCount(data.total);
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function refreshNotes(customerId: string) {
    const data = await getCustomerNotesAction(customerId);
    setNotes(data as unknown as Note[]);
  }

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
        await refreshNotes(selected.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not eklenemedi.");
      }
    });
  }

  if (total === 0) {
    return <p className="text-sm text-fg-muted">Henüz müşteri yok.</p>;
  }

  const hiddenCount = matchCount - results.length;

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="grid content-start gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, telefon veya e-posta ara…"
          className={fieldClass}
        />

        {/* Satırlar kart değil hairline ile ayrılıyor: liste uzadıkça
            çerçeve yığını göz yoruyordu. */}
        <div className="divide-y divide-border rounded-lg border border-border">
          {results.length === 0 && (
            <p className="px-3 py-4 text-sm text-fg-muted">
              {searching ? "Aranıyor…" : "Eşleşen müşteri yok."}
            </p>
          )}

          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCustomer(c)}
              className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                selected?.id === c.id
                  ? "bg-surface-hover font-medium text-accent"
                  : "hover:bg-surface-hover"
              }`}
            >
              <span className="min-w-0 truncate">{c.full_name}</span>
              <span className="shrink-0 text-xs tabular-nums text-fg-subtle">{c.phone}</span>
            </button>
          ))}
        </div>

        <p className="px-1 text-xs text-fg-subtle">
          {hiddenCount > 0
            ? `${matchCount} kayıttan ${results.length} tanesi listeleniyor — aramayı daraltın.`
            : `${matchCount} kayıt`}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        {!selected && (
          <p className="text-sm text-fg-muted">
            Notları ve randevu geçmişini görmek için bir müşteri seçin.
          </p>
        )}

        {selected && (
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg">{selected.full_name}</h3>
              <p className="text-sm text-fg-muted">
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
                  className={`-mb-px border-b-2 pb-2 font-medium transition-colors ${
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
                    className={`${fieldClass} resize-none`}
                  />
                  {error && <p className="text-xs text-danger">{error}</p>}
                  <button
                    type="submit"
                    disabled={isPending || !newNote.trim()}
                    className={`${btnPrimary} justify-self-start`}
                  >
                    Ekle
                  </button>
                </form>

                <div className="grid gap-3">
                  {loadingNotes && <p className="text-sm text-fg-muted">Yükleniyor…</p>}
                  {!loadingNotes && notes.length === 0 && (
                    <p className="text-sm text-fg-muted">Henüz not yok.</p>
                  )}
                  {notes.map((n) => (
                    <NoteRow
                      key={n.id}
                      note={n}
                      viewer={viewer}
                      onChanged={() => refreshNotes(selected.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {tab === "history" && (
              <div className="grid gap-2">
                {loadingNotes && <p className="text-sm text-fg-muted">Yükleniyor…</p>}
                {!loadingNotes && history.length === 0 && (
                  <p className="text-sm text-fg-muted">Henüz randevu geçmişi yok.</p>
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
                      <span className="ml-2 text-fg-muted">
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

/**
 * Tek not satırı: okuma, düzenleme ve silme onayı aynı yerde.
 *
 * Yetki kontrolü sunucuda RLS ile yapılır; buradaki kontrol yalnızca
 * kullanamayacağı düğmeyi kullanıcıya göstermemek için.
 */
function NoteRow({
  note,
  viewer,
  onChanged,
}: {
  note: Note;
  viewer: ViewerStaff;
  onChanged: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.note);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage = viewer.role === "owner" || note.author_staff_id === viewer.id;

  function onSave() {
    const next = draft.trim();
    if (!next) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateCustomerNoteAction({ noteId: note.id, note: next });
        setEditing(false);
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not düzenlenemedi.");
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCustomerNoteAction(note.id);
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not silinemedi.");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <div className="border-t border-border pt-3 text-sm">
      {editing ? (
        <div className="grid gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className={`${fieldClass} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={isPending || !draft.trim()}
              className={btnPrimarySm}
            >
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(note.note);
                setEditing(false);
                setError(null);
              }}
              disabled={isPending}
              className={btnSecondarySm}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{note.note}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-fg-subtle">
          {note.staff?.full_name} ·{" "}
          {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
          {note.updated_at && (
            <span className="ml-1 italic">
              (düzenlendi {format(new Date(note.updated_at), "d MMM, HH:mm", { locale: tr })})
            </span>
          )}
        </p>

        {canManage && !editing && (
          <div className="flex gap-2">
            {confirmingDelete ? (
              <>
                <span className="self-center text-xs text-fg-muted">Silinsin mi?</span>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  className={btnDangerSm}
                >
                  {isPending ? "Siliniyor…" : "Evet, sil"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                  className={btnSecondarySm}
                >
                  Vazgeç
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={btnSecondarySm}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className={btnDangerSm}
                >
                  Sil
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
