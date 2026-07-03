import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { multilingualHelpReplyPushFields } from "./pushLocale.ts";

const ROUTINE_PUSH_IOS_SOUND = "celestial_bloom.wav";
const ROUTINE_PUSH_ANDROID_SOUND = "celestial_bloom";

/**
 * Launch URL for help-reply taps. Default: none (omit OneSignal `url`).
 * Older iOS (e.g. 17) reloads the WebView on url tap while unlocked → false /login flash.
 * No url = tap only foregrounds the app (shipped client skips navigation when url is absent).
 * Set HELP_REPLY_PUSH_LAUNCH_URL=capacitor://localhost/dashboard to restore auto-navigation.
 */
function helpReplyLaunchUrl(caseId: string): string | null {
  const raw =
    Deno.env.get("HELP_REPLY_PUSH_LAUNCH_URL")?.trim() ??
    Deno.env.get("HELP_REPLY_PUSH_DEEP_LINK_URL")?.trim();
  if (!raw || raw.toLowerCase() === "none" || raw.toLowerCase() === "false") {
    return null;
  }
  return raw
    .replaceAll("{case_id}", encodeURIComponent(caseId))
    .replaceAll("{caseId}", encodeURIComponent(caseId));
}

function notificationsEligible(
  enabled: boolean,
  permissionStatus: string | null | undefined,
): boolean {
  if (!enabled) return false;
  if (permissionStatus === "denied") return false;
  return true;
}

export type HelpReplyPushResult =
  | { ok: true; sent: true; case_id: string; user_id: string; onesignal: unknown }
  | { ok: true; sent: false; skipped: true; reason: string }
  | { ok: false; error: string; detail?: unknown };

export async function sendHelpReplyPush(
  supabase: SupabaseClient,
  opts: { caseId: string; messageId?: string },
): Promise<HelpReplyPushResult> {
  const caseId = opts.caseId.trim();
  const messageId = opts.messageId?.trim() ?? "";

  if (!caseId) {
    return { ok: false, error: "case_id required" };
  }

  if (messageId) {
    const { data: msg, error: msgErr } = await supabase
      .from("inbox_messages")
      .select("id, case_id, sender")
      .eq("id", messageId)
      .maybeSingle();
    if (msgErr || !msg || msg.case_id !== caseId || msg.sender !== "support") {
      return { ok: false, error: "invalid_message" };
    }
  }

  const { data: supportCase, error: caseErr } = await supabase
    .from("support_cases")
    .select("id, user_id")
    .eq("id", caseId)
    .maybeSingle();
  if (caseErr || !supportCase?.user_id) {
    return { ok: false, error: "case_not_found" };
  }

  const targetUserId = supportCase.user_id;

  const [prefsRes, profileRes] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("app_notifications_enabled, notification_permission_status, preferred_locale")
      .eq("user_id", targetUserId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("app_notifications_enabled, notification_permission_status, preferred_locale")
      .eq("id", targetUserId)
      .maybeSingle(),
  ]);

  const notificationsEnabled =
    prefsRes.data?.app_notifications_enabled ??
    profileRes.data?.app_notifications_enabled ??
    false;
  const permissionStatus =
    prefsRes.data?.notification_permission_status ??
    profileRes.data?.notification_permission_status;

  if (!notificationsEligible(notificationsEnabled, permissionStatus)) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: "notifications_not_enabled",
    };
  }

  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")?.trim();
  const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY")?.trim();
  if (!oneSignalAppId || !oneSignalRestKey) {
    return { ok: false, error: "onesignal_not_configured" };
  }

  const launchUrl = helpReplyLaunchUrl(caseId);
  const payload = {
    app_id: oneSignalAppId,
    include_aliases: { external_id: [targetUserId] },
    target_channel: "push",
    ...multilingualHelpReplyPushFields(),
    ...(launchUrl ? { url: launchUrl } : {}),
    ios_sound: ROUTINE_PUSH_IOS_SOUND,
    android_sound: ROUTINE_PUSH_ANDROID_SOUND,
  };

  const pushRes = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${oneSignalRestKey}`,
    },
    body: JSON.stringify(payload),
  });

  let pushBody: Record<string, unknown> | null = null;
  try {
    pushBody = (await pushRes.json()) as Record<string, unknown>;
  } catch {
    pushBody = { raw: await pushRes.text().catch(() => "") };
  }

  const errors = Array.isArray(pushBody?.errors) ? pushBody.errors : [];
  const notificationId = typeof pushBody?.id === "string" ? pushBody.id.trim() : "";

  if (!pushRes.ok || errors.length > 0 || !notificationId) {
    console.error("[helpReplyPushCore] OneSignal failed:", pushRes.status, pushBody);
    return {
      ok: false,
      error: "push_failed",
      detail: pushBody,
    };
  }

  return {
    ok: true,
    sent: true,
    case_id: caseId,
    user_id: targetUserId,
    onesignal: pushBody,
  };
}
