/**
 * Help-reply push backup endpoint (admin inbox invokes after admin reply).
 * Primary path: process-help-reply-push-queue cron worker (no app build required).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { sendHelpReplyPush } from "../_shared/helpReplyPushCore.ts";
import {
  isHelpReplyMessageProcessed,
  loadHelpReplyDedup,
  markHelpReplyMessageProcessed,
} from "../_shared/helpReplyPushDedup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    const supabase = createClient(supabaseUrl, serviceKey);

    if (!isCron) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userErr,
      } = await userClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: adminRow, error: adminErr } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (adminErr || !adminRow?.user_id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const caseId = typeof body.case_id === "string" ? body.case_id.trim() : "";
    const messageId = typeof body.message_id === "string" ? body.message_id.trim() : "";
    if (!caseId) {
      return new Response(JSON.stringify({ error: "case_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dedup = messageId ? await loadHelpReplyDedup(supabase) : null;
    if (messageId && dedup && isHelpReplyMessageProcessed(dedup, messageId)) {
      return new Response(
        JSON.stringify({ success: true, sent: false, skipped: true, reason: "already_processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await sendHelpReplyPush(supabase, { caseId, messageId });

    if (messageId && result.ok) {
      await markHelpReplyMessageProcessed(supabase, messageId, dedup?.enabled_at);
    }

    if (!result.ok) {
      const status = result.error === "onesignal_not_configured" ? 503 : 502;
      return new Response(
        JSON.stringify({ success: false, sent: false, error: result.error, detail: result.detail }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!result.sent) {
      return new Response(
        JSON.stringify({ success: true, sent: false, skipped: true, reason: result.reason }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: true,
        case_id: result.case_id,
        user_id: result.user_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-help-request-reply-push]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
