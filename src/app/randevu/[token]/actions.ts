"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";

const cancelSchema = z.object({
  appointmentId: z.string().uuid(),
  token: z.string().uuid(),
});

export async function cancelAppointmentAction(input: z.infer<typeof cancelSchema>) {
  const { appointmentId, token } = cancelSchema.parse(input);
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
    p_cancel_token: token,
    p_by_customer: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { appointment: data };
}
