import { supabase } from "@/integrations/supabase/client";
import { invalidatePlottingProCache } from "@/hooks/usePlottingPro";

export type EndStripeTrialResult =
  | { ok: true; alreadyActive?: boolean }
  | { ok: false; error: string };

/** Ends the Stripe free trial immediately so paid features (downloads, calendar export) unlock. */
export async function endStripeTrialEarly(userId: string): Promise<EndStripeTrialResult> {
  const { data, error } = await supabase.functions.invoke("end-stripe-trial", { body: {} });

  if (error) {
    console.warn("[endStripeTrialEarly]", error.message);
    return { ok: false, error: "Could not start your subscription. Try again or use Manage billing." };
  }

  const payload = data as { ok?: boolean; alreadyActive?: boolean; error?: string } | null;
  if (payload?.error) {
    return { ok: false, error: payload.error };
  }

  invalidatePlottingProCache(userId);
  return { ok: true, alreadyActive: payload?.alreadyActive === true };
}
