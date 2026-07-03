export type SupportCaseRow = {
  id: string;
  user_id: string;
  user_email: string;
  message_type: "help_me_create" | "app_support_feedback";
  submission_type: string | null;
  tool_or_area: string | null;
  tool_label: string | null;
  subject: string;
  original_submission_text: string;
  latest_message_preview: string;
  status: "open" | "closed";
  admin_unread: boolean;
  user_unread: boolean;
  attachment_storage_paths: string[];
  report_id: string | null;
  thread_id: string | null;
  closed_at: string | null;
  closed_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminInboxTab = "open" | "closed" | "all_users";

export type UserCaseGroup = {
  user_id: string;
  email: string;
  first_name: string | null;
  cases: SupportCaseRow[];
  open_count: number;
  closed_count: number;
  latest_activity: string;
  latest_case_type: SupportCaseRow["message_type"];
  latest_preview: string;
  admin_needs_response: boolean;
};

export function messageTypeLabel(type: SupportCaseRow["message_type"]): string {
  return type === "help_me_create" ? "Help Me Create" : "App Support";
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function groupCasesByUser(
  cases: SupportCaseRow[],
  profiles: Record<string, { email?: string | null; first_name?: string | null }>,
): UserCaseGroup[] {
  const byUser = new Map<string, SupportCaseRow[]>();
  for (const c of cases) {
    const list = byUser.get(c.user_id) ?? [];
    list.push(c);
    byUser.set(c.user_id, list);
  }

  const groups: UserCaseGroup[] = [];
  for (const [userId, userCases] of byUser) {
    const sorted = [...userCases].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    const latest = sorted[0];
    const open_count = sorted.filter((c) => c.status === "open").length;
    const closed_count = sorted.filter((c) => c.status === "closed").length;
    const profile = profiles[userId];
    groups.push({
      user_id: userId,
      email: profile?.email ?? latest.user_email ?? "",
      first_name: profile?.first_name ?? null,
      cases: sorted,
      open_count,
      closed_count,
      latest_activity: latest.updated_at,
      latest_case_type: latest.message_type,
      latest_preview: latest.latest_message_preview,
      admin_needs_response: sorted.some((c) => c.admin_unread && c.status === "open"),
    });
  }

  return groups.sort(
    (a, b) => new Date(b.latest_activity).getTime() - new Date(a.latest_activity).getTime(),
  );
}

export function filterCasesForTab(cases: SupportCaseRow[], tab: AdminInboxTab): SupportCaseRow[] {
  if (tab === "open") return cases.filter((c) => c.status === "open");
  if (tab === "closed") return cases.filter((c) => c.status === "closed");
  return cases;
}

export function caseMatchesSearch(c: SupportCaseRow, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    c.user_email.toLowerCase().includes(needle) ||
    c.user_id.toLowerCase().includes(needle) ||
    c.subject.toLowerCase().includes(needle) ||
    c.latest_message_preview.toLowerCase().includes(needle) ||
    c.original_submission_text.toLowerCase().includes(needle) ||
    (c.tool_label ?? "").toLowerCase().includes(needle) ||
    (c.tool_or_area ?? "").toLowerCase().includes(needle) ||
    c.message_type.toLowerCase().includes(needle) ||
    (c.submission_type ?? "").toLowerCase().includes(needle)
  );
}

export function filterCasesBySearch(
  cases: SupportCaseRow[],
  profiles: Record<string, { email?: string | null; first_name?: string | null }>,
  q: string,
): SupportCaseRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return cases;

  const profileMatchedUserIds = new Set<string>();
  for (const c of cases) {
    const p = profiles[c.user_id];
    const email = (p?.email ?? c.user_email).toLowerCase();
    if (
      email.includes(needle) ||
      c.user_id.toLowerCase().includes(needle) ||
      (p?.first_name ?? "").toLowerCase().includes(needle)
    ) {
      profileMatchedUserIds.add(c.user_id);
    }
  }

  return cases.filter((c) => caseMatchesSearch(c, needle) || profileMatchedUserIds.has(c.user_id));
}
