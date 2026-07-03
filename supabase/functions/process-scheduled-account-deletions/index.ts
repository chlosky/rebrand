import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DELETION_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DELETION_DAYS);
    const cutoffIso = cutoff.toISOString();

    const { data: rows, error: selectErr } = await supabase
      .from("account_deletion_requests")
      .select("user_id")
      .lt("requested_at", cutoffIso);

    if (selectErr) {
      console.error("[process-scheduled-account-deletions] Select error:", selectErr);
      return new Response(JSON.stringify({ error: selectErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rows?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = rows.map((r) => r.user_id);
    for (const uid of userIds) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
      if (delErr) console.error("[process-scheduled-account-deletions] Delete user error:", uid, delErr);
    }

    const { error: deleteReqErr } = await supabase
      .from("account_deletion_requests")
      .delete()
      .in("user_id", userIds);

    if (deleteReqErr) {
      console.error("[process-scheduled-account-deletions] Delete requests error:", deleteReqErr);
    }

    return new Response(
      JSON.stringify({ success: true, processed: userIds.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[process-scheduled-account-deletions] Unexpected error:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
