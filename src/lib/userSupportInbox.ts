import i18n from "@/i18n";
import { resolveAppLocale } from "@/lib/locale";

export type UserInboxCase = {
  id: string;
  message_type: "help_me_create" | "app_support_feedback";
  submission_type: string | null;
  tool_label: string | null;
  tool_or_area: string | null;
  latest_message_preview: string;
  original_submission_text: string;
  user_unread: boolean;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
};

const SUBMISSION_TYPE_KEYS: Record<string, "submissionTypes.report" | "submissionTypes.aiFlag" | "submissionTypes.featureRequest" | "submissionTypes.helpMeCreate"> = {
  report: "submissionTypes.report",
  ai_flag: "submissionTypes.aiFlag",
  feature_request: "submissionTypes.featureRequest",
  help_me_create: "submissionTypes.helpMeCreate",
};

export function caseTypeLabel(_c: UserInboxCase): string {
  return i18n.t("support:inbox.caseTypes.appSupportFeedback");
}

function localizedInboxToolLabel(raw: string | null | undefined): string {
  const tool = raw?.trim() ?? "";
  if (!tool) return "";
  if (tool === "Not sure — help me choose") {
    return i18n.t("support:createHelpOptions.notSureHelpMeChoose");
  }
  return tool;
}

export function caseSubtypeLabel(c: UserInboxCase): string {
  if (c.message_type === "help_me_create") {
    return localizedInboxToolLabel(c.tool_label) || i18n.t("support:inbox.subtypes.request");
  }
  const typeLabel = c.submission_type
    ? SUBMISSION_TYPE_KEYS[c.submission_type]
      ? i18n.t(`support:${SUBMISSION_TYPE_KEYS[c.submission_type]}`)
      : c.submission_type
    : "";
  const tool = localizedInboxToolLabel(c.tool_label);
  if (typeLabel && tool) return `${typeLabel} · ${tool}`;
  return tool || typeLabel || i18n.t("support:inbox.subtypes.supportRequest");
}

export function formatInboxWhen(
  iso: string | null | undefined,
  opts?: { submitted?: boolean },
): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const locale =
      resolveAppLocale(i18n.language) === "es-419" ? "es" : undefined;
    const timeOpts: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };
    const time = d.toLocaleString(locale, timeOpts);
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) return i18n.t("support:inbox.todayAt", { time });
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    if (isYesterday) return i18n.t("support:inbox.yesterdayAt", { time });
    const datePart = d.toLocaleString(locale, { day: "numeric", month: "short" });
    if (locale === "es") {
      const when = `${datePart} a las ${time}`;
      return opts?.submitted ? `el ${when}` : when;
    }
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function caseListPreview(c: UserInboxCase): string {
  const preview = c.latest_message_preview?.trim();
  if (preview) return preview;
  const original = c.original_submission_text?.trim() ?? "";
  const firstLine = original.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  return firstLine.slice(0, 200);
}

export function caseSubmittedWhen(c: UserInboxCase): string {
  return i18n.t("support:inbox.submittedPrefix", {
    when: formatInboxWhen(c.created_at, { submitted: true }),
  });
}
