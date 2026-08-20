import Link from "next/link";
import type { Shop } from "@/lib/types";

export function SiteFooter({ shop }: { shop: Shop }) {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-fg-muted">
        <div>
          <p className="text-fg">{shop.name}</p>
          {shop.address && <p>{shop.address}</p>}
          {shop.phone && <p>{shop.phone}</p>}
        </div>
        <nav className="flex gap-4">
          <Link href="/gizlilik" className="hover:text-fg transition-colors">
            Gizlilik Politikası
          </Link>
        </nav>
      </div>
    </footer>
  );
}
