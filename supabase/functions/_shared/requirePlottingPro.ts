import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function userHasActivePlottingPro(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("user_plans")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;
  if (data.status !== "active" && data.status !== "trialing") return false;
  if (data.current_period_end && new Date(data.current_period_end) <= new Date()) return false;
  return true;
}

export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

export function plottingProRequiredResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Plotting Pro subscription required" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
