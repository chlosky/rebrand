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

function collectTextsFromLayout(layout: unknown): { texts: string[]; imageCount: number } {
  const texts: string[] = [];
  let imageCount = 0;
  const walk = (items: unknown[]) => {
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      if (typeof o.text === "string") {
        const t = o.text.trim();
        if (t.length > 1) texts.push(t);
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

function cadenceDays(cadence: string): number {
  if (cadence === "daily") return 1;
  if (cadence === "weekly") return 7;
  if (cadence === "monthly") return 30;
  if (cadence === "quarterly") return 90;
  return 7;
}

function fallbackMap(boards: BoardRow[]) {
  const sorted = [...boards].sort((a, b) => {
    if (a.role === "plan" && b.role !== "plan") return -1;
    if (b.role === "plan" && a.role !== "plan") return 1;
    return a.sort_order - b.sort_order;
  });

  const goals = sorted.map((board, i) => {
    const { texts, imageCount } = collectTextsFromLayout(board.layout_json);
    const headline = texts[0] ?? board.title;
    const detail = texts.slice(1, 4).join("; ") || "Review board imagery and statements each quarter.";
    const imageNote =
      imageCount > 0 ? ` Revisit ${imageCount} visual anchor${imageCount === 1 ? "" : "s"} on this board.` : "";

    return {
      id: `goal-${i + 1}`,
      title: headline.slice(0, 120),
      board_id: board.id,
      board_title: board.title,
      board_role: board.role,
      priority: board.role === "plan" ? "high" : "medium",
      rationale: `From ${board.title}: ${detail}${imageNote}`.slice(0, 280),
      quarterly: [
        {
          title: `Quarterly accountability check & reset — ${board.title}`,
          monthly: [
            {
              title: `Monthly progress review (${board.title})`,
              weekly: [
                {
                  title: `Weekly touchpoint aligned to ${headline.slice(0, 40)}`,
                  daily: [`Daily 5-minute action toward ${headline.slice(0, 50)}`],
                },
              ],
            },
          ],
        },
      ],
    };
  });

  const reminders = goals.flatMap((g) => [
    {
      title: `Quarterly reset: ${g.title}`,
      cadence: "quarterly",
      goal_title: g.title,
      days_from_now: 90,
      channels: ["email"],
    },
    {
      title: `Weekly check-in: ${g.title}`,
      cadence: "weekly",
      goal_title: g.title,
      days_from_now: 7,
      channels: ["email"],
    },
  ]);

  return {
    summary:
      "Mapped each board to a goal tree with quarterly accountability, then monthly, weekly, and daily steps. Add more statements on your boards and re-analyze for a richer map.",
    goals,
    reminders: reminders.slice(0, 12),
  };
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
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

    const boardPayload = (boards as BoardRow[]).map((b) => {
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
      return new Response(JSON.stringify(fallbackMap(boards as BoardRow[])), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are building an accountability map from a Palette Plotting workspace (focus boards + The Plan).

Board content (titles, statements, image counts):
${JSON.stringify(boardPayload, null, 2)}

Rules:
- Derive core GOALS from board titles, text statements, and implied meaning of images (image_count > 0 means visual goals matter).
- Weight The Plan board (role "plan") as the primary source for dated goals and accountability; map focus boards as supporting life areas.
- Each goal must reference board_id from the input.
- Branch each goal: quarterly accountability check & reset → monthly milestones → weekly habits → daily micro-actions (1-3 daily items).
- Be concrete and imperative; no therapy or medical advice.

Return JSON only:
{
  "summary": "2-3 sentences",
  "goals": [{
    "id": "goal-1",
    "title": "string",
    "board_id": "uuid from input",
    "board_title": "string",
    "board_role": "focus|plan",
    "priority": "high|medium",
    "rationale": "string",
    "quarterly": [{
      "title": "Quarterly accountability...",
      "monthly": [{
        "title": "Monthly...",
        "weekly": [{
          "title": "Weekly...",
          "daily": ["Daily action"]
        }]
      }]
    }]
  }],
  "reminders": [{
    "title": "string",
    "cadence": "daily|weekly|monthly|quarterly",
    "goal_title": "string",
    "days_from_now": number,
    "channels": ["email"] or ["email","sms"]
  }]
}

Include 8-20 reminders across cadences. Plan-board goals should have more reminders.`;

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
        temperature: 0.45,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      return new Response(JSON.stringify(fallbackMap(boards as BoardRow[])), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify(fallbackMap(boards as BoardRow[])), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];
    const reminders = (Array.isArray(parsed.reminders) ? parsed.reminders : []).map(
      (r: { title?: string; cadence?: string; goal_title?: string; days_from_now?: number; channels?: string[] }) => ({
        title: typeof r.title === "string" ? r.title : "Board check-in",
        cadence: typeof r.cadence === "string" ? r.cadence : "weekly",
        goal_title: typeof r.goal_title === "string" ? r.goal_title : "",
        days_from_now:
          typeof r.days_from_now === "number"
            ? r.days_from_now
            : cadenceDays(typeof r.cadence === "string" ? r.cadence : "weekly"),
        channels: Array.isArray(r.channels) ? r.channels.filter((c) => c === "email" || c === "sms") : ["email"],
      }),
    );

    return new Response(
      JSON.stringify({
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        goals,
        reminders,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "accountability map failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
