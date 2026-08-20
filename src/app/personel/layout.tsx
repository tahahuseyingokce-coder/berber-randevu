import { requireStaff } from "@/lib/auth";
import { PanelNav } from "@/components/PanelNav";

const links = [
  { href: "/personel", label: "Dashboard" },
  { href: "/personel/takvim", label: "Takvim" },
  { href: "/personel/randevular", label: "Randevular" },
  { href: "/personel/musteriler", label: "Müşteriler" },
];

export default async function PersonelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff(["owner", "employee"]);

  return (
    <div className="flex-1 flex flex-col">
      <PanelNav title="Personel Paneli" staffName={staff.full_name} links={links} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
