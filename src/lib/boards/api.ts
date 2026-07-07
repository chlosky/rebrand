import { supabase } from "@/integrations/supabase/client";
import type { Board, BoardReminder, BoardWorkspace, BoardWorkspaceWithBoards } from "@/lib/boards/types";
import {
  buildTemplateFromFocusCategories,
  DEFAULT_FOUR_BOARD_TEMPLATE,
  normalizeFocusCategoryNames,
  resolveBoardStarterTemplate,
  type BoardStarterTemplate,
} from "@/lib/boards/starterTemplates";

export async function fetchUserWorkspaces(userId: string): Promise<BoardWorkspace[]> {
  const { data, error } = await supabase
    .from("board_workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BoardWorkspace[];
}

export async function fetchWorkspaceWithBoards(workspaceId: string): Promise<BoardWorkspaceWithBoards | null> {
  const { data: workspace, error: wErr } = await supabase
    .from("board_workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (wErr) throw wErr;
  if (!workspace) return null;

  const { data: boards, error: bErr } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (bErr) throw bErr;

  return { ...(workspace as BoardWorkspace), boards: (boards ?? []) as Board[] };
}

export async function ensureDefaultWorkspace(userId: string): Promise<BoardWorkspaceWithBoards> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) {
    const full = await fetchWorkspaceWithBoards(existing[0].id);
    if (full) return full;
  }
  return createWorkspaceFromTemplate(userId, DEFAULT_FOUR_BOARD_TEMPLATE);
}

/** First entitlement: create a workspace from onboarding rebrand config when none exists. */
export async function ensureStarterWorkspaceFromSlug(
  userId: string,
  templateSlug: string | undefined,
): Promise<BoardWorkspaceWithBoards | null> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) return null;
  const template = resolveBoardStarterTemplate(templateSlug);
  return createWorkspaceFromTemplate(userId, template);
}

/** First entitlement: focus categories from onboarding become the three starter boards plus The Plan. */
export async function ensureStarterWorkspaceFromCategories(
  userId: string,
  categories: string[] | undefined,
): Promise<BoardWorkspaceWithBoards | null> {
  const existing = await fetchUserWorkspaces(userId);
  if (existing.length > 0) return null;
  const valid = normalizeFocusCategoryNames(categories);
  if (valid.length === 0) return null;
  return createWorkspaceFromTemplate(userId, buildTemplateFromFocusCategories(valid));
}

export async function createWorkspaceFromTemplate(
  userId: string,
  template: BoardStarterTemplate,
  name?: string,
): Promise<BoardWorkspaceWithBoards> {
  const { data: workspace, error: wErr } = await supabase
    .from("board_workspaces")
    .insert({
      user_id: userId,
      name: name?.trim() || template.name,
      preset_slug: template.slug,
    })
    .select()
    .single();
  if (wErr) throw wErr;

  const boardRows = template.boards.map((b) => ({
    workspace_id: workspace.id,
    user_id: userId,
    title: b.title,
    role: b.role,
    color_key: b.color_key,
    sort_order: b.sort_order,
    layout_mode: b.layout_mode ?? "vision",
    artboard_width: b.artboard_width ?? 1080,
    artboard_height: b.artboard_height ?? 1350,
    layout_json: {},
  }));

  const { data: boards, error: bErr } = await supabase.from("boards").insert(boardRows).select();
  if (bErr) throw bErr;

  return { ...(workspace as BoardWorkspace), boards: (boards ?? []) as Board[] };
}

export async function saveBoardLayout(boardId: string, layoutJson: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("boards")
    .update({ layout_json: layoutJson })
    .eq("id", boardId);
  if (error) throw error;
}

export async function updateBoardMeta(
  boardId: string,
  patch: Partial<Pick<Board, "title" | "title_color" | "title_font" | "color_key" | "sort_order" | "layout_mode">>,
): Promise<void> {
  const { error } = await supabase.from("boards").update(patch).eq("id", boardId);
  if (error) throw error;
}

export async function addBoard(
  workspaceId: string,
  userId: string,
  title: string,
  role: Board["role"],
  sortOrder: number,
  dimensions?: Pick<Board, "artboard_width" | "artboard_height">,
): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      title,
      role,
      color_key: role === "plan" ? "white_opaque" : "light_pink",
      sort_order: sortOrder,
      artboard_width: dimensions?.artboard_width ?? 1080,
      artboard_height: dimensions?.artboard_height ?? 1350,
      layout_json: {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as Board;
}

export async function reorderBoards(orderedBoardIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedBoardIds.map((id, sort_order) => supabase.from("boards").update({ sort_order }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw error;
}

export async function createBoardReminder(
  input: Omit<BoardReminder, "id" | "created_at" | "updated_at" | "last_sent_at" | "ical_uid" | "status"> & {
    status?: string;
    metadata?: Record<string, unknown> | null;
  },
): Promise<BoardReminder> {
  const { data, error } = await supabase.from("board_reminders").insert(input).select().single();
  if (error) throw error;
  return data as BoardReminder;
}

export async function deletePendingActionRemindersForChannel(params: {
  boardId: string;
  userId: string;
  channel: "email" | "sms";
}): Promise<void> {
  const { error } = await supabase
    .from("board_reminders")
    .delete()
    .eq("board_id", params.boardId)
    .eq("user_id", params.userId)
    .eq("source", "ai_extracted")
    .eq("status", "scheduled")
    .contains("channels", [params.channel])
    .filter("metadata->>source_page", "eq", "action");

  if (error) throw error;
}

export async function uploadBoardImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("board-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from("board-uploads")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

export async function listUserUploads(userId: string): Promise<{ path: string; signedUrl: string }[]> {
  const { data, error } = await supabase.storage.from("board-uploads").list(userId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  const files = data ?? [];
  const out: { path: string; signedUrl: string }[] = [];
  for (const f of files) {
    if (!f.name || f.id === null) continue;
    const path = `${userId}/${f.name}`;
    const { data: signed, error: signErr } = await supabase.storage
      .from("board-uploads")
      .createSignedUrl(path, 60 * 60);
    if (!signErr && signed?.signedUrl) out.push({ path, signedUrl: signed.signedUrl });
  }
  return out;
}
