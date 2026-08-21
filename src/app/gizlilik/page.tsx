import type { Metadata } from "next";
import { getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Kişisel verilerinizin nasıl kullanıldığı hakkında bilgi.",
};

export default async function GizlilikPage() {
  const shop = await getShop();
  const hours = await getShopHours(shop.id);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <h1 className="text-4xl sm:text-5xl">Gizlilik Politikası</h1>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-2xl space-y-8 px-4 py-16 sm:px-6 sm:py-20">
            <div>
              <h2 className="text-xl">Hangi bilgileri saklıyoruz?</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Randevu alırken paylaştığınız ad, telefon ve e-posta adresi. Bunun dışında
                herhangi bir kişisel veri toplamıyoruz.
              </p>
            </div>

            <div>
              <h2 className="text-xl">Ne için kullanıyoruz?</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Yalnızca randevunuzu oluşturmak, onaylamak ve size hatırlatma göndermek için.
                Pazarlama amacıyla kullanmıyoruz.
              </p>
            </div>

            <div>
              <h2 className="text-xl">Üçüncü taraflarla paylaşıyor muyuz?</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                Hayır. Bilgileriniz yalnızca {shop.name} çalışanları tarafından, randevunuzla
                ilgili işlemler için görülür.
              </p>
            </div>

            <div>
              <h2 className="text-xl">Sorularınız için</h2>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {shop.phone
                  ? `Bize ${shop.phone} numarasından ulaşabilirsiniz.`
                  : "Bize dükkandan ulaşabilirsiniz."}
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter shop={shop} hours={hours} />
    </>
  );
}
