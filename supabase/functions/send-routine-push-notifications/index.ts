/**
 * Server-side routine push scheduler (Supabase cron + CRON_SECRET).
 * Sends at each user's chosen HH:mm times in their IANA timezone — not fixed global slots.
 * App stores routine_notification_times + timezone; OneSignal tags are for debug/segmentation only.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { multilingualRoutinePushFields } from "../_shared/pushLocale.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Bundled in ios/App/App/celestial_bloom.wav and android res/raw/celestial_bloom.wav */
const ROUTINE_PUSH_IOS_SOUND = "celestial_bloom.wav";
const ROUTINE_PUSH_ANDROID_SOUND = "celestial_bloom";

/** Default: no launch url (tap foregrounds app — same as help-reply; safer on older iOS). */
function routineLaunchUrl(): string | null {
  const raw =
    Deno.env.get("ROUTINE_PUSH_LAUNCH_URL")?.trim() ??
    Deno.env.get("ROUTINE_PUSH_DEEP_LINK_URL")?.trim();
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "false") {
    return null;
  }
  return raw;
}

type PrefsRow = {
  user_id: string;
  app_notifications_enabled: boolean | null;
  notification_permission_status: string | null;
  routine_notification_times: unknown;
  timezone: string | null;
  preferred_locale: string | null;
};

type ProfileRow = {
  id: string;
  app_notifications_enabled: boolean | null;
  notification_permission_status: string | null;
  routine_notification_times: unknown;
  timezone: string | null;
  preferred_locale: string | null;
};

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function parseAlertTimes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t));
}

function getLocalDateTimeParts(
  date: Date,
  timeZone: string,
): { localDate: string; hours: number; minutes: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    if (!year || !month || !day || hour == null || minute == null) return null;
    return {
      localDate: `${year}-${month}-${day}`,
      hours: Number(hour),
      minutes: Number(minute),
    };
  } catch {
    return null;
  }
}

/** True when alert HH:mm falls in the current 5-minute local bucket (cron-aligned). */
function isAlertDueInBucket(alertTime: string, localHours: number, localMinutes: number): boolean {
  const [ah, am] = alertTime.split(":").map((v) => Number(v));
  if (!Number.isFinite(ah) || !Number.isFinite(am)) return false;
  const alertMins = ah * 60 + am;
  const nowMins = localHours * 60 + localMinutes;
  const bucketStart = Math.floor(nowMins / 5) * 5;
  const bucketEnd = bucketStart + 5;
  return alertMins >= bucketStart && alertMins < bucketEnd;
}

async function sendOneSignalPush(opts: {
  appId: string;
  restApiKey: string;
  externalUserId: string;
  url: string | null;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const payload = {
    app_id: opts.appId,
    include_aliases: { external_id: [opts.externalUserId] },
    target_channel: "push",
    ...multilingualRoutinePushFields(),
    ...(opts.url ? { url: opts.url } : {}),
    ios_sound: ROUTINE_PUSH_IOS_SOUND,
    android_sound: ROUTINE_PUSH_ANDROID_SOUND,
  };

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${opts.restApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = { raw: await res.text().catch(() => "") };
  }

  return { ok: res.ok, status: res.status, body };
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

    if (!isEnabledFlag(Deno.env.get("ROUTINE_PUSH_WORKER_ENABLED"))) {
      return new Response(
        JSON.stringify({ success: true, enabled: false, sent: 0, skipped: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")?.trim();
    const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY")?.trim();
    if (!oneSignalAppId || !oneSignalRestKey) {
      return new Response(JSON.stringify({ error: "OneSignal not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const launchUrl = routineLaunchUrl();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [prefsRes, profilesRes] = await Promise.all([
      supabase
        .from("user_preferences")
        .select(
          "user_id, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
        )
        .eq("app_notifications_enabled", true)
        .eq("notification_permission_status", "granted"),
      supabase
        .from("profiles")
        .select(
          "id, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
        )
        .eq("app_notifications_enabled", true)
        .eq("notification_permission_status", "granted"),
    ]);

    if (prefsRes.error) {
      console.error("[send-routine-push-notifications] prefs select failed:", prefsRes.error);
      return new Response(JSON.stringify({ error: prefsRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (profilesRes.error) {
      console.error("[send-routine-push-notifications] profiles select failed:", profilesRes.error);
      return new Response(JSON.stringify({ error: profilesRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileById = new Map(
      ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
    );
    const seenUserIds = new Set<string>();
    const candidates: {
      userId: string;
      timesRaw: unknown;
      timeZoneRaw: string | null;
      localeRaw: string | null;
    }[] = [];

    for (const row of (prefsRes.data ?? []) as PrefsRow[]) {
      seenUserIds.add(row.user_id);
      const profile = profileById.get(row.user_id);
      candidates.push({
        userId: row.user_id,
        timesRaw: row.routine_notification_times ?? profile?.routine_notification_times,
        timeZoneRaw: row.timezone ?? profile?.timezone ?? null,
        localeRaw: row.preferred_locale ?? profile?.preferred_locale ?? null,
      });
    }

    for (const profile of (profilesRes.data ?? []) as ProfileRow[]) {
      if (seenUserIds.has(profile.id)) continue;
      candidates.push({
        userId: profile.id,
        timesRaw: profile.routine_notification_times,
        timeZoneRaw: profile.timezone ?? null,
        localeRaw: profile.preferred_locale ?? null,
      });
    }

    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const candidate of candidates) {
      const alertTimes = parseAlertTimes(candidate.timesRaw);
      if (alertTimes.length === 0) {
        skipped++;
        continue;
      }

      const timeZoneRaw = candidate.timeZoneRaw;
      const timeZone =
        typeof timeZoneRaw === "string" && timeZoneRaw.trim() ? timeZoneRaw.trim() : "UTC";

      const local = getLocalDateTimeParts(now, timeZone);
      if (!local) {
        skipped++;
        continue;
      }

      for (let index = 0; index < alertTimes.length && index < 3; index++) {
        const alertTime = alertTimes[index];
        if (!isAlertDueInBucket(alertTime, local.hours, local.minutes)) continue;

        const alertSlot = index + 1;
        const { data: inserted, error: insertErr } = await supabase
          .from("routine_push_delivery_log")
          .insert({
            user_id: candidate.userId,
            alert_slot: alertSlot,
            scheduled_for_date: local.localDate,
            scheduled_time: alertTime,
          })
          .select("id")
          .maybeSingle();

        if (insertErr) {
          if (insertErr.code === "23505") {
            skipped++;
            continue;
          }
          console.error(
            "[send-routine-push-notifications] delivery log insert failed:",
            candidate.userId,
            insertErr,
          );
          failed++;
          continue;
        }

        if (!inserted?.id) {
          skipped++;
          continue;
        }

        const pushResult = await sendOneSignalPush({
          appId: oneSignalAppId,
          restApiKey: oneSignalRestKey,
          externalUserId: candidate.userId,
          url: launchUrl,
        });

        await supabase
          .from("routine_push_delivery_log")
          .update({ onesignal_response: pushResult.body })
          .eq("id", inserted.id);

        if (pushResult.ok) {
          sent++;
        } else {
          failed++;
          console.error(
            "[send-routine-push-notifications] OneSignal send failed:",
            candidate.userId,
            pushResult.status,
            pushResult.body,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-routine-push-notifications] unexpected error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
