import { supabase } from "@/integrations/supabase/client";
import type { Board, BoardReminder, BoardWorkspace, BoardWorkspaceWithBoards } from "@/lib/boards/types";
import {
  buildTemplateFromFocusCategories,
  DEFAULT_FOUR_BOARD_TEMPLATE,
  normalizeFocusCategoryNames,
  resolveBoardStarterTemplate,
  STANDARD_FOCUS_BOARD_COUNT,
  type BoardStarterTemplate,
  type StarterBoardDef,
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

export async function loadDefaultWorkspace(userId: string): Promise<BoardWorkspaceWithBoards | null> {
  const existing = await fetchUserWorkspaces(userId);
  for (const ws of existing) {
    const full = await fetchWorkspaceWithBoards(ws.id);
    if (full) return full;
  }
  return null;
}

/** @deprecated Use loadDefaultWorkspace — does not create workspaces. */
export async function ensureDefaultWorkspace(userId: string): Promise<BoardWorkspaceWithBoards | null> {
  return loadDefaultWorkspace(userId);
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

  const focusBoards = template.boards.filter((b) => b.role === "focus").slice(0, STANDARD_FOCUS_BOARD_COUNT);
  const planBoard: StarterBoardDef =
    template.boards.find((b) => b.role === "plan") ?? {
      title: "The Plan",
      role: "plan",
      color_key: "white_opaque",
      sort_order: focusBoards.length,
      layout_mode: "vision",
    };
  const starterBoards = [...focusBoards, planBoard].map((b, sort_order) => ({ ...b, sort_order }));

  const boardRows = starterBoards.map((b) => ({
    workspace_id: workspace.id,
    user_id: userId,
    title: b.title,
    role: b.role,
    color_key: "white_opaque",
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

export async function updateWorkspaceName(workspaceId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workspace name is required");
  const { error } = await supabase.from("board_workspaces").update({ name: trimmed }).eq("id", workspaceId);
  if (error) throw error;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const { error } = await supabase.from("board_workspaces").delete().eq("id", workspaceId);
  if (error) throw error;
}

export async function saveAccountabilityMap(workspaceId: string, map: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from("board_workspaces")
    .update({ accountability_map_json: map })
    .eq("id", workspaceId);
  if (error) throw error;
}

export async function fetchAccountabilityMapJson(workspaceId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("board_workspaces")
    .select("accountability_map_json")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  const raw = data?.accountability_map_json;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
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
      color_key: "white_opaque",
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
  let uploadFile = file;
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, outType, outType === "image/jpeg" ? 0.92 : undefined);
        });
        if (blob) {
          const ext = outType === "image/png" ? "png" : "jpg";
          const base = file.name.replace(/\.[^.]+$/, "") || "upload";
          uploadFile = new File([blob], `${base}.${ext}`, { type: outType });
        }
      }
    } finally {
      bitmap.close();
    }
  }
  const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("board-uploads").upload(path, uploadFile, {
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

export async function listUserUploads(
  userId: string,
): Promise<{ path: string; signedUrl: string; thumbUrl: string }[]> {
  const { data, error } = await supabase.storage.from("board-uploads").list(userId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  const files = data ?? [];
  const paths = files
    .filter((f) => f.name && f.id !== null)
    .map((f) => `${userId}/${f.name}`);
  if (paths.length === 0) return [];

  const expiresIn = 60 * 60;

  const { data: signedRows, error: signErr } = await supabase.storage
    .from("board-uploads")
    .createSignedUrls(paths, expiresIn);
  if (signErr) throw signErr;

  const thumbRows = await Promise.all(
    paths.map(async (path) => {
      const { data: thumb, error: thumbErr } = await supabase.storage
        .from("board-uploads")
        .createSignedUrl(path, expiresIn, {
          transform: { width: 240, height: 240, resize: "cover" },
        });
      if (thumbErr || !thumb?.signedUrl) return null;
      return { path, thumbUrl: thumb.signedUrl };
    }),
  );
  const thumbByPath = new Map(
    thumbRows.filter((row): row is { path: string; thumbUrl: string } => row !== null).map((row) => [row.path, row.thumbUrl]),
  );

  return paths
    .map((path, index) => {
      const row = signedRows?.[index];
      if (!row?.signedUrl || row.error) return null;
      return {
        path,
        signedUrl: row.signedUrl,
        thumbUrl: thumbByPath.get(path) ?? row.signedUrl,
      };
    })
    .filter((item): item is { path: string; signedUrl: string; thumbUrl: string } => item !== null);
}
