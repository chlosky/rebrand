/**

 * Cron: send due board reminders via email and optional transactional SMS (Brevo).

 * Invoke with CRON_SECRET like send-routine-push-notifications.

 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  sanitizeSmsReminder,
  sendBrevoReminderEmail,
  sendBrevoReminderSms,
} from "../_shared/brevoReminders.ts";
import { userHasActivePlottingPro } from "../_shared/requirePlottingPro.ts";



const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",

};



const DEFAULT_TIME = "09:00";

const DEFAULT_SMS_DAILY_LIMIT = 5;

const WEEKDAY_OPTIONS = [

  "monday",

  "tuesday",

  "wednesday",

  "thursday",

  "friday",

  "saturday",

  "sunday",

] as const;



function parseHm(time: string): { h: number; m: number } {

  const [h, m] = time.split(":").map((x) => parseInt(x, 10));

  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };

}



function setLocalTime(d: Date, time: string) {

  const { h, m } = parseHm(time);

  d.setHours(h, m, 0, 0);

}



function weekdayIndex(day: string): number {

  const i = WEEKDAY_OPTIONS.indexOf(day.toLowerCase() as (typeof WEEKDAY_OPTIONS)[number]);

  return i >= 0 ? i : 0;

}



function lastDayOfMonth(year: number, month: number) {

  return new Date(year, month + 1, 0).getDate();

}



function localDayKey(date: Date, timezone: string): string {

  try {

    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);

  } catch {

    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(date);

  }

}



function stripSmsContent(content: string): string {
  return sanitizeSmsReminder(content);
}

function buildSmsContent(title: string, body?: string | null, smsContent?: string | null): string {
  if (typeof smsContent === "string" && smsContent.trim()) {
    return stripSmsContent(smsContent).slice(0, 70);
  }
  return stripSmsContent(title).slice(0, 70);
}

function primaryReminderChannel(channels: string[] | null | undefined): string {
  if (!channels?.length) return "email";
  return channels[0];
}



function isRecurringActionReminder(metadata: Record<string, unknown> | null | undefined): boolean {

  if (!metadata || metadata.source_page !== "action") return false;

  const cadence = metadata.cadence;

  return cadence === "daily" || cadence === "weekly" || cadence === "monthly";

}



function nextActionRemindAt(metadata: Record<string, unknown>, from = new Date()): string {

  const cadence = String(metadata.cadence ?? "daily");

  const time = String(metadata.remind_time ?? DEFAULT_TIME);



  if (cadence === "monthly") {

    const requested = typeof metadata.day_of_month === "number" ? metadata.day_of_month : 1;

    const d = new Date(from);

    const dom =

      requested === -1

        ? lastDayOfMonth(d.getFullYear(), d.getMonth())

        : Math.min(31, Math.max(1, requested));

    d.setDate(Math.min(dom, lastDayOfMonth(d.getFullYear(), d.getMonth())));

    setLocalTime(d, time);

    if (d.getTime() <= from.getTime()) {

      d.setMonth(d.getMonth() + 1);

      const nextDom =

        requested === -1

          ? lastDayOfMonth(d.getFullYear(), d.getMonth())

          : Math.min(31, Math.max(1, requested));

      d.setDate(Math.min(nextDom, lastDayOfMonth(d.getFullYear(), d.getMonth())));

      setLocalTime(d, time);

    }

    return d.toISOString();

  }



  if (cadence === "weekly") {

    const target = weekdayIndex(String(metadata.day_of_week ?? "monday"));

    const d = new Date(from);

    const current = d.getDay() === 0 ? 6 : d.getDay() - 1;

    let delta = target - current;

    if (delta < 0) delta += 7;

    d.setDate(d.getDate() + delta);

    setLocalTime(d, time);

    if (d.getTime() <= from.getTime()) {

      d.setDate(d.getDate() + 7);

    }

    return d.toISOString();

  }



  const d = new Date(from);

  setLocalTime(d, time);

  if (d.getTime() <= from.getTime()) {

    d.setDate(d.getDate() + 1);

  }

  return d.toISOString();

}



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

    .select("id, user_id, title, body, channels, remind_at, metadata, sms_content, sms_attempt_count, timezone")

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



  const smsCountCache = new Map<string, number>();



  async function smsSentTodayForUser(userId: string, timezone: string): Promise<number> {

    const cacheKey = `${userId}:${localDayKey(new Date(), timezone)}`;

    const cached = smsCountCache.get(cacheKey);

    if (cached !== undefined) return cached;



    const todayKey = localDayKey(new Date(), timezone);

    const { data: logs } = await supabase

      .from("palette_sms_send_log")

      .select("sent_at")

      .eq("user_id", userId)

      .eq("status", "sent");



    const total = (logs ?? []).filter((row) => localDayKey(new Date(row.sent_at), timezone) === todayKey).length;

    smsCountCache.set(cacheKey, total);

    return total;

  }



  let emailSent = 0;

  let smsSent = 0;

  let smsSkippedLimit = 0;

  let cancelledSubscription = 0;

  const subscriptionCache = new Map<string, boolean>();



  async function planAllowsReminders(userId: string): Promise<boolean> {

    const cached = subscriptionCache.get(userId);

    if (cached !== undefined) return cached;

    const ok = await userHasActivePlottingPro(supabase, userId);

    subscriptionCache.set(userId, ok);

    return ok;

  }



  for (const reminder of due ?? []) {

    if (!(await planAllowsReminders(reminder.user_id))) {

      await supabase

        .from("board_reminders")

        .update({ status: "cancelled" })

        .eq("id", reminder.id);

      await supabase.from("board_reminder_deliveries").insert({

        reminder_id: reminder.id,

        channel: primaryReminderChannel(reminder.channels ?? ["email"]),

        status: "skipped_plan_inactive",

        error: "subscription_inactive",

      });

      cancelledSubscription++;

      continue;

    }



    const { data: profile } = await supabase

      .from("profiles")

      .select("email, phone")

      .eq("id", reminder.user_id)

      .maybeSingle();



    const { data: prefs } = await supabase

      .from("user_preferences")

      .select(

        "phone_number_e164, sms_reminders_enabled, sms_reminder_consent_at, sms_reminder_opted_out_at, sms_daily_limit, timezone",

      )

      .eq("user_id", reminder.user_id)

      .maybeSingle();



    const email = profile?.email;

    const phone =

      (typeof prefs?.phone_number_e164 === "string" && prefs.phone_number_e164.trim()) ||

      profile?.phone?.trim() ||

      null;

    const userTimezone =

      (typeof prefs?.timezone === "string" && prefs.timezone.trim()) ||

      (typeof reminder.timezone === "string" && reminder.timezone.trim()) ||

      "UTC";

    const dailyLimit =

      typeof prefs?.sms_daily_limit === "number" && prefs.sms_daily_limit > 0

        ? prefs.sms_daily_limit

        : DEFAULT_SMS_DAILY_LIMIT;



    const smsConsentOk =

      prefs?.sms_reminders_enabled === true &&

      prefs?.sms_reminder_consent_at != null &&

      prefs?.sms_reminder_opted_out_at == null;



    const channels: string[] = reminder.channels ?? ["email"];

    const metadata = (reminder.metadata ?? null) as Record<string, unknown> | null;
    const isActionReminder = metadata?.source_page === "action";
    const channel = primaryReminderChannel(channels);

    const smsBody = buildSmsContent(reminder.title, reminder.body, reminder.sms_content);

    let emailDelivered = false;

    let smsDelivered = false;

    let smsLimitDeferred = false;

    if (channel === "email" && email) {
      if (isActionReminder) {
        const result = await sendBrevoReminderEmail({
          to: email,
          actionTitle: reminder.title,
          focusTitle: typeof metadata?.focus_title === "string" ? metadata.focus_title : null,
          planTitle: typeof metadata?.plan_title === "string" ? metadata.plan_title : null,
          remindAt: reminder.remind_at,
          details: reminder.body,
          reminderId: reminder.id,
        });
        await supabase.from("board_reminder_deliveries").insert({
          reminder_id: reminder.id,
          channel: "email",
          status: result.ok ? "sent" : "failed",
          error: result.ok ? null : result.error ?? "brevo_email_failed",
        });
        if (result.ok) {
          emailSent++;
          emailDelivered = true;
        }
      } else {
        const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`;
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            subject: `Reminder: ${reminder.title}`,
            textBody: reminder.body ?? reminder.title,
            htmlBody: `<p><strong>${reminder.title}</strong></p>${reminder.body ? `<p>${reminder.body}</p>` : ""}`,
            tag: "board-reminder",
          }),
        });
        await supabase.from("board_reminder_deliveries").insert({
          reminder_id: reminder.id,
          channel: "email",
          status: res.ok ? "sent" : "failed",
          error: res.ok ? null : await res.text(),
        });
        if (res.ok) {
          emailSent++;
          emailDelivered = true;
        }
      }
    }

    if (channel === "sms") {

      let smsStatus = "failed";

      let smsError: string | null = null;

      let providerMessageId: string | null = null;



      if (!smsConsentOk) {

        smsStatus = "skipped_no_consent";

        smsError = "sms_not_enabled_or_no_consent";

      } else if (!phone) {

        smsStatus = "skipped_no_phone";

        smsError = "missing_phone_number";

      } else {

        const sentToday = await smsSentTodayForUser(reminder.user_id, userTimezone);

        if (sentToday >= dailyLimit) {

          smsStatus = "skipped_limit";

          smsError = "daily_sms_limit_reached";

          smsSkippedLimit++;

          smsLimitDeferred = true;

        } else if (!smsBody || smsBody.length > 70 || /https?:\/\//i.test(smsBody)) {

          smsStatus = "failed";

          smsError = "invalid_sms_content";

        } else if (isActionReminder) {
          const result = await sendBrevoReminderSms({
            to: phone,
            smsText: smsBody,
            actionTitle: reminder.title,
            reminderId: reminder.id,
          });
          if (result.ok) {
            smsStatus = "sent";
            providerMessageId = result.messageId ?? null;
            smsDelivered = true;
            smsSent++;
            const cacheKey = `${reminder.user_id}:${localDayKey(new Date(), userTimezone)}`;
            smsCountCache.set(cacheKey, sentToday + 1);
          } else {
            smsStatus = "failed";
            smsError = result.error ?? "sms_send_failed";
          }
        } else {

          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms-notification`;

          const res = await fetch(fnUrl, {

            method: "POST",

            headers: {

              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,

              "Content-Type": "application/json",

            },

            body: JSON.stringify({

              phoneNumber: phone,

              message: smsBody,

              purpose: "board-reminder",

            }),

          });



          let payload: Record<string, unknown> = {};

          try {

            payload = await res.json();

          } catch {

            payload = {};

          }



          if (res.ok && payload?.success === true) {

            smsStatus = "sent";

            providerMessageId =

              typeof payload.messageId === "string" ? payload.messageId : null;

            smsDelivered = true;

            smsSent++;

            const cacheKey = `${reminder.user_id}:${localDayKey(new Date(), userTimezone)}`;

            smsCountCache.set(cacheKey, sentToday + 1);

          } else {

            smsStatus = "failed";

            smsError =

              typeof payload?.error === "string"

                ? payload.error

                : await res.text().catch(() => "sms_send_failed");

          }

        }

      }



      await supabase.from("board_reminder_deliveries").insert({

        reminder_id: reminder.id,

        channel: "sms",

        status: smsStatus,

        provider_message_id: providerMessageId,

        error: smsError,

      });



      await supabase.from("palette_sms_send_log").insert({

        user_id: reminder.user_id,

        reminder_id: reminder.id,

        phone_number_e164: phone ?? "unknown",

        content: smsBody || reminder.title,

        provider: "brevo",

        provider_message_id: providerMessageId,

        status: smsStatus,

        error_message: smsError,

      });



      await supabase

        .from("board_reminders")

        .update({

          sms_content: smsBody,

          sms_sent_at: smsStatus === "sent" ? now : null,

          sms_brevo_message_id: providerMessageId,

          sms_send_status: smsStatus,

          sms_send_error: smsError,

          sms_attempt_count: (reminder.sms_attempt_count ?? 0) + 1,

        })

        .eq("id", reminder.id);

    }



    if (channels.includes("push")) {

      await supabase.from("board_reminder_deliveries").insert({

        reminder_id: reminder.id,

        channel: "push",

        status: "queued",

      });

    }



    const anyDelivered = emailDelivered || smsDelivered;

    if (!anyDelivered && !smsLimitDeferred) continue;



    const metadata = (reminder.metadata ?? null) as Record<string, unknown> | null;

    if (isRecurringActionReminder(metadata)) {

      await supabase

        .from("board_reminders")

        .update({

          status: "scheduled",

          last_sent_at: anyDelivered ? now : reminder.remind_at,

          remind_at: nextActionRemindAt(metadata!, new Date()),

        })

        .eq("id", reminder.id);

    } else if (anyDelivered || smsLimitDeferred) {

      await supabase

        .from("board_reminders")

        .update({ status: "sent", last_sent_at: now })

        .eq("id", reminder.id);

    }

  }



  return new Response(

    JSON.stringify({

      processed: due?.length ?? 0,

      email_sent: emailSent,

      sms_sent: smsSent,

      sms_skipped_daily_limit: smsSkippedLimit,

      cancelled_subscription: cancelledSubscription,

      daily_sms_limit: DEFAULT_SMS_DAILY_LIMIT,

    }),

    {

      headers: { ...corsHeaders, "Content-Type": "application/json" },

    },

  );

});

