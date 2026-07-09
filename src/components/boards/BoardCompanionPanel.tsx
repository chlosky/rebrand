import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RefObject } from "react";

import { Eraser, Loader2, Mic, PenLine, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { BOARD_COLORS, normalizeBoardColorHex } from "@/lib/boards/colors";
import type { AccountabilityMap } from "@/lib/boards/accountabilityMap";
import {
  applyActionGuideOperations,
  filterValidActionGuideOperations,
  type ActionGuideOperation,
} from "@/lib/boards/applyActionGuideOperations";

import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";
import type { BoardMarkShapeType, BoardMarkStickerId } from "@/components/boards/BoardMarksQuickSelector";
import { BOARD_MARK_STICKER_OPTIONS } from "@/components/boards/BoardMarksQuickSelector";
import { BOARD_IMAGE_THEMES, loadBoardImageLibrary, filterLibraryByTheme } from "@/lib/boards/imageLibrary";

import { supabase } from "@/integrations/supabase/client";

import { cn } from "@/lib/utils";

import { toast } from "sonner";



type ChatTurn = { role: "user" | "assistant"; content: string };

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;



const VISION_WELCOME_MESSAGE =
  "What do you want to add, change, or remove — content, colors, layout, or board names?";

const ACTION_WELCOME_MESSAGE =
  "Ask the guide to clean up actions, adjust reminders, or explain the plan.";

const VISION_WELCOME_TURN: ChatTurn = { role: "assistant", content: VISION_WELCOME_MESSAGE };
const ACTION_WELCOME_TURN: ChatTurn = { role: "assistant", content: ACTION_WELCOME_MESSAGE };



function chatStorageKey(workspaceId: string, mode: "vision" | "action") {
  return mode === "action" ? `board-guide-chat-action:${workspaceId}` : `board-companion-chat:${workspaceId}`;
}

function welcomeTurn(mode: "vision" | "action"): ChatTurn {
  return mode === "action" ? ACTION_WELCOME_TURN : VISION_WELCOME_TURN;
}



function loadStoredChat(workspaceId: string, mode: "vision" | "action"): ChatTurn[] | null {
  try {
    const raw = localStorage.getItem(chatStorageKey(workspaceId, mode));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as ChatTurn[];

    if (!Array.isArray(parsed) || !parsed.length) return null;

    return parsed.filter(

      (m) =>

        m &&

        typeof m === "object" &&

        (m.role === "user" || m.role === "assistant") &&

        typeof m.content === "string",

    );

  } catch {

    return null;

  }

}



async function companionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg === "Unauthorized" || msg === "JWT expired") {
      return "I could not reach the guide right now. Please refresh or sign in again.";
    }
  }

  if (error && typeof error === "object" && "context" in error) {

    const ctx = (error as { context?: Response }).context;

    const status = ctx?.status;

    try {

      const body = (await ctx?.json?.()) as { error?: string; reply?: string } | undefined;

      if (body?.error === "Plotting Pro subscription required") {

        return "Guide needs an active palette plotting Premium plan.";

      }

      if (typeof body?.error === "string" && body.error.trim()) return body.error.trim();

    } catch {

      /* ignore parse errors */

    }

    if (status === 401 || status === 403) {
      return "I could not reach the guide right now. Please refresh or sign in again.";
    }

    if (status === 404) return "Couldn't find this board.";

    if (status === 500 || status === 502 || status === 503 || status === 504) {

      return "Guide isn't reachable right now. Try again in a moment.";

    }

  }

  return "Companion's quiet for a moment — try again shortly.";

}

async function isCompanionAuthError(error: unknown): Promise<boolean> {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg === "Unauthorized" || msg === "JWT expired") return true;
  }
  if (error && typeof error === "object" && "context" in error) {
    const status = (error as { context?: Response }).context?.status;
    if (status === 401 || status === 403) return true;
  }
  return false;
}



const VALID_STICKERS = new Set<BoardMarkStickerId>(BOARD_MARK_STICKER_OPTIONS.map((s) => s.id));

const VALID_SHAPES = new Set<BoardMarkShapeType>([
  "rect",
  "circle",
  "triangle",
  "line",
  "hexagon",
  "pentagon",
  "check",
  "star",
  "diamond",
  "arrow",
  "heart",
  "bubble",
  "cylinder",
]);

const VALID_COLOR_KEYS = new Set(Object.keys(BOARD_COLORS));

const VALID_LIBRARY_THEMES = new Set<string>(BOARD_IMAGE_THEMES);

const VALID_DIAGRAMS = new Set<BoardDiagramType>([
  "eisenhower",
  "checklist",
  "calendar",
  "zones",
  "timeline",
  "kanban",
  "gantt",
  "okrs",
  "five_s",
  "divider",
]);

function replyClaimsActionChanges(text: string): boolean {
  return /\b(I('ve| have)?\s+(updated|changed|removed|added|set|finalized)|I updated|I changed|I removed)\b/i.test(
    text,
  );
}

function finalizeActionAssistantReply(
  reply: string | undefined,
  replyWithoutAction: string | undefined,
  appliedCount: number,
): string {
  if (appliedCount > 0) {
    const raw = (reply ?? "").trim();
    return raw || `Done — I applied ${appliedCount} ${appliedCount === 1 ? "change" : "changes"} to your draft.`;
  }
  const neutral = (replyWithoutAction ?? reply ?? "").trim();
  if (neutral && !replyClaimsActionChanges(neutral)) return neutral;
  return "";
}

const CONFIRM_RE = /^(yes|yeah|yep|y|sure|ok|okay|do it|apply it|go ahead|please do|sounds good)\.?$/i;
const CANCEL_RE = /^(no|nope|cancel|don't|dont|stop)\.?$/i;

function replyClaimsBoardChanges(text: string): boolean {
  return /\b(I('ve| have)?\s+(set|added|placed|plotted|changed|created)|I added|I've set|I placed|I plotted)\b/i.test(
    text,
  );
}

function finalizeAssistantReply(
  reply: string | undefined,
  replyWithoutAction: string | undefined,
  appliedCount: number,
): string {
  if (appliedCount > 0) {
    const raw = (reply ?? "").trim();
    return raw || `Done — I applied ${appliedCount} ${appliedCount === 1 ? "change" : "changes"} to the board.`;
  }
  const neutral = (replyWithoutAction ?? reply ?? "").trim();
  if (neutral && !replyClaimsBoardChanges(neutral)) return neutral;
  return "";
}

type GuideAction = Record<string, unknown> & { type: string };

const FORBIDDEN_GUIDE_ACTION_TYPES = new Set([
  "analyze_workspace",
  "analyze",
  "extract_insights",
  "add_image",
  "add_upload_image",
  "add_user_image",
  "add_image_url",
  "upload_image",
]);

function isForbiddenGuideAction(action: unknown): boolean {
  if (!action || typeof action !== "object") return false;
  const type = (action as Record<string, unknown>).type;
  return typeof type === "string" && FORBIDDEN_GUIDE_ACTION_TYPES.has(type);
}

function isValidGuideAction(action: unknown): action is GuideAction {
  if (!action || typeof action !== "object") return false;
  if (isForbiddenGuideAction(action)) return false;
  const a = action as Record<string, unknown>;
  switch (a.type) {
    case "set_color": {
      if (typeof a.color_key !== "string") return false;
      const key = a.color_key.trim();
      return VALID_COLOR_KEYS.has(key) || normalizeBoardColorHex(key) !== null;
    }
    case "add_text":
      return typeof a.text === "string" && a.text.trim().length > 0;
    case "add_sticky":
      return true;
    case "add_diagram":
      return typeof a.diagram === "string" && VALID_DIAGRAMS.has(a.diagram as BoardDiagramType);
    case "add_sticker":
      return typeof a.sticker === "string" && VALID_STICKERS.has(a.sticker as BoardMarkStickerId);
    case "add_shape":
      return typeof a.shape === "string" && VALID_SHAPES.has(a.shape as BoardMarkShapeType);
    case "add_library_image":
      return (
        (typeof a.theme === "string" && VALID_LIBRARY_THEMES.has(a.theme)) ||
        (typeof a.keywords === "string" && a.keywords.trim().length > 0)
      );
    case "rename_board":
      return typeof a.title === "string" && a.title.trim().length > 0;
    case "delete_element":
      if (typeof a.element_index === "number" && Number.isFinite(a.element_index)) return true;
      if (typeof a.match_text === "string" && a.match_text.trim().length > 0) return true;
      if (typeof a.kind === "string" && a.kind.trim().length > 0) return true;
      return false;
    case "kanban_seed":
      return Array.isArray(a.columns) && a.columns.length > 0;
    case "gantt_seed":
      return Array.isArray(a.tasks) && a.tasks.length > 0;
    case "add_board":
    case "delete_board":
    case "duplicate_board":
    case "clear_board":
    case "start_draw_mode":
      return true;
    default:
      return false;
  }
}

function filterValidGuideActions(actions: unknown[]): GuideAction[] {
  return actions
    .map((action) => {
      if (!action || typeof action !== "object") return action;
      const raw = action as Record<string, unknown>;
      if (raw.type === "add_sticky_note" || raw.type === "sticky_note") {
        return { ...raw, type: "add_sticky" };
      }
      if (raw.type === "add_structure" || raw.type === "add_decal") {
        return {
          ...raw,
          type: "add_diagram",
          diagram: raw.diagram ?? raw.structure,
        };
      }
      if (raw.type === "add_statement") {
        return { ...raw, type: "add_text" };
      }
      const boardTitle =
        raw.board_title ?? raw.board ?? raw.board_name ?? raw.target_board;
      if (typeof boardTitle === "string" && boardTitle.trim() && raw.type !== "rename_board") {
        return { ...raw, board_title: boardTitle };
      }
      return action;
    })
    .filter(isValidGuideAction);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function actionSpecifiesBoard(action: GuideAction): boolean {
  if (typeof action.board_id === "string" && action.board_id.trim()) return true;
  return !!boardTitleNeedle(action);
}

function boardTitleNeedle(action: GuideAction): string | null {
  const fields = [action.board_title, action.board, action.board_name, action.target_board];
  for (const field of fields) {
    if (typeof field === "string" && field.trim()) return field.trim().toLowerCase();
  }
  return null;
}

function resolveTargetBoardId(
  action: GuideAction,
  activeBoardId: string,
  workspaceBoards: { id: string; title: string; role?: string }[],
): string | null {
  if (typeof action.board_id === "string") {
    const id = action.board_id.trim();
    if (workspaceBoards.some((b) => b.id === id)) return id;
  }
  const needle = boardTitleNeedle(action);
  if (needle) {
    const boardNum = needle.match(/^board\s*(\d+)$/);
    if (boardNum) {
      const idx = Number(boardNum[1]) - 1;
      if (idx >= 0 && idx < workspaceBoards.length) return workspaceBoards[idx].id;
    }
    const exact = workspaceBoards.find((b) => b.title.trim().toLowerCase() === needle);
    if (exact) return exact.id;
    const partial =
      workspaceBoards.find((b) => b.title.trim().toLowerCase().includes(needle)) ??
      workspaceBoards.find((b) => needle.includes(b.title.trim().toLowerCase()));
    if (partial) return partial.id;
    const words = needle.split(/[\s,&]+/).filter((w) => w.length > 2);
    if (words.length) {
      const ranked = workspaceBoards
        .map((b) => ({
          id: b.id,
          hits: words.filter((w) => b.title.trim().toLowerCase().includes(w)).length,
        }))
        .filter((r) => r.hits > 0)
        .sort((a, b) => b.hits - a.hits);
      if (ranked.length === 1 || (ranked.length > 1 && ranked[0].hits > ranked[1].hits)) {
        return ranked[0].id;
      }
    }
  }
  if (!actionSpecifiesBoard(action)) return activeBoardId || null;
  return null;
}

function getPendingTargetBoards(
  actions: unknown[],
  activeBoardId: string,
  workspaceBoards: { id: string; title: string; role?: string }[],
): { id: string; title: string }[] {
  const ids = new Set<string>();
  for (const raw of filterValidGuideActions(actions)) {
    if (raw.type === "add_board") continue;
    const id = resolveTargetBoardId(raw, activeBoardId, workspaceBoards);
    if (id && id !== activeBoardId) ids.add(id);
  }
  return [...ids].map((id) => {
    const board = workspaceBoards.find((b) => b.id === id);
    return { id, title: board?.title?.trim() || "that board" };
  });
}

function formatBoardSelectHint(boards: { title: string }[]): string {
  if (boards.length === 1) {
    return `Click "${boards[0].title}" in the board grid to select it, then tap Apply.`;
  }
  const names = boards.map((b) => `"${b.title}"`).join(", ");
  return `These changes target multiple boards (${names}). Click one board in the grid to select it, then tap Apply.`;
}

const CANVAS_GUIDE_ACTIONS = new Set([
  "clear_board",
  "start_draw_mode",
  "delete_element",
  "add_text",
  "add_sticky",
  "add_sticker",
  "add_shape",
  "add_library_image",
]);

type BoardGuideChatPanelProps = {
  mode: "vision" | "action";
  workspaceId: string;
  activeBoardId?: string;
  workspaceBoards?: { id: string; title: string; role?: string }[];
  editorRef?: RefObject<BoardCanvasHandle | null>;
  getEditor?: () => BoardCanvasHandle | null;
  getEditorForBoard?: (boardId: string) => BoardCanvasHandle | null | Promise<BoardCanvasHandle | null>;
  onBoardColorChange?: (boardId: string, colorKey: string) => Promise<void>;
  onRenameBoard?: (boardId: string, title: string) => Promise<void>;
  onAddBoard?: (title?: string) => Promise<void>;
  onDeleteBoard?: (boardId: string) => Promise<void>;
  onDuplicateBoard?: (boardId: string, title?: string) => Promise<void>;
  onSelectBoard?: (boardId: string) => void;
  getActiveBoardId?: () => string;
  actionMap?: AccountabilityMap | null;
  onActionMapChange?: (map: AccountabilityMap) => void;
  compact?: boolean;
  showHeader?: boolean;
  inSheet?: boolean;
};

export function BoardGuideChatPanel({
  mode,
  workspaceId,
  activeBoardId = "",
  workspaceBoards = [],
  editorRef,
  getEditor,
  getEditorForBoard,
  onBoardColorChange,
  onRenameBoard,
  onAddBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onSelectBoard,
  getActiveBoardId,
  actionMap = null,
  onActionMapChange,
  compact = false,
  showHeader = true,
  inSheet = false,
}: BoardGuideChatPanelProps) {
  const welcome = welcomeTurn(mode);
  const [messages, setMessages] = useState<ChatTurn[]>([welcome]);

  const [draft, setDraft] = useState("");

  const [sending, setSending] = useState(false);

  const [guideError, setGuideError] = useState<string | null>(null);

  const [lastApplied, setLastApplied] = useState(0);

  const [pendingGuideActions, setPendingGuideActions] = useState<(GuideAction | ActionGuideOperation)[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechRecognitionInstance | null>(null);
  const draftAtListenStartRef = useRef("");
  const sessionTranscriptRef = useRef("");
  const speechSupportedRef = useRef(
    typeof window !== "undefined" &&
      !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition),
  );

  const [listening, setListening] = useState(false);
  const [speechSupported] = useState(() => speechSupportedRef.current);

  const pendingTargetBoards = useMemo(
    () =>
      mode === "vision" && pendingGuideActions.length > 0
        ? getPendingTargetBoards(
            pendingGuideActions,
            getActiveBoardId?.() ?? activeBoardId,
            workspaceBoards,
          )
        : [],
    [activeBoardId, getActiveBoardId, mode, pendingGuideActions, workspaceBoards],
  );

  const scrollChatToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      if ((compact || inSheet) && container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
        return;
      }
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, [compact, inSheet]);

  useEffect(() => {
    if (compact && messages.length <= 1) return;
    scrollChatToBottom();
  }, [compact, messages, sending, guideError, lastApplied, pendingGuideActions.length, scrollChatToBottom]);

  useEffect(() => {
    return () => {
      speechRef.current?.abort();
      speechRef.current = null;
    };
  }, []);

  const commitSessionTranscript = useCallback(() => {
    const base = draftAtListenStartRef.current.trim();
    const spoken = sessionTranscriptRef.current.trim();
    if (!spoken) return;
    setDraft(base ? `${base} ${spoken}` : spoken);
    draftAtListenStartRef.current = base ? `${base} ${spoken}` : spoken;
  }, []);

  const stopListening = useCallback(() => {
    if (!speechRef.current) {
      setListening(false);
      return;
    }
    speechRef.current.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (!speechSupported) {
      toast.message("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      stopListening();
      return;
    }
    if (sending) return;

    const Ctor =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!Ctor) {
      toast.message("Voice input isn't supported in this browser.");
      return;
    }

    speechRef.current?.abort();
    const recognition = new Ctor();
    speechRef.current = recognition;
    draftAtListenStartRef.current = draft;
    sessionTranscriptRef.current = "";

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      sessionTranscriptRef.current = transcript;
      const base = draftAtListenStartRef.current.trim();
      const spoken = transcript.trim();
      if (!spoken) return;
      setDraft(base ? `${base} ${spoken}` : spoken);
    };

    recognition.onerror = () => {
      commitSessionTranscript();
      setListening(false);
      speechRef.current = null;
    };

    recognition.onend = () => {
      commitSessionTranscript();
      setListening(false);
      speechRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      toast.message("Could not start microphone.");
      setListening(false);
    }
  }, [commitSessionTranscript, draft, listening, sending, speechSupported, stopListening]);

  useEffect(() => {
    if (!workspaceId) {
      setMessages([welcome]);
      return;
    }
    setMessages(loadStoredChat(workspaceId, mode) ?? [welcome]);
  }, [workspaceId, mode, welcome]);

  useEffect(() => {
    if (!workspaceId) return;
    localStorage.setItem(chatStorageKey(workspaceId, mode), JSON.stringify(messages));
  }, [messages, workspaceId, mode]);



  const applyVisionActions = useCallback(
    async (actions: unknown[]): Promise<number> => {
      const currentActiveBoardId = getActiveBoardId?.() ?? activeBoardId;
      if (!currentActiveBoardId) {
        console.error("Guide applyActions: missing activeBoardId");
        return 0;
      }

      let applied = 0;
      const usedLibraryImageUrls = new Set<string>();

      for (const raw of filterValidGuideActions(actions)) {
        const action = raw;
        const type = action.type;

        if (type === "add_board" && onAddBoard) {
          try {
            await onAddBoard(typeof action.title === "string" ? action.title.trim() : undefined);
            applied += 1;
          } catch (err) {
            console.error("Guide applyActions: add_board failed", err);
          }
          continue;
        }

        const targetBoardId = resolveTargetBoardId(action, currentActiveBoardId, workspaceBoards);
        if (!targetBoardId) continue;

        try {
          if (type === "delete_board" && onDeleteBoard) {
            const board = workspaceBoards.find((b) => b.id === targetBoardId);
            if (board?.role === "plan") continue;
            await onDeleteBoard(targetBoardId);
            applied += 1;
            continue;
          }

          if (type === "duplicate_board" && onDuplicateBoard) {
            await onDuplicateBoard(
              targetBoardId,
              typeof action.title === "string" ? action.title.trim() : undefined,
            );
            applied += 1;
            continue;
          }

          if (type === "set_color" && typeof action.color_key === "string" && onBoardColorChange) {
            const rawKey = action.color_key.trim();
            const colorKey = normalizeBoardColorHex(rawKey) ?? (VALID_COLOR_KEYS.has(rawKey) ? rawKey : null);
            if (!colorKey) continue;
            await onBoardColorChange(targetBoardId, colorKey);
            applied += 1;
            continue;
          }

          if (type === "rename_board" && typeof action.title === "string" && onRenameBoard) {
            const nextTitle = action.title.trim();
            if (!nextTitle) continue;
            await onRenameBoard(targetBoardId, nextTitle);
            applied += 1;
            continue;
          }

          if (targetBoardId !== currentActiveBoardId && CANVAS_GUIDE_ACTIONS.has(type)) {
            continue;
          }

          const editor = getEditor?.() ?? editorRef?.current ?? null;

          if (!editor) {
            console.error("Guide applyActions: editor ref missing for", type, "on board", targetBoardId);
            continue;
          }

          if (type === "clear_board") {
            editor.resetBoard();
            applied += 1;
            continue;
          }

          if (type === "start_draw_mode") {
            editor.startDrawMode();
            applied += 1;
            continue;
          }

          if (type === "delete_element") {
            const removed = editor.removeElements({
              element_index: typeof action.element_index === "number" ? action.element_index : undefined,
              match_text: typeof action.match_text === "string" ? action.match_text : undefined,
              kind: typeof action.kind === "string" ? action.kind : undefined,
              sticker: typeof action.sticker === "string" ? action.sticker : undefined,
              shape: typeof action.shape === "string" ? action.shape : undefined,
              structure: typeof action.structure === "string" ? action.structure : undefined,
              all: action.all === true,
            });
            applied += removed;
            continue;
          }

          if (type === "kanban_seed" && Array.isArray(action.columns)) {
            const titles = (action.columns as { title?: string }[])
              .map((c) => (typeof c.title === "string" ? c.title : ""))
              .filter(Boolean);
            editor.addDiagramOverlay("kanban", 0.08, 0.42, 0.84, 0.5, titles.length ? titles : undefined);
            applied += 1;
            continue;
          }

          if (type === "gantt_seed" && Array.isArray(action.tasks)) {
            const names = (action.tasks as { name?: string }[])
              .map((t) => (typeof t.name === "string" ? t.name : ""))
              .filter(Boolean);
            editor.addDiagramOverlay("gantt", 0.1, 0.45, 0.8, 0.42, names.length ? names : undefined);
            applied += 1;
            continue;
          }

          if (type === "add_text" && typeof action.text === "string") {
            editor.addTextNormalized(
              action.text,
              clamp01(typeof action.x === "number" ? action.x : 0.5),
              clamp01(typeof action.y === "number" ? action.y : 0.12),
              typeof action.font_size === "number" ? action.font_size : 40,
              typeof action.color === "string" ? action.color : "#000000",
            );
            applied += 1;
            continue;
          }

          if (type === "add_sticky") {
            editor.addStickyNoteAt(
              "",
              clamp01(typeof action.x === "number" ? action.x : 0.12),
              clamp01(typeof action.y === "number" ? action.y : 0.35),
              typeof action.fill === "string" ? action.fill : "#FFF9C4",
            );
            applied += 1;
            continue;
          }

          if (type === "add_diagram" && typeof action.diagram === "string") {
            const diagram = action.diagram as BoardDiagramType;
            const items = Array.isArray(action.items)
              ? action.items.filter((i): i is string => typeof i === "string")
              : [];
            editor.addDiagramOverlay(
              diagram,
              clamp01(typeof action.x === "number" ? action.x : 0.52),
              clamp01(typeof action.y === "number" ? action.y : 0.52),
              clamp01(typeof action.w === "number" ? action.w : 0.4),
              clamp01(typeof action.h === "number" ? action.h : 0.34),
              items,
              typeof action.accent === "string" ? action.accent : "#2563EB",
            );
            applied += 1;
            continue;
          }

          if (type === "add_sticker" && typeof action.sticker === "string") {
            editor.addStickerAt(
              action.sticker as BoardMarkStickerId,
              clamp01(typeof action.x === "number" ? action.x : 0.5),
              clamp01(typeof action.y === "number" ? action.y : 0.5),
            );
            applied += 1;
            continue;
          }

          if (type === "add_shape" && typeof action.shape === "string") {
            editor.addShapeAt(
              action.shape as BoardMarkShapeType,
              clamp01(typeof action.x === "number" ? action.x : 0.5),
              clamp01(typeof action.y === "number" ? action.y : 0.5),
            );
            applied += 1;
            continue;
          }

          if (type === "add_library_image" && (typeof action.theme === "string" || typeof action.keywords === "string")) {
            const library = await loadBoardImageLibrary();
            let pool = typeof action.theme === "string" ? filterLibraryByTheme(library, action.theme) : [...library];
            if (typeof action.keywords === "string") {
              const words = action.keywords
                .toLowerCase()
                .split(/[\s,]+/)
                .filter((w) => w.length > 2);
              if (words.length) {
                const ranked = pool
                  .map((img) => {
                    const hay = `${img.description} ${img.category} ${(img.tags ?? []).join(" ")}`.toLowerCase();
                    return { img, hits: words.filter((w) => hay.includes(w)).length };
                  })
                  .filter((r) => r.hits > 0)
                  .sort((a, b) => b.hits - a.hits);
                if (ranked.length) pool = ranked.map((r) => r.img);
              }
            }
            if (!pool.length) continue;
            const uniquePool = [...new Map(pool.map((img) => [img.url, img])).values()];
            let picks = uniquePool;
            if (typeof action.image_index === "number" && Number.isFinite(action.image_index)) {
              const idx = Math.max(0, Math.min(uniquePool.length - 1, Math.round(action.image_index)));
              picks = [uniquePool[idx]];
            } else {
              const count =
                typeof action.count === "number" ? Math.max(1, Math.min(3, Math.round(action.count))) : 1;
              const fresh = uniquePool.filter((img) => !usedLibraryImageUrls.has(img.url));
              const source = fresh.length ? fresh : uniquePool;
              picks = source.slice(0, Math.min(count, source.length));
            }
            if (!picks.length) continue;
            const baseX = clamp01(typeof action.x === "number" ? action.x : 0.5);
            const baseY = clamp01(typeof action.y === "number" ? action.y : 0.5);
            for (let i = 0; i < picks.length; i += 1) {
              usedLibraryImageUrls.add(picks[i].url);
              await editor.addImageFromUrl(picks[i].url, {
                normX: clamp01(baseX + i * 0.08),
                normY: clamp01(baseY + (i % 2) * 0.06),
              });
              applied += 1;
            }
          }
        } catch (error) {
          console.error("Failed to apply guide action", action, error);
        }
      }

      return applied;
    },
    [activeBoardId, editorRef, getActiveBoardId, getEditor, onAddBoard, onBoardColorChange, onDeleteBoard, onDuplicateBoard, onRenameBoard, workspaceBoards],
  );

  const applyActionOperations = useCallback(
    async (ops: unknown[]): Promise<number> => {
      if (!actionMap || !onActionMapChange) return 0;
      const valid = filterValidActionGuideOperations(ops, actionMap);
      if (!valid.length) return 0;
      const { map: next, applied } = applyActionGuideOperations(actionMap, valid);
      if (applied > 0) onActionMapChange(next);
      return applied;
    },
    [actionMap, onActionMapChange],
  );

  const applyPending = useCallback(
    async (actions: (GuideAction | ActionGuideOperation)[]) => {
      if (mode === "action") return applyActionOperations(actions);
      return applyVisionActions(actions);
    },
    [applyActionOperations, applyVisionActions, mode],
  );



  const clearChat = useCallback(() => {
    setMessages([welcome]);
    setLastApplied(0);
    setPendingGuideActions([]);
    setGuideError(null);

    if (workspaceId) {
      localStorage.setItem(chatStorageKey(workspaceId, mode), JSON.stringify([welcome]));
    }

    toast.message("Chat cleared");
  }, [mode, welcome, workspaceId]);



  const applyPendingGuideActions = useCallback(async () => {
    if (pendingGuideActions.length === 0 || sending) return;
    setSending(true);
    setGuideError(null);
    setLastApplied(0);
    try {
      const currentActiveBoardId = getActiveBoardId?.() ?? activeBoardId;
      const offTargetBoards =
        mode === "vision"
          ? getPendingTargetBoards(pendingGuideActions, currentActiveBoardId, workspaceBoards)
          : [];

      if (offTargetBoards.length === 1 && onSelectBoard && offTargetBoards[0].id !== currentActiveBoardId) {
        onSelectBoard(offTargetBoards[0].id);
        const deadline = Date.now() + 1200;
        while (Date.now() < deadline) {
          const editor = getEditorForBoard?.(offTargetBoards[0].id) ?? getEditor?.() ?? editorRef?.current ?? null;
          if (editor) break;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      const appliedCount = await applyPending(pendingGuideActions);
      setPendingGuideActions([]);
      setLastApplied(appliedCount);
      if (appliedCount > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              mode === "action"
                ? `Done — I applied ${appliedCount} ${appliedCount === 1 ? "change" : "changes"} to your draft.`
                : `Done — I applied ${appliedCount} ${appliedCount === 1 ? "change" : "changes"} to the board.`,
          },
        ]);
      } else {
        const boardHint =
          offTargetBoards.length > 0 ? ` ${formatBoardSelectHint(offTargetBoards)}` : "";
        setGuideError(
          mode === "action"
            ? "I couldn't apply those changes to your draft. Try again."
            : `I couldn't apply those changes.${boardHint || " Click the board you want to edit in the grid, then try Apply again."}`,
        );
      }
    } finally {
      setSending(false);
    }
  }, [
    activeBoardId,
    applyPending,
    editorRef,
    getActiveBoardId,
    getEditor,
    getEditorForBoard,
    mode,
    onSelectBoard,
    pendingGuideActions,
    sending,
    workspaceBoards,
  ]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();

    if (!text || sending) return;
    if (mode === "vision" && !activeBoardId) return;

    if (listening) stopListening();

    setDraft("");

    setLastApplied(0);
    setGuideError(null);

    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: text }];

    setMessages(nextMessages);

    if (CANCEL_RE.test(text) && pendingGuideActions.length > 0) {
      setPendingGuideActions([]);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No problem — tell me when you want to add something." },
      ]);
      return;
    }

    if (CONFIRM_RE.test(text) && pendingGuideActions.length > 0) {
      await applyPendingGuideActions();
      return;
    }

    setSending(true);

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      const session =
        refreshData.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setGuideError("I could not reach the guide right now. Please refresh or sign in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        mode === "action" ? "board-guide-chat" : "board-design-chat",
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body:
            mode === "action"
              ? {
                  mode: "action",
                  workspace_id: workspaceId,
                  message: text,
                  history: messages
                    .filter((m) => m.role === "user" || m.role === "assistant")
                    .slice(-8),
                  action_map: actionMap,
                }
              : {
                  board_id: activeBoardId,
                  workspace_id: workspaceId,
                  message: text,
                  history: nextMessages.filter((m) => m.role === "user" || m.role === "assistant").slice(-8),
                },
        },
      );

      if (error) throw error;

      const payload = data as {
        reply?: string;
        reply_without_action?: string;
        actions?: unknown[];
        proposed_actions?: unknown[];
        error?: string;
      };

      if (payload?.error && !payload.reply) {
        throw new Error(payload.error);
      }

      const actions = Array.isArray(payload.actions) ? payload.actions : [];
      const proposed = Array.isArray(payload.proposed_actions) ? payload.proposed_actions : [];

      const combined =
        mode === "action"
          ? filterValidActionGuideOperations([...proposed, ...actions], actionMap)
          : [...filterValidGuideActions(proposed), ...filterValidGuideActions(actions)];

      if (combined.length > 0) {
        setPendingGuideActions(combined);
      } else {
        setPendingGuideActions([]);
      }

      setLastApplied(0);

      const finalReply =
        mode === "action"
          ? (() => {
              const base = finalizeActionAssistantReply(payload.reply, payload.reply_without_action, 0);
              if (combined.length > 0 && !/apply that/i.test(base)) {
                return `${base} Want me to apply that?`;
              }
              return base;
            })()
          : finalizeAssistantReply(payload.reply, payload.reply_without_action, 0);

      if (!finalReply.trim()) {
        setGuideError("Guide couldn't respond right now. Try again.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: finalReply }]);

    } catch (err) {

      if (await isCompanionAuthError(err)) {
        console.warn("Guide auth error", err);
        setGuideError("I could not reach the guide right now. Please refresh or sign in again.");
      } else {
        const message = await companionErrorMessage(err);
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      }

    } finally {

      setSending(false);

    }

  }, [
    actionMap,
    activeBoardId,
    applyPendingGuideActions,
    draft,
    listening,
    messages,
    mode,
    pendingGuideActions,
    sending,
    stopListening,
    workspaceId,
  ]);



  return (

    <div
      className={cn(
        "flex flex-col",
        inSheet ? "min-h-0 flex-1" : compact ? "min-h-[280px]" : "min-h-0 flex-1",
      )}
    >
      {showHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-300/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Guide</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 px-2 text-xs font-medium text-stone-600 hover:text-red-700"
            onClick={clearChat}
            disabled={messages.length <= 1 && messages[0]?.content === welcome.content}
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear chat
          </Button>
        </div>
      ) : null}



      <div

        ref={scrollRef}

        className={cn(
          "flex flex-col gap-2 overflow-y-auto p-3",
          inSheet ? "min-h-0 flex-1" : compact ? "max-h-[36vh]" : "min-h-0 flex-1",
        )}

      >

        {messages.map((m, i) => (

          <div

            key={`${m.role}-${i}`}

            className={cn(

              "rounded-lg px-3 py-2 text-xs leading-relaxed",

              m.role === "user"

                ? "ml-3 bg-stone-900 text-stone-50"

                : "mr-1 border border-stone-300/80 bg-[#faf8f5] text-stone-800",

            )}

          >

            {m.content}

          </div>

        ))}

        {lastApplied > 0 ? (
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-stone-600">
            <PenLine className="h-3 w-3" />
            {mode === "action"
              ? `Done — applied ${lastApplied} ${lastApplied === 1 ? "change" : "changes"} to your draft`
              : `Done — applied ${lastApplied} ${lastApplied === 1 ? "change" : "changes"} to the board`}
          </p>
        ) : null}

        {pendingTargetBoards.length > 0 ? (
          <p className="rounded-lg border border-sky-300/80 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-950">
            <strong>Before you apply:</strong> {formatBoardSelectHint(pendingTargetBoards)}
          </p>
        ) : null}

        {pendingGuideActions.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-stone-300 bg-[#faf8f5] text-[10px]"
              disabled={sending}
              onClick={() => void applyPendingGuideActions()}
            >
              Apply suggestion
            </Button>
            <span className="text-[10px] text-stone-500">or reply yes</span>
          </div>
        ) : null}

        {sending ? (

          <p className="flex items-center gap-2 text-xs text-stone-500">

            <Loader2 className="h-3.5 w-3.5 animate-spin" />

            Plotting…

          </p>

        ) : null}

        {guideError ? (
          <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {guideError}
          </p>
        ) : null}

        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />

      </div>

      <form

        className="flex shrink-0 gap-2 border-t border-stone-300/60 bg-[#f3f0eb] p-2"

        onSubmit={(e) => {

          e.preventDefault();

          void sendMessage();

        }}

      >

        <Input

          value={draft}

          onChange={(e) => setDraft(e.target.value)}

          placeholder={mode === "action" ? "" : "Ask what to add, arrange or plan"}

          className="h-9 min-w-0 flex-1 border-stone-300 bg-[#faf8f5] text-xs"

          disabled={sending}

          onFocus={() => {
            if (compact || inSheet) {
              requestAnimationFrame(() => {
                const container = scrollRef.current;
                if (container) {
                  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                }
              });
            }
          }}

        />

        {speechSupported ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn(
              "h-9 w-9 shrink-0 border-stone-300 bg-[#faf8f5]",
              listening && "border-red-400 bg-red-50 text-red-600",
            )}
            disabled={sending}
            aria-label={listening ? "Stop dictation" : "Dictate message"}
            onClick={toggleListening}
          >
            <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
          </Button>
        ) : null}

        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-stone-900" disabled={sending || !draft.trim()}>

          <Send className="h-4 w-4" />

        </Button>

      </form>

    </div>

  );

}

type BoardCompanionPanelProps = {
  workspaceId: string;
  activeBoardId: string;
  workspaceBoards?: { id: string; title: string; role?: string }[];
  editorRef: RefObject<BoardCanvasHandle | null>;
  getEditor?: () => BoardCanvasHandle | null;
  getEditorForBoard?: (boardId: string) => BoardCanvasHandle | null | Promise<BoardCanvasHandle | null>;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  onRenameBoard?: (boardId: string, title: string) => Promise<void>;
  onAddBoard?: (title?: string) => Promise<void>;
  onDeleteBoard?: (boardId: string) => Promise<void>;
  onDuplicateBoard?: (boardId: string, title?: string) => Promise<void>;
  onSelectBoard?: (boardId: string) => void;
  getActiveBoardId?: () => string;
  compact?: boolean;
};

export function BoardCompanionPanel(props: BoardCompanionPanelProps) {
  return <BoardGuideChatPanel mode="vision" {...props} />;
}

