import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createServiceRoleClient,
  plottingProRequiredResponse,
  userHasActivePlottingPro,
} from "../_shared/requirePlottingPro.ts";

import {
  BOARDS_AI_SAFETY_POLICY,
  screenBoardsUserInput,
} from "../_shared/boardsAiGuardrails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatTurn = { role: "user" | "assistant"; content: string };

const COLOR_PALETTE = `Palette Plotting board colors (pick color_key for board background vibe):
- rose_gold (#F5E1E3) — warmth, romance, self-love, gentle ambition
- light_pink (#FDE8F0) — soft, nurturing, feminine calm
- neon_pink (#FFE0F0) — bold energy, confidence, playful drive
- sky_blue (#E3F4FC) — clarity, calm focus, open sky thinking
- red (#FCE4E6) — urgency, passion, decisive action
- yellow (#FFF8DC) — optimism, creativity, morning energy
- green (#E0F5EA) — growth, health, steady progress
- light_green (#EDFCEB) — fresh starts, nature, ease
- blue (#E0EBFF) — professionalism, trust, deep work
- orange (#FFE8D6) — enthusiasm, social warmth, momentum
- clear (#FAFAFA) — minimal, neutral canvas
- white_opaque (#FFFFFF) — clean plan board, structure
- black_opaque (#F5F5F5) — contrast, sophistication, editorial`;

const DESIGN_CAPABILITIES = `You are the board Guide inside a visual planning board for Palette Plotting.

Your job is to help the user decide what to put on the board, then apply changes only when the user gives a direct command or confirms a proposal.

You MUST respond with valid JSON only:
{
  "reply": "Short practical message (under 60 words)",
  "reply_without_action": "Optional — use when actions is empty and reply should not imply anything was added",
  "actions": [ ...0-8 actions to apply immediately... ],
  "proposed_actions": [ ...0-8 actions to suggest but NOT apply until user confirms... ]
}

Action types (normalized coords 0-1 on a 1080×1350 artboard):

1. set_color — change board background
   { "type": "set_color", "color_key": "orange" }
   color_key must be one of: rose_gold, light_pink, neon_pink, sky_blue, red, yellow, green, light_green, blue, orange, clear, white_opaque, black_opaque
   For coral/warm requests use color_key "orange".

2. add_text — Statement (headline or label)
   { "type": "add_text", "text": "Embrace Joy", "x": 0.12, "y": 0.14, "font_size": 40, "color": "#171717" }

3. add_sticky — Sticky note
   { "type": "add_sticky", "text": "Daily Gratitude", "x": 0.14, "y": 0.32, "fill": "#FFF4A8" }

4. add_diagram — Checklist or Priority grid (internal type only; never say "diagram" in replies)
   { "type": "add_diagram", "diagram": "eisenhower", "x": 0.52, "y": 0.2, "w": 0.42, "h": 0.44 }
   diagram: "eisenhower" = Priority grid | "checklist" = Checklist

5. kanban_seed — ONLY when board layout_mode is kanban
6. gantt_seed — ONLY when board layout_mode is gantt

User-facing names in replies:
- Statement (not "text")
- Sticky note
- Checklist
- Priority grid (never "Eisenhower diagram")

Behavior rules:
- Do NOT make board changes for vague or emotional requests. Ask one useful question. Return "actions": [].
- Vague examples: "I need help", "help me", "make this better", "make it happier", "make this feel productive", "organize this for me", "what should I do with this board".
- For vague prompts, good reply: "Of course. What do you want this board to help with first — planning tasks, shaping the vibe, or mapping purchases?"
- Direct commands apply immediately via "actions": e.g. "make this board coral", "add a statement that says Embrace Joy", "add a priority grid".
- If you want multiple changes from a non-specific prompt, ask first. Put the bundle in "proposed_actions", NOT "actions". Reply: "Want me to apply that?"
- Never say you added, placed, plotted, changed, or created something unless you return matching "actions" for a direct command.
- Keep replies short and practical. No design-therapy language. No "fosters clarity", "happiness goals", or similar filler.
- If the user only wants to chat, return empty actions and proposed_actions.
- Prefer one change at a time unless the user asked for several explicitly.

${COLOR_PALETTE}`;

const SYSTEM = `${DESIGN_CAPABILITIES}

${BOARDS_AI_SAFETY_POLICY}`;

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
    const board_id = body.board_id as string | undefined;
    const message = (body.message as string | undefined)?.trim();
    const history = (Array.isArray(body.history) ? body.history : []) as ChatTurn[];

    if (!board_id || !message) {
      return new Response(JSON.stringify({ error: "board_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputScreen = screenBoardsUserInput(message);
    if (!inputScreen.ok) {
      return new Response(JSON.stringify({ reply: inputScreen.reply, actions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: board, error: boardErr } = await supabase
      .from("boards")
      .select("id, title, role, layout_mode, layout_json, color_key, workspace_id")
      .eq("id", board_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (boardErr || !board) {
      return new Response(JSON.stringify({ error: "Board not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: siblings } = await supabase
      .from("boards")
      .select("title, role, layout_mode, color_key")
      .eq("workspace_id", board.workspace_id)
      .eq("user_id", userData.user.id)
      .order("sort_order", { ascending: true });

    const objects = (board.layout_json as { objects?: { type?: string; text?: string }[] })?.objects ?? [];
    const textSnippets = objects
      .map((o) => (typeof o.text === "string" ? o.text : ""))
      .filter((t) => t.trim().length > 1)
      .slice(0, 20);

    const structured = board.layout_json as { editor?: string; columns?: unknown[]; tasks?: unknown[] };
    const layoutHint =
      structured.editor === "kanban"
        ? `Kanban: ${JSON.stringify(structured.columns ?? []).slice(0, 600)}`
        : structured.editor === "gantt"
          ? `Gantt: ${JSON.stringify(structured.tasks ?? []).slice(0, 600)}`
          : textSnippets.length
            ? `Canvas text: ${textSnippets.join(" | ")}`
            : "Canvas is mostly empty.";

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          reply: "What would you like to add or change on this board?",
          actions: [],
          proposed_actions: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const context = `Active board: "${board.title}" (${board.role}, layout_mode: ${board.layout_mode ?? "vision"}, color_key: ${board.color_key}).
Workspace boards: ${(siblings ?? []).map((b) => `${b.title} [${b.color_key}/${b.layout_mode}]`).join(", ") || "none"}.
${layoutHint}`;

    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Board context:\n${context}` },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      throw new Error("AI request failed");
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content?.trim() ?? "{}";
    let parsed: {
      reply?: string;
      reply_without_action?: string;
      actions?: unknown[];
      proposed_actions?: unknown[];
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, actions: [], proposed_actions: [] };
    }

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "What would you like to add or change on this board?";
    const reply_without_action =
      typeof parsed.reply_without_action === "string" && parsed.reply_without_action.trim()
        ? parsed.reply_without_action.trim()
        : undefined;
    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 14) : [];
    const proposed_actions = Array.isArray(parsed.proposed_actions)
      ? parsed.proposed_actions.slice(0, 14)
      : [];

    return new Response(JSON.stringify({ reply, reply_without_action, actions, proposed_actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "chat failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
