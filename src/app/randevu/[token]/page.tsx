import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { isCancelCutoffPassed } from "@/lib/booking";
import { getShop, getShopHours } from "@/lib/shop";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CancelCard, type AppointmentInfo } from "./CancelCard";

export default async function RandevuIptalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .rpc("get_appointment_by_token", { p_token: token })
    .maybeSingle<AppointmentInfo>();

  if (error || !data) {
    notFound();
  }

  const shop = await getShop();
  const hours = await getShopHours(shop.id);

  const cutoffPassed = isCancelCutoffPassed(data.starts_at, data.shop_cutoff_hours);

  return (
    <>
      <SiteHeader shopName={shop.name} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-20">
          <CancelCard appointment={data} token={token} cutoffPassed={cutoffPassed} />
        </div>
      </main>

      <SiteFooter shop={shop} hours={hours} />
    </>
  );
}
