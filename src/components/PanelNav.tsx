"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { btnSecondarySm } from "@/components/ui/button";
import { signOutAction } from "@/app/giris/actions";

/**
 * Panel üst çubuğu.
 *
 * Sekmeler her ekran boyutunda hamburger menüde toplanıyor: sekiz sekme
 * yan yana dizildiğinde çubuk kalabalıklaşıyor ve berber çalışırken
 * sürekli göz gezdirmek zorunda kalıyordu. Şimdi çubukta yalnızca
 * bulunulan sayfanın adı duruyor, gezinme menüden yapılıyor.
 */
export function PanelNav({
  title,
  staffName,
  links,
}: {
  title: string;
  staffName: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Menü dışına tıklayınca ve Escape'e basınca kapansın.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Not: menü, bağlantıya tıklanınca onClick ile kapanıyor. Aynı işi
  // pathname'i izleyen bir effect ile yapmak zincirleme render tetikliyordu.

  const current = links.find((l) => l.href === pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div
        ref={containerRef}
        className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            aria-controls="panel-menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface text-fg transition-colors hover:border-accent hover:text-accent"
          >
            <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full bg-current transition-opacity ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full bg-current transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>

          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-sm font-bold uppercase tracking-[0.08em]">
              {title}
            </span>
            {current && (
              <>
                <span className="shrink-0 text-fg-subtle" aria-hidden="true">
                  ·
                </span>
                <span className="truncate text-sm text-fg-muted">{current.label}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="hidden text-fg-muted sm:inline">{staffName}</span>
          <form action={signOutAction}>
            <button type="submit" className={btnSecondarySm}>
              Çıkış Yap
            </button>
          </form>
        </div>

        {open && (
          <nav
            id="panel-menu"
            className="absolute left-4 top-full z-50 mt-1 w-60 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          >
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 border-l-2 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-accent bg-surface-hover font-medium text-accent"
                      : "border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
