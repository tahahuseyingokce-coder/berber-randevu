"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/galeri", label: "Galeri" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader({ shopName }: { shopName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Not: menü, bağlantıya tıklandığında onClick ile kapanıyor. Aynı işi
  // pathname'i izleyen bir effect ile yapmak zincirleme render tetikliyordu.

  // Menü açıkken arka plan kaymasın.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:py-4">
        <Link href="/" className="flex items-baseline gap-2 truncate">
          <span className="font-display text-base sm:text-lg font-black uppercase tracking-[-0.01em]">
            {shopName}
          </span>
          <span className="h-2 w-2 shrink-0 bg-accent" aria-hidden="true" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b-2 px-3 py-2 text-[12.5px] font-bold uppercase tracking-wider transition-colors ${
                pathname === l.href
                  ? "border-accent text-accent"
                  : "border-transparent text-fg hover:text-accent"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/randevu-al"
            className="hidden sm:inline-flex items-center bg-accent px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Randevu Al
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            className="md:hidden flex h-11 w-11 items-center justify-center text-fg"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 bg-current transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobil menü */}
      {open && (
        <div className="md:hidden border-t-2 border-border bg-bg">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-3.5 text-sm font-bold uppercase tracking-wider border-b border-border last:border-0 ${
                  pathname === l.href ? "text-accent" : "text-fg"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/randevu-al"
              onClick={() => setOpen(false)}
              className="my-4 inline-flex items-center justify-center bg-accent px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-accent-fg"
            >
              Randevu Al
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
