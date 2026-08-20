import Link from "next/link";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader({ shopName }: { shopName: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-medium tracking-tight">
          {shopName}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-fg-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-fg transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/randevu-al"
          className="rounded-full bg-accent text-accent-fg px-4 py-2 text-sm font-medium"
        >
          Randevu Al
        </Link>
      </div>
    </header>
  );
}
