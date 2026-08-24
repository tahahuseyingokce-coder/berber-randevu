"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import type { Shop, ShopValue, SitePhoto, Staff } from "@/lib/types";
import { sitePhotoUrl } from "@/lib/site-photos";
import {
  btnDangerSm,
  btnPrimary,
  btnPrimarySm,
  btnSecondarySm,
  fieldClass,
} from "@/components/ui/button";
import {
  createShopValueAction,
  deleteShopValueAction,
  deleteSitePhotoAction,
  deleteStaffPhotoAction,
  moveSitePhotoAction,
  updateAboutTextAction,
  updateShopValueAction,
  updateStaffProfileAction,
  uploadSitePhotoAction,
  uploadStaffPhotoAction,
} from "./actions";

export function ContentManager({
  shop,
  values,
  staff,
  galleryPhotos,
  aboutPhoto,
}: {
  shop: Shop;
  values: ShopValue[];
  staff: Staff[];
  galleryPhotos: SitePhoto[];
  aboutPhoto: SitePhoto | null;
}) {
  return (
    <div className="grid gap-12">
      <AboutTextForm shop={shop} />
      <AboutPhotoSection photo={aboutPhoto} />
      <ValuesSection values={values} />
      <StaffPhotosSection staff={staff} />
      <GallerySection photos={galleryPhotos} />
    </div>
  );
}

// ------------------------------------------------------------
// Hakkımızda metni
// ------------------------------------------------------------
function AboutTextForm({ shop }: { shop: Shop }) {
  const [title, setTitle] = useState(shop.about_title ?? "");
  const [body, setBody] = useState(shop.about_body ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAboutTextAction({ aboutTitle: title, aboutBody: body });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
      <div>
        <h2 className="text-xl font-semibold">Hakkımızda Metni</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Boş bırakırsanız sayfada dükkan adından türetilen varsayılan metin gösterilir.
        </p>
      </div>

      <label className="grid gap-1 text-sm">
        Başlık
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kesim bir zanaattır."
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Giriş Paragrafı
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Salonunuzu birkaç cümleyle anlatın."
          className={`${fieldClass} resize-none`}
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Kaydedildi.</p>}

      <button type="submit" disabled={isPending} className={`${btnPrimary} justify-self-start`}>
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

// ------------------------------------------------------------
// Fotoğraf yükleme kutusu — hem Hakkımızda hem Galeri kullanıyor
// ------------------------------------------------------------
function PhotoUploader({
  placement,
  label,
}: {
  placement: "gallery" | "about";
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await uploadSitePhotoAction(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yüklenemedi.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="placement" value={placement} />

      <label className="grid gap-1 text-sm">
        {label}
        <input
          required
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className={`${fieldClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-accent-fg`}
        />
      </label>

      <label className="grid gap-1 text-sm">
        Alternatif Metin (opsiyonel)
        <input
          name="alt"
          placeholder="Fotoğrafta ne var? Ekran okuyucular için."
          className={fieldClass}
        />
      </label>

      <button type="submit" disabled={isPending} className={btnPrimary}>
        {isPending ? "Yükleniyor…" : "Yükle"}
      </button>

      {error && <p className="text-sm text-danger sm:col-span-3">{error}</p>}
    </form>
  );
}

// ------------------------------------------------------------
// Hakkımızda fotoğrafı — tek fotoğraf, yenisi eskisinin yerine geçer
// ------------------------------------------------------------
function AboutPhotoSection({ photo }: { photo: SitePhoto | null }) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Hakkımızda Fotoğrafı</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Hakkımızda sayfasının üstünde görünen tek salon fotoğrafı. Yeni yüklediğinizde
          eskisinin yerine geçer.
        </p>
      </div>

      {photo ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image
              src={sitePhotoUrl(photo.storage_path)}
              alt={photo.alt ?? "Salon fotoğrafı"}
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteSitePhotoAction(photo.id))}
            className={btnDangerSm}
          >
            Kaldır
          </button>
        </div>
      ) : (
        <p className="text-sm text-fg-subtle">
          Henüz fotoğraf yok — sayfada yer tutucu görünüyor.
        </p>
      )}

      <PhotoUploader placement="about" label="Salon Fotoğrafı" />
    </section>
  );
}

// ------------------------------------------------------------
// Değer kartları
// ------------------------------------------------------------
function ValuesSection({ values }: { values: ShopValue[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createShopValueAction({ title: newTitle, body: newBody });
        setNewTitle("");
        setNewBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eklenemedi.");
      }
    });
  }

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Değer Kartları</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Hakkımızda sayfasında fotoğrafın yanında listelenen maddeler.
        </p>
      </div>

      <div className="grid max-w-2xl gap-2">
        {values.length === 0 && (
          <p className="text-sm text-fg-subtle">Henüz madde eklenmemiş.</p>
        )}

        {values.map((v) =>
          editingId === v.id ? (
            <ValueEditRow
              key={v.id}
              value={v}
              onDone={() => setEditingId(null)}
              onError={setError}
            />
          ) : (
            <div
              key={v.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{v.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{v.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(v.id)}
                  className={btnSecondarySm}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteShopValueAction(v.id))}
                  className={btnDangerSm}
                >
                  Sil
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      <form onSubmit={onCreate} className="grid max-w-2xl gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Başlık
          <input
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Açıklama
          <input
            required
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={isPending} className={btnPrimary}>
          Ekle
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}

function ValueEditRow({
  value,
  onDone,
  onError,
}: {
  value: ShopValue;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const [title, setTitle] = useState(value.title);
  const [body, setBody] = useState(value.body);
  const [isPending, startTransition] = useTransition();

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    startTransition(async () => {
      try {
        await updateShopValueAction({ id: value.id, title, body });
        onDone();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Güncellenemedi.");
      }
    });
  }

  return (
    <form
      onSubmit={onSave}
      className="grid gap-2 rounded-lg border border-accent bg-surface px-4 py-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end"
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      <input value={body} onChange={(e) => setBody(e.target.value)} className={fieldClass} />
      <button type="submit" disabled={isPending} className={btnPrimarySm}>
        Kaydet
      </button>
      <button type="button" onClick={onDone} className={btnSecondarySm}>
        Vazgeç
      </button>
    </form>
  );
}

// ------------------------------------------------------------
// Ekip portreleri — Hakkımızda sayfasındaki ekip kartlarında görünür
// ------------------------------------------------------------
function StaffPhotosSection({ staff }: { staff: Staff[] }) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Ekip Kartları</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Hakkımızda sayfasındaki ekip kartlarında görünen fotoğraf, unvan ve tanıtım.
          Çalışan eklemek için <span className="font-medium">Çalışanlar</span> sayfasını
          kullanın.
        </p>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-fg-subtle">Aktif çalışan yok.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {staff.map((s) => (
            <StaffPhotoCard key={s.id} member={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

function StaffPhotoCard({ member }: { member: Staff }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(member.title ?? "");
  const [bio, setBio] = useState(member.bio ?? "");
  const [savedProfile, setSavedProfile] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await uploadStaffPhotoAction(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yüklenemedi.");
      }
    });
  }

  function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedProfile(false);
    startTransition(async () => {
      try {
        await updateStaffProfileAction({ staffId: member.id, title, bio });
        setSavedProfile(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      }
    });
  }

  // Düzenleme alanları katlanır: dört çalışanla bile açık dört form
  // sayfayı gereksiz uzatıyordu.
  const [open, setOpen] = useState(false);

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-bg-elevated">
          {member.photo_path ? (
            <Image
              src={sitePhotoUrl(member.photo_path)}
              alt={member.full_name}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] text-fg-subtle">
              —
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{member.full_name}</p>
          <p className="truncate text-xs text-fg-subtle">
            {member.title || "Unvan girilmemiş"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={btnSecondarySm}
          aria-expanded={open}
        >
          {open ? "Kapat" : "Düzenle"}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 border-t border-border pt-3">
          <form onSubmit={onSaveProfile} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <label className="grid gap-1 text-xs">
              Unvan
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurucu · Berber"
                className={`${fieldClass} text-sm`}
              />
            </label>
            <label className="grid gap-1 text-xs">
              Kısa Tanıtım
              <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bir cümleyle ne yaptığını anlatın."
                className={`${fieldClass} text-sm`}
              />
            </label>
            <button type="submit" disabled={isPending} className={btnPrimarySm}>
              Kaydet
            </button>
          </form>

          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <input type="hidden" name="staffId" value={member.id} />
            <input
              required
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className={`${fieldClass} text-xs file:mr-2 file:rounded file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-semibold file:text-accent-fg`}
            />
            <button type="submit" disabled={isPending} className={btnSecondarySm}>
              {isPending ? "Yükleniyor…" : member.photo_path ? "Fotoğrafı Değiştir" : "Yükle"}
            </button>
            {member.photo_path && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => deleteStaffPhotoAction(member.id))}
                className={btnDangerSm}
              >
                Kaldır
              </button>
            )}
          </form>

          {savedProfile && <p className="text-xs text-success">Kaydedildi.</p>}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}
    </li>
  );
}

// ------------------------------------------------------------
// Galeri
// ------------------------------------------------------------
function GallerySection({ photos }: { photos: SitePhoto[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Galeri Fotoğrafları</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Galeri sayfasındaki ızgara. Anasayfada bu listenin ilk dördü gösterilir — sıra
          önemli.
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-fg-subtle">
          Henüz fotoğraf yok — galeri sayfasında yer tutucular görünüyor.
        </p>
      ) : (
        /* Büyük önizleme kartları liste uzadıkça ekranı dolduruyordu.
           Küçük küçük resim + tek satır: sıra ve içerik yine görünür,
           yirmi fotoğraf da ekrana sığar. */
        <ul className="divide-y divide-border rounded-lg border border-border">
          {photos.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-5 shrink-0 text-xs tabular-nums text-fg-subtle">{i + 1}</span>

              <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded border border-border">
                <Image
                  src={sitePhotoUrl(p.storage_path)}
                  alt={p.alt ?? ""}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{p.alt || "Açıklama yok"}</p>
                {i < 4 && <p className="text-[11px] text-fg-subtle">Anasayfada görünüyor</p>}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={isPending || i === 0}
                  onClick={() => startTransition(() => moveSitePhotoAction(p.id, "up"))}
                  className={btnSecondarySm}
                  aria-label="Yukarı taşı"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={isPending || i === photos.length - 1}
                  onClick={() => startTransition(() => moveSitePhotoAction(p.id, "down"))}
                  className={btnSecondarySm}
                  aria-label="Aşağı taşı"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteSitePhotoAction(p.id))}
                  className={btnDangerSm}
                  aria-label="Sil"
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PhotoUploader placement="gallery" label="Yeni Galeri Fotoğrafı" />
    </section>
  );
}
