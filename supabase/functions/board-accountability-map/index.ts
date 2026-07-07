import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";
import { BOARDS_AI_SAFETY_POLICY, screenBoardsCorpus } from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BoardRow = {
  id: string;
  title: string;
  role: string;
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

function collectTextsFromLayout(layout: unknown): { texts: string[]; imageCount: number } {
  const texts: string[] = [];
  let imageCount = 0;
  const walk = (items: unknown[]) => {
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const role = String(o.structureRole ?? "");
      if (role === "add-row" || role === "add-button" || role === "checkbox") continue;
      if (typeof o.text === "string") {
        const t = o.text.trim();
        if (t.length > 1 && !isJunkBoardText(t)) texts.push(t);
      }
      const type = String(o.type ?? "").toLowerCase();
      if (type === "image" || type.includes("image")) imageCount += 1;
      if (Array.isArray(o.objects)) walk(o.objects);
    }
  };
  const objs = (layout as { objects?: unknown[] })?.objects;
  if (Array.isArray(objs)) walk(objs);
  return { texts, imageCount };
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
  if (t === "review board" || t === "review cycle" || t === "daily gratitude") return true;
  if (t === "accountability review") return true;
  if (/^review\s+(the\s+)?(focus\s+)?board(\s+\d+)?\.?$/.test(t)) return true;
  if (/^review\s+focus\s+board\s*\d*\.?$/.test(t)) return true;
  if (/^weekly\s+review(\s+(of|for))?\s+(the\s+)?(focus\s+)?board/.test(t)) return true;
  if (/^check\s+(in\s+on\s+)?(the\s+)?(focus\s+)?board/.test(t)) return true;
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

function workspaceHasEnoughContent(boardPayload: { texts: string[]; image_count: number }[]): boolean {
  const textChars = boardPayload.reduce((sum, b) => sum + b.texts.join(" ").length, 0);
  const imageCount = boardPayload.reduce((sum, b) => sum + b.image_count, 0);
  return textChars >= 24 || imageCount >= 2;
}

function needsMoreContentResponse() {
  return new Response(
    JSON.stringify({
      status: "needs_more_content",
      message: "Not enough workspace content to draft a useful action map.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
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
      .select("id, title, role, layout_json, sort_order")
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
      const { texts, imageCount } = collectTextsFromLayout(b.layout_json);
      return {
        id: b.id,
        title: b.title,
        role: b.role,
        texts: texts.slice(0, 32),
        image_count: imageCount,
      };
    });

    if (!workspaceHasEnoughContent(boardPayload)) {
      return needsMoreContentResponse();
    }

    const corpus = boardPayload
      .map((b) => `${b.title} (${b.role}): ${b.texts.join(" | ")}`)
      .join("\n");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey || !screenBoardsCorpus(corpus)) {
      return needsMoreContentResponse();
    }

    const focusIds = focusList.map((b, i) => ({
      focus_id: `focus-${i + 1}`,
      board_id: b.id,
      board_title: b.title,
    }));

    const prompt = `You are drafting a first-pass ACTION MAP for Palette Plotting from the user's actual Vision workspace.

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

AI BEHAVIOR:
- Use only content supported by the workspace — do not invent focus areas or filler goals
- No generic "Daily Gratitude", "Review board", or placeholder actions unless the workspace supports them
- No therapy language, manifesting, alignment, or fake specificity
- Keep titles short and editable
- Prefer concrete actions over vague motivation
- Mark uncertain items with lower confidence (0.4-0.6) and source_evidence
- If workspace is too thin, return { "status": "needs_more_content", "message": "..." }

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
            content: `Return valid JSON only.\n\n${BOARDS_AI_SAFETY_POLICY}`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("OpenAI error:", await aiRes.text());
      return needsMoreContentResponse();
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return needsMoreContentResponse();
    }

    if (parsed.status === "needs_more_content") {
      return needsMoreContentResponse();
    }

    const hasPlans = Array.isArray(parsed.plans) && parsed.plans.length > 0;
    const hasActions = Array.isArray(parsed.actions) && parsed.actions.length > 0;

    if (parsed.version !== 2 || !Array.isArray(parsed.focuses) || !hasPlans || !hasActions) {
      return needsMoreContentResponse();
    }

    const reviewRaw = (parsed.review_cycle ?? parsed.quarterly_reset) as Record<string, unknown> | undefined;
    const now = new Date().toISOString();

    const map = scrubMapTitles(
      {
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
        focuses: parsed.focuses,
        plans: parsed.plans,
        actions: parsed.actions,
        unmapped_items: Array.isArray(parsed.unmapped_items) ? parsed.unmapped_items : [],
        reminders: [],
      },
    );

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
