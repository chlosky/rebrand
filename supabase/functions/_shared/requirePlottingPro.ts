import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function userHasActivePlottingPro(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await admin.rpc("has_active_plotting_subscription", {
    check_user_id: userId,
  });
  return !error && Boolean(data);
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
