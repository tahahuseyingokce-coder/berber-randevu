"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/giris/actions";

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

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-medium">{title}</span>
          <nav className="hidden md:flex items-center gap-4 text-sm text-fg-muted">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={active ? "text-fg" : "hover:text-fg transition-colors"}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-fg-muted hidden sm:inline">{staffName}</span>
          <form action={signOutAction}>
            <button type="submit" className="text-fg-muted hover:text-fg transition-colors">
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>
      <nav className="md:hidden flex gap-4 overflow-x-auto px-4 pb-3 text-sm text-fg-muted">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={active ? "text-fg shrink-0" : "shrink-0"}>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
