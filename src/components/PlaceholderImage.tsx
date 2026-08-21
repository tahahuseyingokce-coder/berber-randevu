/**
 * Müşteri fotoğrafları gelene kadar kullanılan yer tutucu.
 * Gerçek görsel geldiğinde bu bileşen <Image /> ile değiştirilir —
 * ölçüler ve köşe yuvarlaklığı aynı kalsın diye aspect oranı dışarıdan verilir.
 */
export function PlaceholderImage({
  label,
  initial,
  aspect = "aspect-[4/5]",
  className = "",
}: {
  label?: string;
  initial?: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={`photo-placeholder relative overflow-hidden ${aspect} ${className}`}
      role="img"
      aria-label={label ? `${label} — görsel yer tutucusu` : "Görsel yer tutucusu"}
    >
      {initial && (
        <span className="absolute inset-0 flex items-center justify-center font-display text-6xl sm:text-7xl font-bold text-fg/[0.07] select-none">
          {initial}
        </span>
      )}

      {/* Alt köşede ince bir kırmızı vurgu — kartlara yön veriyor */}
      <span className="absolute bottom-0 left-0 h-0.5 w-12 bg-accent" />
    </div>
  );
}
