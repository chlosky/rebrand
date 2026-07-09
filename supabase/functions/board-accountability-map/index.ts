import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";
import { BOARDS_AI_SAFETY_POLICY, ACTION_MAP_EXTRACTION_POLICY, screenBoardsCorpus } from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BoardRow = {
  id: string;
  title: string;
  role: string;
  color_key: string;
  layout_json: unknown;
  sort_order: number;
};

function isJunkBoardText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  if (t === "untitled") return true;
  if (/^\+?\s*add\s*line\.?$/.test(t)) return true;
  if (/^add\s*(row|line)\.?$/.test(t)) return true;
  if (/add\s*line/.test(t) && t.length <= 32) return true;
  return false;
}

function collectBoardPayloadFromLayout(layout: unknown): {
  text_elements: string[];
  sticky_note_text: string[];
  checklist_rows: string[];
  structure_labels: string[];
  section_labels: string[];
  dates: string[];
  image_count: number;
  image_tags: string[];
  image_descriptions: string[];
} {
  const text_elements: string[] = [];
  const sticky_note_text: string[] = [];
  const checklist_rows: string[] = [];
  const structure_labels: string[] = [];
  const section_labels: string[] = [];
  const dates: string[] = [];
  const image_tags: string[] = [];
  const image_descriptions: string[] = [];
  let image_count = 0;

  const walk = (items: unknown[]) => {
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const role = String(o.structureRole ?? "");
      const markKind = String(o.markKind ?? "").toLowerCase();
      if (role === "add-row" || role === "add-button" || role === "checkbox" || role === "checkmark") continue;

      if (typeof o.text === "string") {
        const t = o.text.trim();
        if (t.length > 1 && !isJunkBoardText(t)) {
          if (markKind === "sticky") sticky_note_text.push(t);
          else if (role === "label" || role === "priority-left" || role === "priority-right") {
            checklist_rows.push(t);
            structure_labels.push(t);
          } else if (role === "calendar-day-number" || role === "calendar-title") dates.push(t);
          else if (o.structureId || o.structureType) structure_labels.push(t);
          else text_elements.push(t);
        }
      }

      const type = String(o.type ?? "").toLowerCase();
      if (type === "image" || markKind === "image" || markKind === "image-frame" || markKind === "frame-image") {
        image_count += 1;
        const src = typeof o.src === "string" ? o.src : "";
        if (src) image_descriptions.push(src.split("/").pop()?.replace(/\.\w+$/, "") ?? src);
        const theme = typeof o.theme === "string" ? o.theme : typeof o.libraryTheme === "string" ? o.libraryTheme : "";
        if (theme) image_tags.push(theme);
      }
      if (Array.isArray(o.objects)) walk(o.objects);
    }
  };

  const objs = (layout as { objects?: unknown[] })?.objects;
  if (Array.isArray(objs)) walk(objs);
  return {
    text_elements,
    sticky_note_text,
    checklist_rows,
    structure_labels,
    section_labels,
    dates,
    image_count,
    image_tags: [...new Set(image_tags)].slice(0, 16),
    image_descriptions: [...new Set(image_descriptions)].slice(0, 16),
  };
}

function focusBoards(boards: BoardRow[]) {
  return [...boards]
    .filter((b) => b.role === "focus")
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3);
}

function defaultReviewDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

function isGenericPlaceholderTitle(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return false;
  if (t === "review board" || t === "review cycle" || t === "daily gratitude" || t === "progress") return true;
  if (t === "accountability review" || t === "focus plan" || t === "becoming plan") return true;
  if (/^review\s+(the\s+)?(focus\s+)?board/.test(t)) return true;
  if (/^review\s+\w+(\s+board)?$/.test(t)) return true;
  if (/^weekly\s+review/.test(t)) return true;
  if (/^check\s+(in\s+on\s+)?(the\s+)?(focus\s+)?board/.test(t)) return true;
  if (/^check\s+(your\s+)?board/.test(t)) return true;
  if (/^progress(\s+toward|\s+on|\s+with|\s+in)?\s/.test(t)) return true;
  if (/^more\s+/.test(t)) return true;
  if (/^reflect\s+on/.test(t)) return true;
  if (/stay\s+aligned/.test(t)) return true;
  if (/continue\s+(your\s+)?journey/.test(t)) return true;
  if (/return\s+to\s+(your\s+)?(vision|board|practice)/.test(t)) return true;
  if (/open\s+the\s+app/.test(t)) return true;
  if (/think\s+about/.test(t)) return true;
  if (t === "become better") return true;
  return false;
}

function naturalizeTitle(title: string): string {
  const t = title
    .replace(/\+?\s*add\s*line/gi, "")
    .replace(/\badd\s*line\b/gi, "")
    .replace(/^Monthly goal:\s*/i, "")
    .replace(/^Weekly touchpoint\s*[—-]\s*/i, "")
    .replace(/^From The Plan:\s*/i, "")
    .replace(/^5-minute action toward\s*/i, "")
    .replace(/\s*[—-]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (isJunkBoardText(t) || isGenericPlaceholderTitle(t)) return "";
  return t;
}

function sanitizeNodeTitle(title: string, fallback: string): string {
  const cleaned = naturalizeTitle(title);
  return cleaned || fallback;
}

function normalizeSingleReminderChannel(raw: unknown): {
  calendar: boolean;
  email: boolean;
  sms: boolean;
  reminder_type: "calendar" | "email" | "sms";
} {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (o.reminder_type === "calendar" || o.reminder_type === "email" || o.reminder_type === "sms") {
      const t = o.reminder_type;
      return {
        calendar: t === "calendar",
        email: t === "email",
        sms: t === "sms",
        reminder_type: t,
      };
    }
    const flags = {
      calendar: o.calendar === true,
      email: o.email === true,
      sms: o.sms === true,
    };
    if (flags.sms) return { calendar: false, email: false, sms: true, reminder_type: "sms" };
    if (flags.calendar) return { calendar: true, email: false, sms: false, reminder_type: "calendar" };
    return { calendar: false, email: true, sms: false, reminder_type: "email" };
  }
  return { calendar: false, email: true, sms: false, reminder_type: "email" };
}

function scrubMapTitles(map: Record<string, unknown>): Record<string, unknown> {
  const plans = Array.isArray(map.plans)
    ? (map.plans as Record<string, unknown>[]).map((p) => ({
        ...p,
        title: sanitizeNodeTitle(String(p.title ?? ""), ""),
      }))
    : [];
  const actions = Array.isArray(map.actions)
    ? (map.actions as Record<string, unknown>[]).map((a) => {
        const reminder =
          a.reminder && typeof a.reminder === "object"
            ? (a.reminder as Record<string, unknown>)
            : null;
        const channelsRaw = reminder?.channels ?? a.channels ?? a.reminder_type;
        const smsText = reminder?.smsText ?? reminder?.sms_text ?? a.sms_text ?? null;
        const normalized = normalizeSingleReminderChannel(channelsRaw);
        const rawTitle = String(a.title ?? "");
        return {
          ...a,
          title: isGenericPlaceholderTitle(rawTitle) ? "" : sanitizeNodeTitle(rawTitle, ""),
          status: isGenericPlaceholderTitle(rawTitle) ? "rejected" : a.status,
          channels: {
            calendar: normalized.calendar,
            email: normalized.email,
            sms: normalized.sms,
          },
          reminder_type: normalized.reminder_type,
          sms_text: typeof smsText === "string" ? smsText.slice(0, 70) : null,
          reminder_enabled: reminder?.enabled !== false,
        };
      })
    : [];
  return { ...map, plans, actions };
}

function focusBoardTitle(board: BoardRow): string {
  const cleaned = naturalizeTitle(board.title);
  return cleaned || board.title.trim() || "Focus board";
}

type BoardPayloadRow = ReturnType<typeof collectBoardPayloadFromLayout> & {
  board_id: string;
  board_title: string;
  role: string;
  color_key: string;
};

function actionSeedsForBoard(boardId: string, boardPayload: BoardPayloadRow[]): string[] {
  const board = boardPayload.find((b) => b.board_id === boardId);
  if (!board) return [];
  const seeds: string[] = [];
  for (const raw of [
    ...board.sticky_note_text,
    ...board.checklist_rows,
    ...board.text_elements,
    ...board.structure_labels,
  ]) {
    const cleaned = naturalizeTitle(raw);
    if (cleaned && !seeds.includes(cleaned)) seeds.push(cleaned);
    if (seeds.length >= 3) break;
  }
  return seeds;
}

function buildStarterPlansAndActions(
  focusList: BoardRow[],
  boardPayload: BoardPayloadRow[],
): { plans: Record<string, unknown>[]; actions: Record<string, unknown>[] } {
  const plans: Record<string, unknown>[] = [];
  const actions: Record<string, unknown>[] = [];

  focusList.forEach((board, index) => {
    const focusId = `focus-${index + 1}`;
    const planId = `plan-${index + 1}-1`;
    const boardTitle = focusBoardTitle(board);
    const seeds = actionSeedsForBoard(board.id, boardPayload);
    const actionTitles =
      seeds.length > 0
        ? seeds.slice(0, 2)
        : [`${boardTitle} check-in`, `Plan one priority for ${boardTitle}`];

    plans.push({
      id: planId,
      focus_id: focusId,
      title: `${boardTitle} plan`,
      cadence: "weekly",
      remind_day_of_month: null,
      remind_day_of_week: "monday",
      remind_time: "09:00",
      status: "suggested",
    });

    actionTitles.forEach((title, actionIndex) => {
      const actionId = `action-${index + 1}-${actionIndex + 1}`;
      actions.push({
        id: actionId,
        plan_id: planId,
        title,
        step_type: "task",
        cadence: "weekly",
        remind_date: null,
        remind_day_of_month: null,
        remind_day_of_week: "monday",
        remind_time: "09:00",
        status: "suggested",
        kind: "action",
        confidence: seeds.length > 0 ? 0.55 : 0.4,
        source_evidence:
          seeds.length > 0 ? `From board content: ${title}` : `From board title: ${boardTitle}`,
        reminder_enabled: true,
        reminder_type: "email",
        channels: { calendar: false, email: true, sms: false },
        sms_text: null,
      });
    });
  });

  return { plans, actions };
}

function focusesFromBoards(focusList: BoardRow[]): Record<string, unknown>[] {
  return focusList.map((board, index) => ({
    id: `focus-${index + 1}`,
    board_id: board.id,
    title: focusBoardTitle(board),
  }));
}

function buildGuaranteedDraftMap(
  focusList: BoardRow[],
  boardPayload: BoardPayloadRow[],
  partial?: Record<string, unknown>,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const starter = buildStarterPlansAndActions(focusList, boardPayload);
  const reviewRaw = (partial?.review_cycle ?? partial?.quarterly_reset) as Record<string, unknown> | undefined;

  return {
    version: 2 as const,
    summary:
      typeof partial?.summary === "string" && partial.summary.trim()
        ? partial.summary.trim()
        : "Palette drafted this from your workspace. Review before finalizing.",
    analysis_status: "draft_ready",
    analyzed_at: now,
    edited_at: null,
    finalized_at: null,
    meta_confidence: typeof partial?.meta_confidence === "number" ? partial.meta_confidence : null,
    finalized: false,
    review_cycle: {
      title: typeof reviewRaw?.title === "string" ? reviewRaw.title : "Review cycle",
      remind_date:
        typeof reviewRaw?.remind_date === "string" ? reviewRaw.remind_date : defaultReviewDate(),
      remind_time: typeof reviewRaw?.remind_time === "string" ? reviewRaw.remind_time : "09:00",
    },
    focuses: focusesFromBoards(focusList),
    plans: starter.plans,
    actions: starter.actions,
    unmapped_items: Array.isArray(partial?.unmapped_items) ? partial.unmapped_items : [],
    reminders: [],
  };
}

function hasActivePlansAndActions(map: Record<string, unknown>): boolean {
  const plans = Array.isArray(map.plans) ? (map.plans as Record<string, unknown>[]) : [];
  const actions = Array.isArray(map.actions) ? (map.actions as Record<string, unknown>[]) : [];
  const activePlans = plans.filter((p) => String(p.title ?? "").trim());
  const activeActions = actions.filter((a) => {
    const title = String(a.title ?? "").trim();
    return title && a.status !== "rejected";
  });
  return activePlans.length > 0 && activeActions.length > 0;
}

function ensureDraftHasPlansAndActions(
  map: Record<string, unknown>,
  focusList: BoardRow[],
  boardPayload: BoardPayloadRow[],
): Record<string, unknown> {
  map.focuses = focusesFromBoards(focusList);
  if (hasActivePlansAndActions(map)) return map;
  const starter = buildStarterPlansAndActions(focusList, boardPayload);
  if (!hasActivePlansAndActions(map)) {
    map.plans = starter.plans;
    map.actions = starter.actions;
  }
  return map;
}

function draftMapResponse(
  focusList: BoardRow[],
  boardPayload: BoardPayloadRow[],
  partial?: Record<string, unknown>,
) {
  const map = ensureDraftHasPlansAndActions(
    scrubMapTitles(buildGuaranteedDraftMap(focusList, boardPayload, partial)),
    focusList,
    boardPayload,
  );
  return new Response(JSON.stringify(map), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function finalizeAiDraftMap(
  parsed: Record<string, unknown>,
  focusList: BoardRow[],
  boardPayload: BoardPayloadRow[],
): Record<string, unknown> {
  const now = new Date().toISOString();
  const reviewRaw = (parsed.review_cycle ?? parsed.quarterly_reset) as Record<string, unknown> | undefined;
  const draft: Record<string, unknown> = {
    version: 2 as const,
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Palette drafted this from your workspace. Review before finalizing.",
    analysis_status: "draft_ready",
    analyzed_at: now,
    edited_at: null,
    finalized_at: null,
    meta_confidence: typeof parsed.meta_confidence === "number" ? parsed.meta_confidence : null,
    finalized: false,
    review_cycle: {
      title: typeof reviewRaw?.title === "string" ? reviewRaw.title : "Review cycle",
      remind_date:
        typeof reviewRaw?.remind_date === "string" ? reviewRaw.remind_date : defaultReviewDate(),
      remind_time: typeof reviewRaw?.remind_time === "string" ? reviewRaw.remind_time : "09:00",
    },
    focuses: focusesFromBoards(focusList),
    plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    unmapped_items: Array.isArray(parsed.unmapped_items) ? parsed.unmapped_items : [],
    reminders: [],
  };
  return ensureDraftHasPlansAndActions(scrubMapTitles(draft), focusList, boardPayload);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createServiceRoleClient();
    const hasPro = await userHasActivePlottingPro(admin, userData.user.id);
    if (!hasPro) {
      return plottingProRequiredResponse(corsHeaders);
    }

    const body = await req.json();
    const workspace_id = body.workspace_id as string | undefined;
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: boards, error: boardsErr } = await supabase
      .from("boards")
      .select("id, title, role, color_key, layout_json, sort_order")
      .eq("workspace_id", workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    if (boardsErr || !boards?.length) {
      return new Response(JSON.stringify({ error: "No boards in workspace" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boardRows = boards as BoardRow[];
    const focusList = focusBoards(boardRows);
    if (!focusList.length) {
      return new Response(JSON.stringify({ error: "No focus boards in workspace" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boardPayload = boardRows.map((b) => {
      const content = collectBoardPayloadFromLayout(b.layout_json);
      return {
        board_id: b.id,
        board_title: b.title,
        role: b.role,
        color_key: b.color_key,
        ...content,
      };
    });

    const corpus = boardPayload
      .map((b) => {
        const parts = [
          ...b.text_elements,
          ...b.sticky_note_text,
          ...b.checklist_rows,
          ...b.structure_labels,
          ...b.dates,
          ...b.image_tags,
        ];
        return `${b.board_title} (${b.role}, ${b.color_key}): ${parts.join(" | ")}`;
      })
      .join("\n");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!screenBoardsCorpus(corpus)) {
      return draftMapResponse(focusList, boardPayload);
    }

    const focusIds = focusList.map((b, i) => ({
      focus_id: `focus-${i + 1}`,
      board_id: b.id,
      board_title: b.title,
    }));

    const prompt = `You are drafting a first-pass ACTION MAP for palette plotting from the user's actual Vision workspace.

The user will review and edit everything before any reminders go live. Do not auto-finalize.

Workspace boards:
${JSON.stringify(boardPayload, null, 2)}

Focus slots (use exactly these ids and board titles):
${JSON.stringify(focusIds, null, 2)}

Visible columns: Focus | Plan | Action

CHANNEL RULES — ONE reminder type per Action (not multi-select):
- Each action gets exactly one of: calendar, email, or sms
- Default: email
- calendar: scheduled follow-through — appointments, deadlines, due dates, date-specific work
- email: soft accountability — longer details, weekly reviews, summaries, non-urgent check-ins
- sms: stronger nudge — short, high-priority only; OFF by default unless clearly urgent
- Do NOT pair channels. Never set calendar+email, email+sms, or all three on one action.

SMS RULES (only when reminder_type is sms):
- sms_text max 70 characters, ASCII, no emoji, no links, no motivational fluff
- derive sms_text from the action title only — short practical nudge
- if reminder_type is not sms, sms_text must be null
- Never use generic copy like "return to your practice", "check your board", or "open the app"

AI BEHAVIOR — Action Map extraction:
The Action page turns Vision boards into Focus / Plan / Action follow-through. Extract real next steps from board text, sticky notes, checklist/structure rows, dates and The Plan board (role "plan").

MANDATORY OUTPUT:
- Always return version 2 with non-empty plans and actions arrays.
- Never return needs_more_content, blocked, or empty plans/actions.
- focus titles must match board titles exactly (do not rename).
- If content is thin, draft starter plans and actions from each focus board title and theme (confidence 0.35-0.55).
- Each focus needs at least 1 plan and 1-2 actions — e.g. board "Beauty & Wellness" -> plan "Beauty & Wellness routine", actions "Weekly beauty reset", "Book one self-care slot".

Do NOT invent generic accountability filler. Never create:
- "Review [board title]" / "Review [board] board"
- "Progress toward…" / "More [board title]"
- "Check your board" / "Reflect on…" / motivational or therapy language

Extraction priority:
1. Checklist/structure rows
2. Explicit task verbs (book, buy, schedule, call, email, apply, post, create, clean, workout, order, follow up, pay, send, update, prepare)
3. Dates and time references
4. Purchases, appointments, routines supported by board text

Every plan MUST include 1-4 concrete actions. Prefer board text; when thin, draft editable actions from the plan title and board theme — not review/progress filler.
Each action needs source_evidence quoting actual board text when available.
Keep titles short and editable. Mark uncertain items with lower confidence and source_evidence.

Reminder channel: AI assigns reminder_type only — not Brevo email/SMS copy. Default email. sms_text null unless reminder_type is sms.
No therapy language, manifesting, alignment, or fake specificity.

STRUCTURE:
- 1-3 plans per focus, each with 1-4 actions
- focus titles = board titles (do not rename)
- weight The Plan board (role "plan") for dates, deadlines, purchases, appointments
- all plans/actions status "suggested"
- step_type one of: task, deadline, appointment, purchase, follow_up, review, custom
- cadence on actions: once, daily, weekly, monthly
- timing on actions only: remind_date (YYYY-MM-DD for once), remind_day_of_month, remind_day_of_week, remind_time (HH:mm 24h)

Each action JSON:
{
  "id": "action-1-1",
  "plan_id": "plan-1-1",
  "title": "short concrete title from workspace",
  "step_type": "task",
  "cadence": "weekly",
  "remind_day_of_week": "monday",
  "remind_time": "09:00",
  "status": "suggested",
  "kind": "action",
  "confidence": 0.8,
  "source_evidence": "From: Career board",
  "reminder_enabled": true,
  "reminder_type": "email",
  "channels": { "calendar": false, "email": true, "sms": false },
  "sms_text": null
}

Return JSON only:
{
  "version": 2,
  "summary": "Palette drafted this from your workspace. Review before finalizing.",
  "analysis_status": "draft_ready",
  "meta_confidence": 0.0,
  "finalized": false,
  "review_cycle": { "title": "Review cycle", "remind_date": "YYYY-MM-DD", "remind_time": "09:00" },
  "focuses": [{ "id": "focus-1", "board_id": "uuid", "title": "board title" }],
  "plans": [{ "id": "plan-1-1", "focus_id": "focus-1", "title": "...", "cadence": "monthly", "remind_day_of_month": null, "remind_day_of_week": null, "remind_time": null, "status": "suggested" }],
  "actions": [ ... ],
  "unmapped_items": [{ "text": "...", "reason": "..." }],
  "reminders": []
}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Return valid JSON only.\n\n${BOARDS_AI_SAFETY_POLICY}\n\n${ACTION_MAP_EXTRACTION_POLICY}`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("OpenAI error:", await aiRes.text());
      return draftMapResponse(focusList, boardPayload);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return draftMapResponse(focusList, boardPayload);
    }

    const map = finalizeAiDraftMap(parsed, focusList, boardPayload);

    return new Response(JSON.stringify(map), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "accountability map failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
