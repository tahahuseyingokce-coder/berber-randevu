import { Resend } from "resend";

/**
 * E-posta gönderimi "best effort" bir yan etkidir: RESEND_API_KEY yoksa veya
 * gönderim başarısız olursa randevu akışı BOZULMAZ — hata loglanır ve devam edilir.
 * Randevu zaten veritabanına yazılmıştır; e-posta gidememesi randevuyu geçersiz kılmaz.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
};

function getFromAddress() {
  // Resend'in doğrulanmamış domainler için verdiği test adresi varsayılan.
  // Gerçek deploy'da RESEND_FROM_EMAIL kendi domaininizle ayarlanmalı.
  return process.env.RESEND_FROM_EMAIL ?? "Randevu <onboarding@resend.dev>";
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY tanımlı değil — e-posta gönderilmedi (alıcı: ${input.to}, konu: "${input.subject}")`,
    );
    return { sent: false, reason: "missing_api_key" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.attachments ? { attachments: input.attachments } : {}),
    });

    if (error) {
      console.error(`[email] Gönderim hatası (${input.to}):`, error.message);
      return { sent: false, reason: error.message };
    }

    return { sent: true };
  } catch (err) {
    console.error(`[email] Beklenmeyen hata (${input.to}):`, err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Birden fazla e-postayı paralel gönderir ve hiçbir zaman throw etmez.
 * Çağıran taraf sonucu beklemek zorunda değildir.
 */
export async function sendEmailsSafely(emails: SendEmailInput[]) {
  const results = await Promise.allSettled(emails.map((e) => sendEmail(e)));
  return results;
}
