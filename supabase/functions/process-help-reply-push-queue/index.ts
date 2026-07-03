/**
 * Server-only help-reply push worker (Supabase cron + CRON_SECRET).
 * Polls support inbox_messages and sends pushes — no shipped app build required.
 * Dedup state stored in feature_flags.help_reply_push_state (service role).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { sendHelpReplyPush } from "../_shared/helpReplyPushCore.ts";
import {
  ensureHelpReplyWorkerEnabledAt,
  isHelpReplyMessageProcessed,
  loadHelpReplyDedup,
  markHelpReplyMessageProcessed,
} from "../_shared/helpReplyPushDedup.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 25;

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

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
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: "Cron not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isEnabledFlag(Deno.env.get("HELP_REPLY_PUSH_WORKER_ENABLED"))) {
      return new Response(
        JSON.stringify({ success: true, enabled: false, sent: 0, skipped: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let dedup = await loadHelpReplyDedup(supabase);
    const enabledAt = dedup.enabled_at ?? new Date().toISOString();
    if (!dedup.enabled_at) {
      await ensureHelpReplyWorkerEnabledAt(supabase, enabledAt);
      dedup = await loadHelpReplyDedup(supabase);
    }

    const { data: messages, error: msgErr } = await supabase
      .from("inbox_messages")
      .select("id, case_id, created_at")
      .eq("sender", "support")
      .not("case_id", "is", null)
      .gte("created_at", enabledAt)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE * 4);

    if (msgErr) {
      console.error("[process-help-reply-push-queue] inbox_messages select failed:", msgErr);
      return new Response(JSON.stringify({ error: msgErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    let processed = 0;

    for (const row of messages ?? []) {
      if (isHelpReplyMessageProcessed(dedup, row.id)) {
        skipped++;
        continue;
      }
      if (processed >= BATCH_SIZE) break;

      processed++;
      const result = await sendHelpReplyPush(supabase, {
        caseId: row.case_id,
        messageId: row.id,
      });

      if (result.ok && result.sent) {
        sent++;
        await markHelpReplyMessageProcessed(supabase, row.id, enabledAt);
        dedup.sent_message_ids = [...(dedup.sent_message_ids ?? []), row.id];
        continue;
      }

      if (result.ok && !result.sent) {
        skipped++;
        await markHelpReplyMessageProcessed(supabase, row.id, enabledAt);
        dedup.sent_message_ids = [...(dedup.sent_message_ids ?? []), row.id];
        continue;
      }

      failed++;
      console.error(
        "[process-help-reply-push-queue] push failed:",
        row.id,
        result.error,
        result.detail,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        sent,
        skipped,
        failed,
        enabled_at: enabledAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[process-help-reply-push-queue]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
