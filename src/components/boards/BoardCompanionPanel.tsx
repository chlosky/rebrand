import { useCallback, useEffect, useRef, useState } from "react";

import type { RefObject } from "react";

import { Eraser, Loader2, Mic, PenLine, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { BOARD_COLORS } from "@/lib/boards/colors";
import type { AccountabilityMap } from "@/lib/boards/accountabilityMap";
import {
  applyActionGuideOperations,
  filterValidActionGuideOperations,
  type ActionGuideOperation,
} from "@/lib/boards/applyActionGuideOperations";

import type { BoardCanvasHandle, BoardDiagramType } from "@/components/boards/BoardCanvasEditor";

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
  "Tell me the feeling of this board — I'll plot color, words, and structures with you.";

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

        return "Guide needs an active Palette Plotting Premium plan.";

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



const VALID_COLOR_KEYS = new Set(Object.keys(BOARD_COLORS));

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



const VISION_FALLBACK_ASK_REPLY =
  "I can help with that. What would you like me to add first: a Statement, a Sticky note, a Checklist, or a Priority grid?";

const ACTION_FALLBACK_ASK_REPLY =
  "I can help with that. What would you like to adjust — actions, reminder channels, or timing?";

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
  return ACTION_FALLBACK_ASK_REPLY;
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
    return raw || `Done — I added ${appliedCount} ${appliedCount === 1 ? "piece" : "pieces"} to the board.`;
  }
  const neutral = (replyWithoutAction ?? reply ?? "").trim();
  if (neutral && !replyClaimsBoardChanges(neutral)) return neutral;
  return VISION_FALLBACK_ASK_REPLY;
}

type GuideAction = Record<string, unknown> & { type: string };

function isValidGuideAction(action: unknown): action is GuideAction {
  if (!action || typeof action !== "object") return false;
  const a = action as Record<string, unknown>;
  switch (a.type) {
    case "set_color":
      return typeof a.color_key === "string" && VALID_COLOR_KEYS.has(a.color_key);
    case "add_text":
      return typeof a.text === "string" && a.text.trim().length > 0;
    case "add_sticky":
      return typeof a.text === "string" && a.text.trim().length > 0;
    case "add_diagram":
      return typeof a.diagram === "string" && VALID_DIAGRAMS.has(a.diagram as BoardDiagramType);
    default:
      return false;
  }
}

function filterValidGuideActions(actions: unknown[]): GuideAction[] {
  return actions.filter(isValidGuideAction);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}



type BoardGuideChatPanelProps = {
  mode: "vision" | "action";
  workspaceId: string;
  activeBoardId?: string;
  editorRef?: RefObject<BoardCanvasHandle | null>;
  onBoardColorChange?: (boardId: string, colorKey: string) => Promise<void>;
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
  editorRef,
  onBoardColorChange,
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
      if (!activeBoardId) {
        console.error("Guide applyActions: missing activeBoardId");
        return 0;
      }

      const editor = editorRef?.current;
      let applied = 0;

      for (const raw of filterValidGuideActions(actions)) {
        const action = raw;
        const type = action.type;

        try {
          if (type === "set_color" && typeof action.color_key === "string" && onBoardColorChange) {
            await onBoardColorChange(activeBoardId, action.color_key);
            applied += 1;
            continue;
          }

          if (!editor) {
            console.error("Guide applyActions: editor ref missing for", type);
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

          if (type === "add_sticky" && typeof action.text === "string") {
            editor.addStickyNoteAt(
              action.text,
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
          }
        } catch (error) {
          console.error("Failed to apply guide action", action, error);
        }
      }

      return applied;
    },
    [activeBoardId, editorRef, onBoardColorChange],
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
                : `Done — I added ${appliedCount} ${appliedCount === 1 ? "piece" : "pieces"} to the board.`,
          },
        ]);
      } else {
        setGuideError(
          mode === "action"
            ? "I couldn't apply those changes to your draft. Try again."
            : "I couldn't apply those changes to the board. Try again.",
        );
      }
    } finally {
      setSending(false);
    }
  }, [applyPending, mode, pendingGuideActions, sending]);

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
                  history: nextMessages.filter((m) => m.role === "user" || m.role === "assistant").slice(-8),
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
          ? finalizeActionAssistantReply(payload.reply, payload.reply_without_action, 0)
          : finalizeAssistantReply(payload.reply, payload.reply_without_action, 0);

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
        <div className="flex shrink-0 border-b border-stone-300/60 px-3 py-2">
          {mode === "action" ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Guide</p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-600">
                Ask the guide to clean up actions, adjust reminders, or explain the plan.
              </p>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 justify-start gap-2 px-2 text-xs font-medium text-stone-600 hover:text-red-700",
              mode === "action" ? "w-auto shrink-0" : "w-full",
            )}
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
              : `Done — added ${lastApplied} ${lastApplied === 1 ? "piece" : "pieces"} to the board`}
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

          placeholder={mode === "action" ? "Fewer texts, rename a plan, explain channels…" : "The vibe, the goal, the feeling…"}

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
  editorRef: RefObject<BoardCanvasHandle | null>;
  onBoardColorChange: (boardId: string, colorKey: string) => Promise<void>;
  compact?: boolean;
};

export function BoardCompanionPanel(props: BoardCompanionPanelProps) {
  return <BoardGuideChatPanel mode="vision" {...props} />;
}

