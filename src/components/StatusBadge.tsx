import type { AppointmentStatus } from "@/lib/types";

const LABELS: Record<AppointmentStatus, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal Edildi",
  completed: "Tamamlandı",
};

const STYLES: Record<AppointmentStatus, string> = {
  pending: "text-accent border-accent/40",
  confirmed: "text-success border-success/40",
  cancelled: "text-danger border-danger/40",
  completed: "text-fg-muted border-border",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
