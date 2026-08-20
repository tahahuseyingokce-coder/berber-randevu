import { requireStaff } from "@/lib/auth";
import { PanelNav } from "@/components/PanelNav";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/takvim", label: "Takvim" },
  { href: "/admin/randevular", label: "Randevular" },
  { href: "/admin/musteriler", label: "Müşteriler" },
  { href: "/admin/calisanlar", label: "Çalışanlar" },
  { href: "/admin/hizmetler", label: "Hizmetler" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff(["owner"]);

  return (
    <div className="flex-1 flex flex-col">
      <PanelNav title="Admin Paneli" staffName={staff.full_name} links={links} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
