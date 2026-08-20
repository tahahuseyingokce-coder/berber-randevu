import { getShop } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function GizlilikPage() {
  const shop = await getShop();

  return (
    <>
      <SiteHeader shopName={shop.name} />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-16 sm:py-24 w-full">
        <h1 className="text-4xl sm:text-5xl mb-8">Gizlilik Politikası</h1>
        <div className="grid gap-4 text-fg-muted text-sm leading-relaxed">
          <p>
            Randevu alırken bizimle paylaştığınız ad, telefon ve e-posta bilgileri yalnızca
            randevunuzu oluşturmak, onaylamak ve size hatırlatma göndermek amacıyla kullanılır.
          </p>
          <p>
            Bilgileriniz üçüncü taraflarla paylaşılmaz. Sorularınız için {shop.phone ?? "bize"}{" "}
            üzerinden ulaşabilirsiniz.
          </p>
        </div>
      </main>
      <SiteFooter shop={shop} />
    </>
  );
}
