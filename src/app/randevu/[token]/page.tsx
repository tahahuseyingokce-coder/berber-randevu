import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
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

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 sm:py-24">
      <CancelCard appointment={data} token={token} />
    </main>
  );
}
