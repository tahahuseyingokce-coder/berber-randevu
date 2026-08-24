import Image from "next/image";
import { sitePhotoUrl } from "@/lib/site-photos";

/** Müşteri henüz fotoğraf yüklemediği için görsel alanlarda kullanılan yer tutucu. */
export function PhotoPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-bg-elevated px-3 text-center ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-6 w-6 text-fg-subtle"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <circle cx="9" cy="11" r="2" />
        <path d="m3 17 5-4 4 3 4-5 5 6" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
    </div>
  );
}

/**
 * Panelden yüklenmiş fotoğrafı gösterir, yoksa yer tutucuya düşer.
 * Kapsayıcısının `position: relative` olması gerekir (fill kullanıyor).
 */
export function SitePhoto({
  storagePath,
  alt,
  placeholderLabel,
  sizes,
  priority = false,
}: {
  storagePath: string | null | undefined;
  alt?: string | null;
  placeholderLabel: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!storagePath) {
    return <PhotoPlaceholder label={placeholderLabel} />;
  }

  return (
    <Image
      src={sitePhotoUrl(storagePath)}
      alt={alt ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}
