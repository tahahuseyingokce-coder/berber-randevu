import { NextResponse } from "next/server";
import { format } from "date-fns";
import { authorizeCronRequest } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";

export const dynamic = "force-dynamic";

/** Yedeğe dahil edilen tablolar. */
const TABLES = [
  "shops",
  "shop_hours",
  "staff",
  "services",
  "customers",
  "customer_notes",
  "appointments",
  "audit_log",
] as const;

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yapılandırma hatası." },
      { status: 503 },
    );
  }

  const dump: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`[cron/yedekleme] "${table}" okunamadı:`, error.message);
      return NextResponse.json({ error: `${table}: ${error.message}` }, { status: 500 });
    }
    dump[table] = data ?? [];
    counts[table] = data?.length ?? 0;
  }

  const stamp = format(new Date(), "yyyy-MM-dd_HHmm");
  const payload = Buffer.from(
    JSON.stringify({ exported_at: new Date().toISOString(), data: dump }, null, 2),
    "utf8",
  );

  // Yedek dükkan sahibine e-posta ile gönderilir — böylece kopya
  // Supabase projesinin dışında da durur.
  const { data: owner } = await supabase
    .from("staff")
    .select("email, full_name, shop_id")
    .eq("role", "owner")
    .not("email", "is", null)
    .limit(1)
    .maybeSingle();

  if (!owner?.email) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Yedek oluşturuldu ancak gönderilemedi: e-postası tanımlı bir dükkan sahibi bulunamadı.",
        counts,
      },
      { status: 500 },
    );
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("name")
    .eq("id", owner.shop_id)
    .maybeSingle();

  const shopName = shop?.name ?? "Dükkan";
  const rows = Object.entries(counts)
    .map(([t, n]) => `<li>${t}: <strong>${n}</strong> kayıt</li>`)
    .join("");

  const result = await sendEmail({
    to: owner.email,
    subject: `Veritabanı yedeği — ${shopName} (${stamp})`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;color:#1c1015;">
      <p>Merhaba ${owner.full_name},</p>
      <p>${shopName} için otomatik veritabanı yedeği ektedir.</p>
      <ul>${rows}</ul>
      <p style="color:#6b675f;font-size:13px;">Bu dosya müşteri iletişim bilgileri içerir; güvenli bir yerde saklayın.</p>
    </div>`,
    attachments: [{ filename: `yedek_${stamp}.json`, content: payload }],
  });

  return NextResponse.json({
    ok: result.sent,
    emailed: result.sent,
    reason: result.reason,
    sizeBytes: payload.byteLength,
    counts,
  });
}
