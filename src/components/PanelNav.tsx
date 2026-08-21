"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { btnSecondarySm } from "@/components/ui/button";
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

  /** Aktif sekme yalnızca renkle değil, altındaki çizgiyle de ayrışsın. */
  function linkClass(href: string) {
    const active = pathname === href;
    return `rounded-md px-2.5 py-1.5 font-medium transition-colors ${
      active ? "bg-accent text-accent-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"
    }`;
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg uppercase tracking-wide">{title}</span>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-fg-muted sm:inline">{staffName}</span>
          <form action={signOutAction}>
            <button type="submit" className={btnSecondarySm}>
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 text-sm md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`shrink-0 ${linkClass(l.href)}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
