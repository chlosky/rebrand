import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export const HELP_REPLY_DEDUP_FLAG = "help_reply_push_state";
const MAX_TRACKED_IDS = 500;

export type HelpReplyDedupConfig = {
  enabled_at?: string;
  sent_message_ids?: string[];
};

function parseConfig(raw: unknown): HelpReplyDedupConfig {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return parseConfig(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as HelpReplyDedupConfig;
}

export async function loadHelpReplyDedup(
  supabase: SupabaseClient,
): Promise<HelpReplyDedupConfig> {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("config, description")
    .eq("feature_name", HELP_REPLY_DEDUP_FLAG)
    .maybeSingle();

  if (error) {
    console.warn("[helpReplyPushDedup] load failed:", error);
    return {};
  }
  if (data?.config) return parseConfig(data.config);
  if (typeof data?.description === "string" && data.description.startsWith("{")) {
    return parseConfig(data.description);
  }
  return {};
}

async function persistHelpReplyDedup(
  supabase: SupabaseClient,
  payload: HelpReplyDedupConfig,
): Promise<void> {
  const json = JSON.stringify({
    enabled_at: payload.enabled_at,
    sent_message_ids: Array.isArray(payload.sent_message_ids)
      ? payload.sent_message_ids.slice(-MAX_TRACKED_IDS)
      : [],
  });

  const withConfig = await supabase.from("feature_flags").upsert(
    {
      feature_name: HELP_REPLY_DEDUP_FLAG,
      is_enabled: true,
      description: json,
      config: {
        enabled_at: payload.enabled_at,
        sent_message_ids: Array.isArray(payload.sent_message_ids)
          ? payload.sent_message_ids.slice(-MAX_TRACKED_IDS)
          : [],
      },
    },
    { onConflict: "feature_name" },
  );

  if (withConfig.error?.message?.includes("config")) {
    await supabase.from("feature_flags").upsert(
      {
        feature_name: HELP_REPLY_DEDUP_FLAG,
        is_enabled: true,
        description: json,
      },
      { onConflict: "feature_name" },
    );
  }
}

/** Pin worker start time on first cron run so replies are not missed between ticks. */
export async function ensureHelpReplyWorkerEnabledAt(
  supabase: SupabaseClient,
  enabledAt: string,
): Promise<void> {
  const existing = await loadHelpReplyDedup(supabase);
  if (existing.enabled_at) return;
  await persistHelpReplyDedup(supabase, {
    enabled_at: enabledAt,
    sent_message_ids: existing.sent_message_ids ?? [],
  });
}

export async function markHelpReplyMessageProcessed(
  supabase: SupabaseClient,
  messageId: string,
  enabledAt?: string,
): Promise<void> {
  const existing = await loadHelpReplyDedup(supabase);
  const sent = new Set(
    Array.isArray(existing.sent_message_ids) ? existing.sent_message_ids : [],
  );
  sent.add(messageId);

  const payload = {
    enabled_at: enabledAt ?? existing.enabled_at ?? new Date().toISOString(),
    sent_message_ids: [...sent].slice(-MAX_TRACKED_IDS),
  };
  await persistHelpReplyDedup(supabase, payload);
}

export function isHelpReplyMessageProcessed(
  config: HelpReplyDedupConfig,
  messageId: string,
): boolean {
  return Array.isArray(config.sent_message_ids) && config.sent_message_ids.includes(messageId);
}
