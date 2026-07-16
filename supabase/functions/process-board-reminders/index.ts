/**

 * Cron: send due board reminders via email and optional transactional SMS (Brevo).

 * Invoke with CRON_SECRET like send-routine-push-notifications.

 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import {
  buildReminderSmsContent,
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

const ROUTINE_PUSH_IOS_SOUND = "celestial_bloom.wav";
const ROUTINE_PUSH_ANDROID_SOUND = "celestial_bloom";

function isBoardReminderPushEnabled(): boolean {
  const raw = Deno.env.get("BOARD_REMINDER_PUSH_ENABLED");
  if (!raw) return false;
  const s = raw.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function buildPushReminderBody(title: string, body?: string | null, smsContent?: string | null): string {
  if (typeof smsContent === "string" && smsContent.trim()) {
    return stripSmsContent(smsContent).replace(/\breply\s+stop\s+to\s+opt\s+out\.?$/i, "").trim();
  }
  if (typeof body === "string" && body.trim()) return stripSmsContent(body);
  return stripSmsContent(title);
}

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
    return buildReminderSmsContent(stripSmsContent(smsContent));
  }
  return buildReminderSmsContent(stripSmsContent(title));
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

  let pushSent = 0;

  let smsSkippedLimit = 0;

  let cancelledSubscription = 0;

  let cancelledGlobalPause = 0;

  const subscriptionCache = new Map<string, boolean>();

  const globalPauseCache = new Map<string, boolean>();

  async function remindersGloballyPaused(userId: string): Promise<boolean> {
    const cached = globalPauseCache.get(userId);
    if (cached !== undefined) return cached;

    const { data } = await supabase
      .from("user_preferences")
      .select("board_reminders_paused")
      .eq("user_id", userId)
      .maybeSingle();

    const paused = data?.board_reminders_paused === true;
    globalPauseCache.set(userId, paused);
    return paused;
  }

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

    if (await remindersGloballyPaused(reminder.user_id)) {
      await supabase
        .from("board_reminders")
        .update({ status: "cancelled" })
        .eq("id", reminder.id);

      await supabase.from("board_reminder_deliveries").insert({
        reminder_id: reminder.id,
        channel: primaryReminderChannel(reminder.channels ?? ["email"]),
        status: "skipped_global_pause",
        error: "board_reminders_globally_paused",
      });

      cancelledGlobalPause++;

      continue;
    }

    const { data: profile } = await supabase

      .from("profiles")

      .select("email, phone, app_notifications_enabled, notification_permission_status")

      .eq("id", reminder.user_id)

      .maybeSingle();



    const { data: prefs } = await supabase

      .from("user_preferences")

      .select(

        "sms_reminders_enabled, phone_number_e164, sms_reminder_consent_at, sms_reminder_opted_out_at, sms_daily_limit, timezone, app_notifications_enabled, notification_permission_status",

      )

      .eq("user_id", reminder.user_id)

      .maybeSingle();



    let email = typeof profile?.email === "string" && profile.email.trim() ? profile.email.trim() : null;
    if (!email) {
      const { data: authUser, error: authEmailErr } = await supabase.auth.admin.getUserById(reminder.user_id);
      if (authEmailErr) {
        console.warn("Could not load auth email for reminder:", reminder.id, authEmailErr);
      }
      email = authUser?.user?.email?.trim() || null;
    }

    const phone =

      typeof prefs?.phone_number_e164 === "string" && prefs.phone_number_e164.trim()

        ? prefs.phone_number_e164.trim()

        : null;

    const userTimezone =

      (typeof prefs?.timezone === "string" && prefs.timezone.trim()) ||

      (typeof reminder.timezone === "string" && reminder.timezone.trim()) ||

      "UTC";

    const dailyLimit =

      typeof prefs?.sms_daily_limit === "number" && prefs.sms_daily_limit > 0

        ? prefs.sms_daily_limit

        : DEFAULT_SMS_DAILY_LIMIT;



    const smsAllowed =

      prefs?.sms_reminders_enabled === true &&

      prefs?.sms_reminder_consent_at != null &&

      prefs?.sms_reminder_opted_out_at == null;

    const pushAllowed =
      (prefs?.app_notifications_enabled === true || profile?.app_notifications_enabled === true) &&
      (prefs?.notification_permission_status ?? profile?.notification_permission_status) === "granted";

    const channels: string[] = reminder.channels ?? ["email"];

    const metadata = (reminder.metadata ?? null) as Record<string, unknown> | null;
    const channel = primaryReminderChannel(channels);

    if (channel === "calendar") {
      continue;
    }

    const smsBody = buildSmsContent(reminder.title, reminder.body, reminder.sms_content);

    let emailDelivered = false;

    let smsDelivered = false;

    let pushDelivered = false;

    let smsLimitDeferred = false;

    if (channel === "email") {
      if (!email) {
        await supabase.from("board_reminder_deliveries").insert({
          reminder_id: reminder.id,
          channel: "email",
          status: "skipped_no_email",
          error: "missing_profile_or_auth_email",
        });
      } else {
        const result = await sendBrevoReminderEmail({
          to: email,
          actionTitle: reminder.title,
          reminderId: reminder.id,
          cadence: typeof metadata?.cadence === "string" ? metadata.cadence : null,
          remindAt: reminder.remind_at,
          timezone: userTimezone,
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
      }
    }

    if (channel === "sms") {

      let smsStatus = "failed";

      let smsError: string | null = null;

      let providerMessageId: string | null = null;



      if (!smsAllowed) {

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

        } else if (!smsBody || smsBody.length > 160 || /https?:\/\//i.test(smsBody)) {

          smsStatus = "failed";

          smsError = "invalid_sms_content";

        } else {
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

    if (channel === "push") {
      const pushBody = buildPushReminderBody(reminder.title, reminder.body, reminder.sms_content);
      let pushStatus = "failed";
      let pushError: string | null = null;
      let providerMessageId: string | null = null;

      if (!isBoardReminderPushEnabled()) {
        pushStatus = "skipped_disabled";
        pushError = "board_reminder_push_disabled";
      } else if (!pushAllowed) {
        pushStatus = "skipped_no_consent";
        pushError = "push_not_enabled_or_no_permission";
      } else if (!pushBody) {
        pushStatus = "failed";
        pushError = "invalid_push_content";
      } else {
        const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")?.trim();
        const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY")?.trim();
        if (!oneSignalAppId || !oneSignalRestKey) {
          pushStatus = "skipped_not_configured";
          pushError = "onesignal_not_configured";
        } else {
          const pushRes = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Key ${oneSignalRestKey}`,
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_aliases: { external_id: [reminder.user_id] },
              target_channel: "push",
              headings: { en: "palette plotting" },
              contents: { en: pushBody },
              ios_sound: ROUTINE_PUSH_IOS_SOUND,
              android_sound: ROUTINE_PUSH_ANDROID_SOUND,
            }),
          });

          let pushResponse: Record<string, unknown> | null = null;
          try {
            pushResponse = (await pushRes.json()) as Record<string, unknown>;
          } catch {
            pushResponse = { raw: await pushRes.text().catch(() => "") };
          }

          const errors = Array.isArray(pushResponse?.errors) ? pushResponse.errors : [];
          providerMessageId =
            typeof pushResponse?.id === "string" ? pushResponse.id.trim() : null;

          if (pushRes.ok && errors.length === 0 && providerMessageId) {
            pushStatus = "sent";
            pushDelivered = true;
            pushSent++;
          } else {
            pushStatus = "failed";
            pushError = "push_send_failed";
            console.error("[process-board-reminders] OneSignal push failed:", pushRes.status, pushResponse);
          }
        }
      }

      await supabase.from("board_reminder_deliveries").insert({
        reminder_id: reminder.id,
        channel: "push",
        status: pushStatus,
        provider_message_id: providerMessageId,
        error: pushError,
      });
    }



    const anyDelivered = emailDelivered || smsDelivered || pushDelivered;

    if (!anyDelivered && !smsLimitDeferred) continue;

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

      push_sent: pushSent,

      sms_skipped_daily_limit: smsSkippedLimit,

      cancelled_subscription: cancelledSubscription,

      cancelled_global_pause: cancelledGlobalPause,

      daily_sms_limit: DEFAULT_SMS_DAILY_LIMIT,

    }),

    {

      headers: { ...corsHeaders, "Content-Type": "application/json" },

    },

  );

});

