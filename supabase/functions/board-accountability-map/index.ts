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

type ActionItemStatus = "suggested" | "accepted" | "rejected";

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
      if (role === "add-row" || role === "checkbox") continue;
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

function buildFlowMap(boards: BoardRow[], summary?: string) {
  const focuses = focusBoards(boards);
  const planBoard = boards.find((b) => b.role === "plan");
  const planTexts = planBoard ? collectTextsFromLayout(planBoard.layout_json).texts : [];

  const allPlans: Record<string, unknown>[] = [];
  const allActions: Record<string, unknown>[] = [];
  const focusNodes = focuses.map((board, i) => {
    const { texts } = collectTextsFromLayout(board.layout_json);
    const headline = pickHeadline(texts, board.title);
    const detail = texts.map((t) => naturalizeTitle(t)).find((t) => t && t !== headline);
    const focusId = `focus-${i + 1}`;
    const plan1 = `plan-${i + 1}-1`;
    const plan2 = `plan-${i + 1}-2`;

    allPlans.push({
      id: plan1,
      focus_id: focusId,
      title: sanitizeNodeTitle(headline, board.title),
      cadence: "monthly",
      remind_day_of_month: null,
      remind_day_of_week: null,
      remind_time: null,
      status: "suggested",
    });
    allPlans.push({
      id: plan2,
      focus_id: focusId,
      title: planTexts[i] ? sanitizeNodeTitle(planTexts[i], `More ${board.title}`) : `More ${board.title}`,
      cadence: "monthly",
      remind_day_of_month: null,
      remind_day_of_week: null,
      remind_time: null,
      status: "suggested",
    });

    allActions.push({
      id: `action-${i + 1}-1`,
      plan_id: plan1,
      title: detail ? detail.slice(0, 60) : `Progress on ${headline}`,
      cadence: "weekly",
      remind_day_of_month: null,
      remind_day_of_week: "wednesday",
      remind_time: "15:00",
      status: "suggested",
      kind: "action",
    });
    allActions.push({
      id: `action-${i + 1}-2`,
      plan_id: plan1,
      title: `Review ${board.title} board`,
      cadence: "monthly",
      remind_day_of_month: 1,
      remind_day_of_week: null,
      remind_time: "09:00",
      status: "suggested",
      kind: "action",
    });

    return {
      id: focusId,
      board_id: board.id,
      title: board.title,
    };
  });

  return scrubMapTitles(
    {
      version: 2 as const,
      summary:
        summary ??
        "Review the map for each focus — remove what does not fit, add your own, then finalize reminders.",
      finalized: false,
      review_cycle: {
        title: "Accountability review",
        remind_date: defaultReviewDate(),
        remind_time: "09:00",
      },
      focuses: focusNodes,
      plans: allPlans,
      actions: allActions,
      reminders: [] as Record<string, unknown>[],
    },
    focusNodes,
  );
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
  return isJunkBoardText(t) ? "" : t;
}

function sanitizeNodeTitle(title: string, fallback: string): string {
  const cleaned = naturalizeTitle(title);
  return cleaned || fallback;
}

function pickHeadline(texts: string[], fallback: string): string {
  for (const raw of texts) {
    const t = naturalizeTitle(raw);
    if (t) return t.slice(0, 80);
  }
  return fallback;
}

function scrubMapTitles(
  map: Record<string, unknown>,
  focuses: { id: string; title: string }[],
): Record<string, unknown> {
  const focusName = (id: string) => focuses.find((f) => f.id === id)?.title ?? "Focus";
  const plans = Array.isArray(map.plans)
    ? (map.plans as Record<string, unknown>[]).map((p) => ({
        ...p,
        title: sanitizeNodeTitle(String(p.title ?? ""), focusName(String(p.focus_id ?? ""))),
      }))
    : [];
  const planTitle = (id: string) => {
    const p = plans.find((row) => String(row.id ?? "") === id);
    return p ? String(p.title ?? "Action") : "Action";
  };
  const actions = Array.isArray(map.actions)
    ? (map.actions as Record<string, unknown>[]).map((a) => ({
        ...a,
        title: sanitizeNodeTitle(String(a.title ?? ""), planTitle(String(a.plan_id ?? ""))),
      }))
    : [];
  return { ...map, plans, actions };
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
        texts: texts.slice(0, 24),
        image_count: imageCount,
      };
    });

    const corpus = boardPayload
      .map((b) => `${b.title} (${b.role}): ${b.texts.join(" | ")}`)
      .join("\n");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey || !screenBoardsCorpus(corpus)) {
      return new Response(JSON.stringify(buildFlowMap(boardRows)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const focusIds = focusList.map((b, i) => ({
      focus_id: `focus-${i + 1}`,
      board_id: b.id,
      board_title: b.title,
    }));

    const prompt = `You are building a Palette Plotting ACTION MAP from a workspace (up to 3 focus boards + The Plan).

Board content:
${JSON.stringify(boardPayload, null, 2)}

Focus slots (use exactly these):
${JSON.stringify(focusIds, null, 2)}

The visible map zones are: Focuses | Plans | Actions.

Rules:
- Return version 2 JSON with: review_cycle, focuses, plans, actions (NOT monthly_goals/weekly_actions/daily_actions).
- Focus titles = board titles — do not rename.
- Weight The Plan board (role "plan") for plan and action suggestions.
- 2-3 plans per focus. Plans are names only — title + focus_id. No scheduling on plans.
- 1-3 actions per plan. Actions link via plan_id and carry reminder timing (cadence + day + time).
- All plans and actions status "suggested". Every action kind is "action" (no micro-actions).
- Titles must be natural and specific — complete first-pass suggestions the user can edit.
- Never include UI chrome like "+ add line", "add row", or placeholder instructions in titles.
- Fill every plan and action with a real title derived from board content.

Bad titles: "Monthly goal: ...", "Weekly touchpoint — + add line", "5-minute action toward", "+ add line", empty strings
Good plan titles: "Healthier Eating", "Career growth", "More HAPPY"
Good action titles: "Mediterranean meals", "Walk outside after lunch", "Review HAPPY board"

Timing fields on actions only (no ISO datetimes):
- action cadence monthly: remind_day_of_month (1-31 or -1), remind_time HH:mm
- action cadence weekly: remind_day_of_week (lowercase), remind_time HH:mm
- action cadence daily: remind_time HH:mm only

Plans still include cadence/remind fields in JSON for schema compat — use monthly, null timing.

review_cycle: title, remind_date (YYYY-MM-DD ~3 months out), remind_time 09:00

Return JSON only:
{
  "version": 2,
  "summary": "2 sentences",
  "finalized": false,
  "review_cycle": { "title": "Accountability review", "remind_date": "YYYY-MM-DD", "remind_time": "09:00" },
  "focuses": [{ "id": "focus-1", "board_id": "uuid", "title": "board title" }],
  "plans": [{
    "id": "plan-1-1",
    "focus_id": "focus-1",
    "title": "Healthier Eating",
    "cadence": "monthly",
    "remind_day_of_month": null,
    "remind_day_of_week": null,
    "remind_time": null,
    "status": "suggested"
  }],
  "actions": [{
    "id": "action-1-1",
    "plan_id": "plan-1-1",
    "title": "Mediterranean meals",
    "cadence": "weekly",
    "remind_day_of_month": null,
    "remind_day_of_week": "monday",
    "remind_time": "15:00",
    "status": "suggested",
    "kind": "action"
  }],
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
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      return new Response(JSON.stringify(buildFlowMap(boardRows)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify(buildFlowMap(boardRows)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasPlans = Array.isArray(parsed.plans) && parsed.plans.length > 0;
    const hasLegacy = Array.isArray(parsed.monthly_goals) && parsed.monthly_goals.length > 0;

    if (parsed.version !== 2 || !Array.isArray(parsed.focuses) || (!hasPlans && !hasLegacy)) {
      const summary = typeof parsed.summary === "string" ? parsed.summary : undefined;
      return new Response(JSON.stringify(buildFlowMap(boardRows, summary)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reviewRaw = (parsed.review_cycle ?? parsed.quarterly_reset) as Record<string, unknown> | undefined;

    const map = scrubMapTitles(
      {
        version: 2 as const,
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : "Review the map for each focus, then finalize.",
        finalized: false,
        review_cycle: {
          title:
            typeof reviewRaw?.title === "string"
              ? reviewRaw.title
              : "Accountability review",
          remind_date:
            typeof reviewRaw?.remind_date === "string"
              ? reviewRaw.remind_date
              : defaultReviewDate(),
          remind_time:
            typeof reviewRaw?.remind_time === "string"
              ? reviewRaw.remind_time
              : "09:00",
        },
        focuses: parsed.focuses,
        plans: hasPlans ? parsed.plans : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        reminders: [],
      },
      parsed.focuses as { id: string; title: string }[],
    );

    if (!hasPlans && hasLegacy) {
      return new Response(JSON.stringify(buildFlowMap(boardRows, map.summary)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
