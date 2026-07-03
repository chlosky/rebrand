/**
 * Cron: send due board reminders via email (and queue push when enabled).
 * Invoke with CRON_SECRET like send-routine-push-notifications.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!cronSecret || provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const now = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("board_reminders")
    .select("id, user_id, title, body, channels, remind_at")
    .eq("status", "scheduled")
    .lte("remind_at", now)
    .limit(50);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "query failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let smsSent = 0;
  for (const reminder of due ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", reminder.user_id)
      .maybeSingle();

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("texts_enabled")
      .eq("user_id", reminder.user_id)
      .maybeSingle();

    const email = profile?.email;
    const phone = profile?.phone?.trim();
    const smsAllowed = prefs?.texts_enabled !== false;
    const channels: string[] = reminder.channels ?? ["email"];
    const smsBody = reminder.body
      ? `${reminder.title}: ${reminder.body}`
      : `Palette Plotting — ${reminder.title}`;

    if (channels.includes("email") && email) {
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Palette Plotting — ${reminder.title}`,
          textBody: reminder.body ?? `Reminder: ${reminder.title}`,
          htmlBody: `<p><strong>${reminder.title}</strong></p>${reminder.body ? `<p>${reminder.body}</p>` : ""}<p><a href="https://paletteplot.com/dashboard/boards">Open your boards</a></p>`,
          tag: "board-reminder",
        }),
      });
      await supabase.from("board_reminder_deliveries").insert({
        reminder_id: reminder.id,
        channel: "email",
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : await res.text(),
      });
      if (res.ok) sent++;
    }

    if (channels.includes("sms") && phone && smsAllowed) {
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms-notification`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          message: `${smsBody} — paletteplot.com/dashboard/boards`,
        }),
      });
      await supabase.from("board_reminder_deliveries").insert({
        reminder_id: reminder.id,
        channel: "sms",
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : await res.text(),
      });
      if (res.ok) smsSent++;
    }

    if (channels.includes("push")) {
      // Hook for OneSignal when native app ships — log as queued
      await supabase.from("board_reminder_deliveries").insert({
        reminder_id: reminder.id,
        channel: "push",
        status: "queued",
      });
    }

    await supabase
      .from("board_reminders")
      .update({ status: "sent", last_sent_at: now })
      .eq("id", reminder.id);
  }

  return new Response(JSON.stringify({ processed: due?.length ?? 0, email_sent: sent, sms_sent: smsSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
